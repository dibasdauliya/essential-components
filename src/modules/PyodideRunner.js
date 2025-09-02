/**
 * PyodideRunner - Handles Python code execution and Pyodide management
 */
export class PyodideRunner {
  constructor(onStatusUpdate, onOutputUpdate, shadowRoot = null) {
    this.onStatusUpdate = onStatusUpdate;
    this.onOutputUpdate = onOutputUpdate;
    this.shadowRoot = shadowRoot;
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

          // Setup Python environment -- basic setup only
          await this.pyodide.runPythonAsync(`
              import warnings
              import sys
              
              warnings.filterwarnings("ignore", category=DeprecationWarning)
              warnings.filterwarnings("ignore", category=FutureWarning)
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
      let debugBuffer = "";

      // Capture stdout for debug messages and fallback
      this.pyodide.setStdout({
        batched: (s) => {
          console.log("Stdout captured:", s);
          debugBuffer += s;
          // Update UI with debug info too
          this.onOutputUpdate(
            `=== Debug ===\n${debugBuffer}\n=== Direct Output ===\n${outputBuffer}`
          );
        },
      });

      // Create a global function for Python to send output directly
      window.pyide_add_output = (text) => {
        console.log("Direct output received:", text); // Debug log
        outputBuffer += text;
        this.onOutputUpdate(
          `=== Debug ===\n${debugBuffer}\n=== Direct Output ===\n${outputBuffer}`
        );
      };

      // Create a synchronous terminal-style input function
      // Capture the shadowRoot in closure
      const shadowRoot = this.shadowRoot;

      // Global variables for synchronous input
      window.pyide_input_result = null;
      window.pyide_input_waiting = false;

      window.pyide_terminal_input = (promptText) => {
        console.log("pyide_terminal_input called with:", promptText);
        console.log("ShadowRoot available:", !!shadowRoot);

        // Get the output element
        if (!shadowRoot) {
          console.log("No shadowRoot available, falling back to prompt");
          return prompt(promptText || "");
        }

        const output = shadowRoot.getElementById("output");
        console.log("Output element found:", output);
        if (!output) {
          console.log("No output element, falling back to prompt");
          return prompt(promptText || ""); // Fallback to regular prompt
        }

        // Reset input state
        window.pyide_input_result = null;
        window.pyide_input_waiting = true;

        // Create input container
        const inputContainer = document.createElement("div");
        inputContainer.style.cssText = `
          display: flex;
          align-items: center;
          margin: 5px 0;
          font-family: 'Courier New', monospace;
        `;

        // Create prompt span
        if (promptText) {
          const promptSpan = document.createElement("span");
          promptSpan.textContent = promptText;
          promptSpan.style.marginRight = "5px";
          inputContainer.appendChild(promptSpan);
        }

        // Create input field
        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.style.cssText = `
          background: transparent;
          border: none;
          color: inherit;
          font-family: inherit;
          font-size: inherit;
          outline: none;
          flex: 1;
          border-bottom: 1px solid currentColor;
        `;

        inputContainer.appendChild(inputField);

        // Add to output
        console.log("Adding input container to output");
        output.appendChild(inputContainer);
        output.scrollTop = output.scrollHeight;

        // Focus input
        console.log("Focusing input field");
        inputField.focus();

        // Handle input submission
        const handleSubmit = () => {
          const value = inputField.value;
          console.log("Input submitted with value:", value);

          // Replace input with the entered value
          const resultSpan = document.createElement("span");
          resultSpan.textContent = value;
          inputContainer.innerHTML = "";
          if (promptText) {
            const promptSpan = document.createElement("span");
            promptSpan.textContent = promptText;
            inputContainer.appendChild(promptSpan);
          }
          inputContainer.appendChild(resultSpan);

          // Set result and stop waiting
          window.pyide_input_result = value;
          window.pyide_input_waiting = false;
        };

        // Submit on Enter
        inputField.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            handleSubmit();
          }
        });

        // Submit on blur (when clicking outside)
        inputField.addEventListener("blur", handleSubmit);

        // Return a synchronous wait function
        return "WAIT_FOR_INPUT";
      };

      // Override Python's print function to send output immediately to JavaScript
      await this.pyodide.runPythonAsync(`
        import js
        import builtins
        import sys
        import time
        
        # Store original functions
        _original_print = builtins.print
        _original_input = builtins.input
        
        def immediate_print(*args, sep=' ', end='\\n', file=None, flush=False):
            # Convert all arguments to strings and join them
            output = sep.join(str(arg) for arg in args) + end
            # Send directly to JavaScript
            js.window.pyide_add_output(output)
        
        def immediate_input(prompt_text=""):
            js.console.log("Python immediate_input called with:", prompt_text)
            
            # Call the synchronous terminal input function
            js.console.log("About to call pyide_terminal_input")
            result = js.window.pyide_terminal_input(prompt_text if prompt_text else "")
            js.console.log("pyide_terminal_input returned:", result)
            
            # If we got the wait signal, wait for user input
            if result == "WAIT_FOR_INPUT":
                js.console.log("Waiting for user input...")
                
                # Busy wait until input is received
                import time
                while js.window.pyide_input_waiting:
                    time.sleep(0.01)  # Small sleep to prevent blocking
                
                # Get the result
                result = js.window.pyide_input_result
                js.console.log("Got user input:", result)
            
            if result is None or result == "":
                # Handle empty input
                result = ""
            
            # Add a newline to the output after input
            js.window.pyide_add_output("\\n")
            return str(result)
        
        # Replace built-in functions
        builtins.print = immediate_print
        builtins.input = immediate_input
      `);

      // Don't use setStdout/setStderr since we're handling output directly

      await this.pyodide.runPythonAsync(code);

      // Clean up
      delete window.pyide_add_output;
      delete window.pyide_terminal_input;
      delete window.pyide_input_result;
      delete window.pyide_input_waiting;

      if (!outputBuffer.trim() && !debugBuffer.trim()) {
        this.onOutputUpdate("=== Output ===\n(empty)");
      } else {
        // Final output with both debug and direct output
        this.onOutputUpdate(
          `=== Debug ===\n${debugBuffer}\n=== Direct Output ===\n${outputBuffer}`
        );
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

  destroy() {
    // Clean up global functions
    if (window.pyide_add_output) {
      delete window.pyide_add_output;
    }
    if (window.pyide_terminal_input) {
      delete window.pyide_terminal_input;
    }
    if (window.pyide_input_result !== undefined) {
      delete window.pyide_input_result;
    }
    if (window.pyide_input_waiting !== undefined) {
      delete window.pyide_input_waiting;
    }
  }
}
