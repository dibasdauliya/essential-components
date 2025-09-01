/**
 * PyodideRunner - Handles Python code execution and Pyodide management
 */
export class PyodideRunner {
  constructor(onStatusUpdate, onOutputUpdate) {
    this.onStatusUpdate = onStatusUpdate;
    this.onOutputUpdate = onOutputUpdate;
    this.pyodide = null;
    this.pyodideReady = false;
    this.isRunning = false;
    this.installedPackages = new Set();
  }

  async loadPyodide() {
    try {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";

      script.onload = async () => {
        try {
          this.pyodide = await loadPyodide();
          this.onStatusUpdate("Installing packages...", "loading");

          await this.pyodide.loadPackage("micropip");

          // Setup Python environment -- handles input
          await this.pyodide.runPythonAsync(`
              import warnings
              import sys
              import builtins
              from io import StringIO
              
              warnings.filterwarnings("ignore", category=DeprecationWarning)
              warnings.filterwarnings("ignore", category=FutureWarning)
              
              def browser_input(prompt_text=""):
                  import js
                  result = js.prompt(str(prompt_text))
                  if result is None:
                      raise KeyboardInterrupt("Input cancelled by user")
                  return str(result)
              
              builtins.input = browser_input
            `);

          // install common packages
          const commonPackages = ["requests", "numpy", "matplotlib"];
          const installedSet = new Set();

          for (const pkg of commonPackages) {
            try {
              await this.pyodide.runPythonAsync(`
                  import micropip
                  await micropip.install("${pkg}")
                `);
              installedSet.add(pkg);
            } catch (error) {
              console.warn(`Failed to install ${pkg}:`, error);
            }
          }

          // configure matplotlib and warnings
          await this.setupMatplotlib();

          this.installedPackages = installedSet;
          this.pyodideReady = true;
          this.onStatusUpdate("Ready", "ready");
          this.onOutputUpdate("Ready to run Python code.");
        } catch (error) {
          this.onStatusUpdate("Error loading Python", "error");
          this.onOutputUpdate("Error loading Python: " + error);
        }
      };

      script.onerror = () => {
        this.onStatusUpdate("Failed to load", "error");
        this.onOutputUpdate("Failed to load Pyodide script");
      };

      document.head.appendChild(script);
    } catch (error) {
      this.onStatusUpdate("Error", "error");
      this.onOutputUpdate("Error: " + error);
    }
  }

  // to display plots images in the output and manage warnings
  async setupMatplotlib() {
    try {
      await this.pyodide.runPythonAsync(`
          try:
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            
            import warnings
            warnings.filterwarnings("ignore", category=UserWarning, module="urllib3")
          except ImportError:
            pass
            
          try:
            import requests
            from requests.packages.urllib3.exceptions import InsecureRequestWarning
            requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
            
            _original_request = requests.request
            def patched_request(*args, **kwargs):
                try:
                    if 'timeout' not in kwargs:
                        kwargs['timeout'] = 30
                    return _original_request(*args, **kwargs)
                except Exception as e:
                    error_msg = str(e)
                    if "Connection aborted" in error_msg or "HTTPException" in error_msg:
                        raise Exception("Network Error: Unable to connect to the server.")
                    elif "timeout" in error_msg.lower():
                        raise Exception("Timeout Error: The request took too long to complete.")
                    elif "SSL" in error_msg or "certificate" in error_msg:
                        raise Exception("SSL Error: There was a problem with the secure connection.")
                    else:
                        raise e
            requests.request = patched_request
          except ImportError:
            pass
          
          try:
            import matplotlib
            import matplotlib.pyplot as plt
            import io
            import base64
            
            matplotlib.use('Agg')
            
            _original_show = plt.show
            
            def capture_show(*args, **kwargs):
                try:
                    fig = plt.gcf()
                    
                    if not fig.get_axes():
                        return
                    
                    buf = io.BytesIO()
                    fig.savefig(buf, format='png', dpi=150, bbox_inches='tight', 
                              facecolor='white', edgecolor='none')
                    buf.seek(0)
                    
                    img_data = base64.b64encode(buf.getvalue()).decode()
                    
                    print(f'<img src="data:image/png;base64,{img_data}" style="max-width: 100%; height: auto; margin: 10px 0;"/>')
                    
                    plt.clf()
                    
                except Exception as e:
                    print(f"Error displaying plot: {e}")
                    _original_show(*args, **kwargs)
            
            plt.show = capture_show
            
          except ImportError:
            pass
        `);
    } catch (configError) {
      console.warn("Warning: Could not configure matplotlib:", configError);
    }
  }

