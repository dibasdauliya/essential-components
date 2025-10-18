import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { createRef, Ref, ref } from "lit/directives/ref.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

// -- Monaco Editor Imports --
import * as monaco from "monaco-editor";
import styles from "monaco-editor/min/vs/editor/editor.main.css?inline";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

@customElement("py-code-editor")
export class PyCodeEditor extends LitElement {
  private container: Ref<HTMLElement> = createRef();
  private outputRef: Ref<HTMLElement> = createRef();

  editor?: monaco.editor.IStandaloneCodeEditor;
  pyodide: any = null;

  @property({ type: String }) code: string = 'print("Hello, World!")';
  @property({ type: String }) theme?: string;

  @state() private pyodideReady: boolean = false;
  @state() private isRunning: boolean = false;
  @state() private statusText: string = "Loading Python...";
  @state() private statusType: string = "loading";
  @state() private output: string = "Loading Python...";

  private installedPackages = new Set<string>();

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 600px;
      background: #1e1e1e;
      color: #d4d4d4;
      font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
      border: 1px solid #3e3e3e;
      border-radius: 8px;
      overflow: hidden;
    }

    .py-ide-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .py-ide-header {
      background: #2d2d30;
      padding: 8px 16px;
      border-bottom: 1px solid #3e3e3e;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .py-ide-status {
      font-size: 12px;
      color: #cccccc;
    }

    .py-ide-status.ready {
      color: #4ade80;
    }

    .py-ide-status.loading {
      color: #fbbf24;
    }

    .py-ide-status.error {
      color: #f87171;
    }

    .py-ide-main {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    .py-ide-editor-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #3e3e3e;
      min-width: 240px;
    }

    .py-ide-editor-container {
      flex: 1;
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    #the-editor {
      min-height: 520px;
    }

    .py-ide-controls {
      background: #2d2d30;
      padding: 8px 16px;
      border-top: 1px solid #3e3e3e;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .py-ide-button {
      background: #0e639c;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
    }

    .py-ide-button:hover {
      background: #1177bb;
    }

    .py-ide-button:disabled {
      background: #3e3e3e;
      color: #888888;
      cursor: not-allowed;
    }

    .py-ide-button.secondary {
      background: #464647;
      color: #cccccc;
    }

    .py-ide-button.secondary:hover {
      background: #5a5a5c;
    }

    .py-ide-output-section {
      flex: 1;
      min-width: 240px;
      display: flex;
      flex-direction: column;
      background: #252526;
    }

    .py-ide-output-header {
      background: #2d2d30;
      padding: 8px 16px;
      border-bottom: 1px solid #3e3e3e;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .py-ide-output-title {
      font-size: 13px;
      font-weight: 500;
    }

    .py-ide-output-content {
      flex: 1;
      padding: 16px;
      font-family: inherit;
      font-size: 13px;
      line-height: 1.4;
      overflow-y: auto;
      white-space: normal;
      color: #d4d4d4;
    }

    .py-ide-output-content img {
      max-width: 100%;
      height: auto;
      margin: 10px 0;
      border-radius: 4px;
    }

    .console-input {
      background: transparent;
      border: none;
      color: inherit;
      font-family: inherit;
      font-size: inherit;
      outline: none;
      width: auto;
    }

    @media (max-width: 768px) {
      .py-ide-main {
        flex-direction: column;
      }

      .py-ide-output-section {
        height: 200px;
        border-right: none;
        border-top: 1px solid #3e3e3e;
      }

      .py-ide-editor-section {
        border-right: none;
      }
    }
  `;

  render() {
    return html`
      <style>
        ${styles}
      </style>
      <div class="py-ide-container">
        <div class="py-ide-header">
          <div class="py-ide-status ${this.statusType}">${this.statusText}</div>
        </div>

        <div class="py-ide-main">
          <div class="py-ide-editor-section">
            <div class="py-ide-editor-container">
              <main id="the-editor" ${ref(this.container)}></main>
            </div>

            <div class="py-ide-controls">
              <button
                class="py-ide-button"
                @click=${this.handleRun}
                ?disabled=${!this.pyodideReady || this.isRunning}
              >
                ${this.isRunning ? "Running..." : "Run"}
              </button>
            </div>
          </div>

          <div class="py-ide-output-section">
            <div class="py-ide-output-header">
              <div class="py-ide-output-title">Output</div>
              <button
                class="py-ide-button secondary"
                @click=${this.clearOutput}
                style="padding: 4px 8px; font-size: 11px;"
              >
                Clear
              </button>
            </div>
            <div class="py-ide-output-content" ${ref(this.outputRef)}>
              ${unsafeHTML(this.formatOutputForDisplay(this.output))}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private getTheme() {
    if (this.theme) return this.theme;
    if (this.isDark()) return "vs-dark";
    return "vs-light";
  }

  private isDark() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  firstUpdated() {
    this.initializeEditor();
    this.loadPyodide();
  }

  private initializeEditor() {
    if (!this.container.value) return;

    this.editor = monaco.editor.create(this.container.value, {
      value: this.code,
      language: "python",
      theme: this.getTheme(),
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      tabSize: 4,
      insertSpaces: true,
    });

    this.editor.getModel()!.onDidChangeContent(() => {
      this.code = this.editor!.getValue();
      this.dispatchEvent(
        new CustomEvent("input", {
          detail: { content: this.code },
        })
      );
    });

    this.editor.onDidBlurEditorText(() => {
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: { content: this.code },
        })
      );
    });

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        monaco.editor.setTheme(this.getTheme());
      });
  }

  private async loadPyodide() {
    try {
      // @ts-ignore
      const loadPyodide = (
        await import(
          "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.mjs"
        )
      ).loadPyodide;

      this.pyodide = await loadPyodide();
      this.pyodide.registerJsModule("editor_mod", {
        requestInput: this.requestInput.bind(this),
      });
      this.updateStatus("Installing packages...", "loading");

      await this.pyodide.loadPackage("micropip");

      // Setup Python environment with input handling
      await this.pyodide.runPythonAsync(`
        import warnings
        import sys
        import builtins
        from io import StringIO
        import asyncio
        import ast
        from ast import *
        import copy
        import editor_mod
        
        warnings.filterwarnings("ignore", category=DeprecationWarning)
        warnings.filterwarnings("ignore", category=FutureWarning)
        
        async def browser_input(prompt_text=""):
            result = await editor_mod.requestInput(str(prompt_text))
            return result
        
        builtins.input = browser_input
        
        def fix_parents(node, parent=None):
            setattr(node, 'parent', parent)
            for child in iter_child_nodes(node):
                fix_parents(child, node)
        
        class AsyncInputTransformer(NodeTransformer):
            def visit_Call(self, node):
                self.generic_visit(node)
                if isinstance(node.func, Name) and node.func.id == 'input':
                    return Await(value=node)
                return node
        
        def propagate_async(tree):
            changed = True
            async_funcs = set()
            while changed:
                changed = False
                new_async = set()
                for node in walk(tree):
                    if isinstance(node, (FunctionDef, AsyncFunctionDef)):
                        has_await = False
                        calls_async = False
                        for child in walk(node):
                            if isinstance(child, Await):
                                has_await = True
                            if isinstance(child, Call) and isinstance(child.func, Name) and child.func.id in async_funcs:
                                calls_async = True
                        if has_await or calls_async:
                            new_async.add(node.name)
                            if not isinstance(node, AsyncFunctionDef):
                                changed = True
                async_funcs.update(new_async)
                
                class MakeAsync(NodeTransformer):
                    def visit_FunctionDef(self, node):
                        self.generic_visit(node)
                        if node.name in async_funcs:
                            async_node = AsyncFunctionDef(
                                name=node.name,
                                args=node.args,
                                body=node.body,
                                decorator_list=node.decorator_list,
                                returns=node.returns,
                                type_comment=node.type_comment
                            )
                            return copy_location(async_node, node)
                        return node
                
                tree = MakeAsync().visit(tree)
                
                fix_parents(tree)
                
                class AddAwaitToCalls(NodeTransformer):
                    def visit_Call(self, node):
                        self.generic_visit(node)
                        if isinstance(node.func, Name) and node.func.id in async_funcs:
                            if not isinstance(getattr(node, 'parent', None), Await):
                                changed = True
                                return Await(value=node)
                        return node
                
                tree = AddAwaitToCalls().visit(tree)
            return tree
        
        def transform_code(code):
            try:
                tree = parse(code)
                tree = AsyncInputTransformer().visit(tree)
                tree = propagate_async(tree)
                return unparse(tree)
            except SyntaxError as e:
                raise Exception(f"Syntax Error in code: {str(e)}")
      `);

      // Install common packages
      const commonPackages = ["requests", "numpy", "matplotlib"];

      for (const pkg of commonPackages) {
        try {
          await this.pyodide.runPythonAsync(`
            import micropip
            await micropip.install("${pkg}")
          `);
          this.installedPackages.add(pkg);
        } catch (error) {
          console.warn(`Failed to install ${pkg}:`, error);
        }
      }

      // Configure matplotlib
      await this.setupMatplotlib();

      this.pyodideReady = true;
      this.updateStatus("Ready", "ready");
      this.updateOutput("Ready to run Python code.");
    } catch (error) {
      console.error("Error loading Pyodide:", error);
      this.updateStatus("Error loading Python", "error");
      this.updateOutput("Error loading Python: " + error);
    }
  }

  private async setupMatplotlib() {
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

  private async requestInput(prompt: string): Promise<string> {
    const cleanPrompt = prompt.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Append the prompt directly to the output element
    if (this.outputRef.value) {
      const promptSpan = document.createElement("span");
      promptSpan.innerHTML = cleanPrompt;
      this.outputRef.value.appendChild(promptSpan);
    }

    const inputContainer = document.createElement("span");
    const inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.classList.add("console-input");
    inputContainer.appendChild(inputEl);
    this.outputRef.value!.appendChild(inputContainer);
    inputEl.focus();

    return new Promise((resolve) => {
      inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const value = inputEl.value;
          const escapedValue = value
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

          // Remove the input element
          inputEl.remove();

          // Replace the container with just the value text
          inputContainer.innerHTML = escapedValue;

          this.outputRef.value!.scrollTop = this.outputRef.value!.scrollHeight;

          resolve(value);
        }
      });
    });
  }

  private async handleRun() {
    if (!this.pyodideReady || this.isRunning) return;

    this.isRunning = true;
    this.updateOutput("");

    // Clear the actual DOM content to remove any lingering input elements
    if (this.outputRef.value) {
      this.outputRef.value.innerHTML = "";
    }

    this.dispatchEvent(
      new CustomEvent("submit", {
        detail: { content: this.code },
      })
    );

    let execCode = ""; // Declare outside to make it accessible in catch block

    try {
      // Transform the code
      const escapedCode = this.code.replace(/'''/g, "\\'\\'\\'");
      await this.pyodide.runPythonAsync(
        `transformed = transform_code('''${escapedCode}''')`
      );
      let transformed = this.pyodide.globals.get("transformed");

      // Indent and wrap in async main
      const indented = transformed
        .split("\n")
        .map((line: string) => "  " + line)
        .join("\n");
      execCode = `
async def main():
${indented}
await main()
      `;

      let outputBuffer = "";
      let errorBuffer = "";

      this.pyodide.setStdout({
        batched: (s: string) => {
          if (
            !s.includes("InsecureRequestWarning") &&
            !s.includes("urllib3/connectionpool.py") &&
            !s.includes("warnings.warn") &&
            !s.includes("certificate verification")
          ) {
            outputBuffer += s + "\\n";
            // Clear DOM and re-render from buffer
            if (this.outputRef.value) {
              this.outputRef.value.innerHTML = this.formatOutputForDisplay(
                outputBuffer + (errorBuffer ? "\\n" + errorBuffer : "")
              );
            }
          }
        },
      });

      this.pyodide.setStderr({
        batched: (s: string) => {
          if (
            !s.includes("InsecureRequestWarning") &&
            !s.includes("urllib3/connectionpool.py") &&
            !s.includes("warnings.warn") &&
            !s.includes("certificate verification")
          ) {
            errorBuffer += s + "\\n";
            // Clear DOM and re-render from buffer
            if (this.outputRef.value) {
              this.outputRef.value.innerHTML = this.formatOutputForDisplay(
                outputBuffer + (errorBuffer ? "\\n" + errorBuffer : "")
              );
            }
          }
        },
      });

      await this.pyodide.runPythonAsync(execCode);

      let finalOutput = outputBuffer.trim();
      if (errorBuffer.trim()) {
        finalOutput += (finalOutput ? "\\n" : "") + errorBuffer.trim();
      }

      if (finalOutput === "") {
        this.updateOutput("=== Output ===\\n(empty)");
      } else {
        this.updateOutput(`=== Output ===\\n${finalOutput}`);
      }
    } catch (err) {
      const errorString = String(err);
      // Auto-install missing modules
      const moduleNotFoundMatch = errorString.match(
        /ModuleNotFoundError.*?'([^']+)'/
      );

      if (moduleNotFoundMatch) {
        const missingModule = moduleNotFoundMatch[1];
        this.updateOutput(
          `Module '${missingModule}' not found. Installing automatically...\\n`
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

          const currentOutput = this.output;
          this.updateOutput(
            currentOutput +
              `\\nSuccessfully installed ${missingModule}\\nRetrying code execution...\\n`
          );

          // Retry execution with transformed code
          let retryOutputBuffer = "";
          this.pyodide.setStdout({
            batched: (s: string) => {
              if (
                !s.includes("InsecureRequestWarning") &&
                !s.includes("urllib3/connectionpool.py")
              ) {
                retryOutputBuffer += s + "\\n";
                this.updateOutput(retryOutputBuffer);
              }
            },
          });

          await this.pyodide.runPythonAsync(execCode); // use the same execCode
          const retryOutput = retryOutputBuffer.trim();

          const prevOutput = this.output;
          this.updateOutput(
            prevOutput +
              `\\nCode executed successfully after installing ${missingModule}` +
              (retryOutput ? `:\\n${retryOutput}` : "")
          );
        } catch (retryErr) {
          const prevOutput = this.output;
          this.updateOutput(
            prevOutput +
              `\\nCode failed after installing ${missingModule}:\\n${this.formatError(
                String(retryErr)
              )}`
          );
        }
      } else {
        const cleanError = this.formatError(errorString);
        this.updateOutput(this.output + `Error:\\n${cleanError}`);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private formatError(error: string): string {
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

  private updateStatus(text: string, type: string) {
    this.statusText = text;
    this.statusType = type;
  }

  private updateOutput(content: string) {
    this.output = content;
    this.requestUpdate();

    // Scroll to bottom after update
    setTimeout(() => {
      if (this.outputRef.value) {
        this.outputRef.value.scrollTop = this.outputRef.value.scrollHeight;
      }
    }, 0);
  }

  private formatOutputForDisplay(content: string): string {
    // Convert escaped newlines to actual HTML line breaks
    // Also preserve any HTML (like matplotlib images)
    return content.replace(/\\n/g, "\n").replace(/\n/g, "<br>").trim();
  }

  private clearOutput() {
    this.updateOutput(
      this.pyodideReady ? "Ready to run Python code." : "Loading Python..."
    );
  }

  // Public API methods
  setValue(value: string) {
    this.code = value;
    if (this.editor) {
      this.editor.setValue(value);
    }
  }

  getValue(): string {
    return this.editor ? this.editor.getValue() : this.code;
  }

  getOutput(): string {
    return this.output;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.editor) {
      this.editor.dispose();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "py-code-editor": PyCodeEditor;
  }
}