  async runCode(code, onRunningChange) {
    if (!this.pyodideReady || this.isRunning) return;

    this.isRunning = true;
    if (onRunningChange) onRunningChange(true);
    this.onOutputUpdate("Running code...\n");

    try {
      let outputBuffer = "";
      let errorBuffer = "";

      this.pyodide.setStdout({
        batched: (s) => {
          if (
            !s.includes("InsecureRequestWarning") &&
            !s.includes("urllib3/connectionpool.py") &&
            !s.includes("warnings.warn") &&
            !s.includes("certificate verification")
          ) {
            outputBuffer += s + "\n";
          }
        },
      });

      this.pyodide.setStderr({
        batched: (s) => {
          if (
            !s.includes("InsecureRequestWarning") &&
            !s.includes("urllib3/connectionpool.py") &&
            !s.includes("warnings.warn") &&
            !s.includes("certificate verification")
          ) {
            errorBuffer += s + "\n";
          }
        },
      });

      await this.pyodide.runPythonAsync(code);

      let finalOutput = outputBuffer.trim();
      if (errorBuffer.trim()) {
        finalOutput += (finalOutput ? "\n" : "") + errorBuffer.trim();
      }

      if (finalOutput === "") {
        this.onOutputUpdate("=== Output ===\n(empty)");
      } else {
        this.onOutputUpdate(`=== Output ===\n${finalOutput}`);
      }
    } catch (err) {
      const errorString = String(err);

      // Auto-install missing modules
      const moduleNotFoundMatch = errorString.match(
        /ModuleNotFoundError.*?'([^']+)'/
      );
      if (moduleNotFoundMatch) {
        const missingModule = moduleNotFoundMatch[1];
        this.onOutputUpdate(
          `Module '${missingModule}' not found. Installing automatically...\n`
        );

        try {
          await this.pyodide.runPythonAsync(`
              import warnings
              with warnings.catch_warnings():
                  warnings.simplefilter("ignore")
                  import micropip
                  await micropip.install("${missingModule}")
            `);

          this.installedPackages.add(missingModule);
          this.onOutputUpdate(
            (prev) =>
              prev +
              `\nSuccessfully installed ${missingModule}\nRetrying code execution...\n`
          );

          // Retry execution
          let retryOutputBuffer = "";
          this.pyodide.setStdout({
            batched: (s) => {
              if (
                !s.includes("InsecureRequestWarning") &&
                !s.includes("urllib3/connectionpool.py")
              ) {
                retryOutputBuffer += s + "\n";
              }
            },
          });

          await this.pyodide.runPythonAsync(code);
          const retryOutput = retryOutputBuffer.trim();
          this.onOutputUpdate(
            (prev) =>
              prev +
              `\nCode executed successfully after installing ${missingModule}` +
              (retryOutput ? `:\n${retryOutput}` : "")
          );
        } catch (retryErr) {
          this.onOutputUpdate(
            (prev) =>
              prev +
              `\nCode failed after installing ${missingModule}:\n${this.formatError(
                String(retryErr)
              )}`
          );
        }
      } else {
        const cleanError = this.formatError(errorString);
        this.onOutputUpdate(`Error:\n${cleanError}`);
      }
    } finally {
      this.isRunning = false;
      if (onRunningChange) onRunningChange(false);
    }
  }

  formatError(error) {
    let cleanError = error;

    if (
      cleanError.includes("Connection aborted") ||
      cleanError.includes("HTTPException")
    ) {
      if (cleanError.includes("A network error occurred")) {
        return "Network Error: Unable to connect to the server. Please check your internet connection or try again later.";
      }
      return "Connection Error: The request was interrupted. This could be due to network issues or server problems.";
    }

    if (cleanError.includes("SSL") || cleanError.includes("certificate")) {
      return "SSL Error: There was a problem with the secure connection. This is often due to server configuration issues.";
    }

    if (cleanError.includes("timeout") || cleanError.includes("TimeoutError")) {
      return "Timeout Error: The request took too long to complete. The server might be slow or unreachable.";
    }

    if (cleanError.includes("requests.exceptions")) {
      if (cleanError.includes("ConnectionError")) {
        return "Connection Error: Unable to establish a connection to the server.";
      }
      if (cleanError.includes("RequestException")) {
        return "Request Error: The HTTP request failed. Please check the URL and try again.";
      }
    }

    cleanError = cleanError.replace(
      /File "\/lib\/python[\d.]+\/site-packages\/[^"]*", line \d+, in [^\n]*\n/g,
      ""
    );

    return cleanError;
  }

  isReady() {
    return this.pyodideReady;
  }

  getIsRunning() {
    return this.isRunning;
  }
}
