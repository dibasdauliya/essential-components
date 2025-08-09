class PyIDEWebComponent extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this.storageKey = this.getAttribute("storage-key") || "py-ide";
    this.files = [
      {
        id: "main-py",
        name: "main.py",
        content: 'print("Hello, World!")\n',
        lastModified: Date.now(),
      },
    ];
    this.activeFileId = "main-py";
    this.openFiles = ["main-py"];
    this.pyodide = null;
    this.pyodideReady = false;
    this.isRunning = false;
    this.lastOutput = "";
    this.installedPackages = new Set();

    // Debounced input handler
    this.inputTimeout = null;
    this.lastContent = "";

    this.init();
  }
  // Read initial files passed via light DOM children
  parseInitialFilesFromLightDom() {
    try {
      const files = [];

      // Support <py-file name="main.py">...</py-file>
      this.querySelectorAll("py-file[name]").forEach((el) => {
        const name = el.getAttribute("name") || "untitled.py";
        const content = el.textContent || "";
        files.push({ name, content });
      });

      // Support <script type="text/plain" data-filename="main.py">...</script>
      this.querySelectorAll('script[type="text/plain"][data-filename]').forEach(
        (el) => {
          const name = el.getAttribute("data-filename") || "untitled.py";
          const content = el.textContent || "";
          files.push({ name, content });
        }
      );

      return files.length > 0 ? files : null;
    } catch (_) {
      return null;
    }
  }

  initializeCodeMirror() {
    const addStyle = (href) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    };

    const addScript = (src, isModule = false) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        if (isModule) {
          s.type = "module";
        }
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });

    if (!window.__pyide_codemirror_loaded) {
      // CodeMirror CSS
      addStyle(
        "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css"
      );
      addStyle(
        "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-darker.min.css"
      );

      // CodeMirror library and addons
      window.__pyide_codemirror_loaded = addScript(
        "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"
      )
        .then(() =>
          addScript(
            "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js"
          )
        )
        .then(() =>
          addScript(
            "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/closebrackets.min.js"
          )
        )
        .then(() =>
          addScript(
            "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/edit/matchbrackets.min.js"
          )
        )
        .then(() =>
          addScript(
            "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/addon/selection/active-line.min.js"
          )
        );
    }

    Promise.resolve(window.__pyide_codemirror_loaded)
      .then(() => {
        console.log("CodeMirror ready");
        this.initEditor();
      })
      .catch((err) => {
        console.warn("CodeMirror failed to load:", err);
        this.initFallbackEditor();
      });
  }

  initEditor() {
    const editorContainer = this.shadowRoot.getElementById("editorContainer");
    if (!editorContainer) {
      console.error("Editor container not found");
      this.initFallbackEditor();
      return;
    }

    if (this.codeMirror) {
      console.warn("CodeMirror already initialized");
      return;
    }

    const activeFile = this.getActiveFile();
    this.codeMirror = window.CodeMirror(editorContainer, {
      value: activeFile ? activeFile.content : "",
      mode: "python",
      theme: "material-darker",
      lineNumbers: true,
      lineWrapping: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      styleActiveLine: true,
      indentUnit: 4,
      tabSize: 4,
      indentWithTabs: false,
      extraKeys: {
        "Ctrl-Space": "autocomplete",
        Tab: (cm) => {
          if (cm.somethingSelected()) {
            cm.indentSelection("add");
          } else {
            cm.replaceSelection(
              Array(cm.getOption("indentUnit") + 1).join(" ")
            );
          }
        },
      },
    });

    this.codeMirror.on("change", (instance) => {
      this.handleEditorInput(instance.getValue());
    });

    this.codeMirror.on("blur", () => {
      this.handleEditorChange();
    });

    // ensure proper layout after mount
    requestAnimationFrame(() => this.codeMirror && this.codeMirror.refresh());
    setTimeout(() => this.codeMirror && this.codeMirror.refresh(), 100);
    window.addEventListener(
      "resize",
      () => this.codeMirror && this.codeMirror.refresh()
    );
  }

  init() {
    this.render();
    this.bindEvents();
    // Load initial files from user's code
    const initialFiles = this.parseInitialFilesFromLightDom();
    if (initialFiles && initialFiles.length > 0) {
      this.setCode(initialFiles);
    }
    this.loadFromStorage();
    // ensure initial tabs render when there is no saved state
    if (this.files && this.files.length > 0) {
      this.renderFileTabs();
    }
    setTimeout(() => this.initializeCodeMirror(), 50);
  }

  // Fallback textarea editor
  initFallbackEditor() {
    const editorContainer = this.shadowRoot.getElementById("editorContainer");
    if (!editorContainer) return;

    const textarea = document.createElement("textarea");
    textarea.className = "py-ide-editor-fallback";
    textarea.id = "editor";
    textarea.placeholder = "Enter your Python code here...";

    const activeFile = this.getActiveFile();
    if (activeFile) textarea.value = activeFile.content;

    textarea.addEventListener("input", (e) => {
      this.handleEditorInput(e.target.value);
    });

    textarea.addEventListener("blur", () => {
      this.handleEditorChange();
    });

    editorContainer.appendChild(textarea);
  }

  connectedCallback() {
    this.loadPyodide();
  }

  disconnectedCallback() {
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
    }
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
    }
  }

  get code() {
    return this.files.map((file) => ({
      name: file.name,
      content: file.content,
    }));
  }

  get output() {
    return this.lastOutput;
  }

  setCode(filesArray) {
    if (!Array.isArray(filesArray) || filesArray.length === 0) {
      return;
    }

    this.files = [];
    this.openFiles = [];
    this.activeFileId = null;

    // Add new files
    filesArray.forEach((file, index) => {
      const id = `file-${index}-${Math.random().toString(36).substr(2, 9)}`;
      const newFile = {
        id,
        name: file.name || `file${index + 1}.py`,
        content: file.content || "",
        lastModified: Date.now(),
      };

      this.files.push(newFile);
      this.openFiles.push(id);

      // Set first file as active
      if (index === 0) {
        this.activeFileId = id;
      }
    });

    this.loadActiveFile();
    this.renderFileTabs();
    // Persist after setting code
    this.saveToStorage();
  }

  saveToStorage() {
    try {
      const payload = {
        files: this.files.map((f) => ({
          id: f.id,
          name: f.name,
          content: f.content,
          lastModified: f.lastModified,
        })),
        activeFileId: this.activeFileId,
        openFiles: this.openFiles,
        lastOutput: this.lastOutput,
        savedAt: Date.now(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (err) {
      console.warn("PyIDE: Failed to save to localStorage:", err);
    }
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.files) || data.files.length === 0)
        return;

      this.files = data.files.map((f) => ({
        id: f.id,
        name: f.name,
        content: f.content,
        lastModified: f.lastModified || Date.now(),
      }));
      this.activeFileId = data.activeFileId || this.files[0]?.id;
      this.openFiles =
        Array.isArray(data.openFiles) && data.openFiles.length > 0
          ? data.openFiles
          : [this.activeFileId];
      this.lastOutput =
        typeof data.lastOutput === "string" ? data.lastOutput : "";

      // Sync UI
      this.loadActiveFile();
      this.renderFileTabs();
      if (this.lastOutput) {
        this.updateOutput(this.lastOutput);
      }
    } catch (err) {
      console.warn("PyIDE: Failed to load from localStorage:", err);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            width: 100%;
            height: 600px;
            background: #1e1e1e;
            color: #d4d4d4;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
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
          }
  
          .py-ide-divider {
            width: 6px;
            background: #3e3e3e;
            cursor: col-resize;
          }
  
          .py-ide-divider:hover {
            background: #5a5a5c;
          }
  
          .py-ide-file-tabs {
            background: #252526;
            display: flex;
            border-bottom: 1px solid #3e3e3e;
            overflow-x: auto;
          }
  
          .py-ide-file-tab {
            padding: 8px 16px;
            background: #2d2d30;
            border-right: 1px solid #3e3e3e;
            cursor: pointer;
            white-space: nowrap;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
  
          .py-ide-file-tab.active {
            background: #1e1e1e;
            color: #ffffff;
          }
  
          .py-ide-file-tab:hover {
            background:rgba(55, 55, 61, 0.68);
          }
  
          .py-ide-file-tab-close {
            color: #cccccc;
            cursor: pointer;
            padding: 2px;
            border-radius: 2px;
          }
  
          .py-ide-file-tab-close:hover {
            background: #464647;
          }
  
          .py-ide-editor-container {
            flex: 1;
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
  
          .py-ide-editor-wrap {
            position: relative;
            height: 100%;
          }
  
          #editorContainer {
            height: 100%;
            width: 100%;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          }
  
          .CodeMirror {
            height: 100% !important;
          }
  
          .py-ide-editor-fallback {
            width: 100%;
            height: 100%;
            background: #1e1e1e;
            color: #d4d4d4;
            border: none;
            outline: none;
            resize: none;
            font-family: inherit;
            font-size: 14px;
            line-height: 1.5;
            padding: 16px;
            box-sizing: border-box;
          }
  
          /* CodeMirror overrides for dark theme consistency */
          .CodeMirror {
            height: 100%;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            line-height: 1.5;
          }
  
          .CodeMirror-focused .CodeMirror-cursor {
            border-left: 1px solid #d4d4d4;
          }
  
          .CodeMirror-selected {
            background: #264f78;
          }
  
          .CodeMirror-focused .CodeMirror-selected {
            background: #264f78;
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
            flex: 1 1 auto;
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
            white-space: pre-wrap;
            color: #d4d4d4;
          }
  
          .py-ide-output-content img {
            max-width: 100%;
            height: auto;
            margin: 10px 0;
            border-radius: 4px;
          }
  
          .py-ide-add-file {
            background: #464647;
            color: #cccccc;
            border: none;
            padding: 8px;
            cursor: pointer;
            border-right: 1px solid #3e3e3e;
            font-size: 16px;
            font-weight: bold;
          }
  
          .py-ide-add-file:hover {
            background: #5a5a5c;
          }
  
          #fileTabs {
            display: flex;
            flex-wrap: wrap;
          }
  
          @media (max-width: 768px) {
            .py-ide-main {
              flex-direction: column;
            }
            
            .py-ide-divider { display: none; }
  
            .py-ide-output-section {
              width: auto;
              height: 200px;
              border-right: none;
              border-top: 1px solid #3e3e3e;
            }
            
            .py-ide-editor-section {
              border-right: none;
            }
          }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-darker.min.css">
  
        <div class="py-ide-container">
          <div class="py-ide-header">
            <div class="py-ide-status loading" id="status">Loading Python...</div>
          </div>
  
          <div class="py-ide-main">
            <div class="py-ide-editor-section" id="editorPane" style="min-width:240px; flex-basis: 65%;">
              <div class="py-ide-file-tabs">
                <button class="py-ide-add-file" id="addFileBtn" title="Add new file">+</button>
                <div id="fileTabs"></div>
              </div>
  
              <div class="py-ide-editor-container">
                <div class="py-ide-editor-wrap">
                  <div id="editorContainer"></div>
                </div>
              </div>
  
              <div class="py-ide-controls">
                <button class="py-ide-button" id="runBtn" disabled>Run</button>
                <button class="py-ide-button secondary" id="clearBtn">Clear Output</button>
                <button class="py-ide-button secondary" id="saveBtn" style="margin-left:auto;">Save</button>
              </div>
            </div>
  
            <div class="py-ide-divider" id="divider"></div>
  
            <div class="py-ide-output-section" id="outputPane" style="flex-basis: 35%;">
              <div class="py-ide-output-header">
                <div class="py-ide-output-title">Output</div>
                <button class="py-ide-button secondary" id="clearOutputBtn" style="padding: 4px 8px; font-size: 11px;">Clear</button>
              </div>
              <div class="py-ide-output-content" id="output">Loading Python...</div>
            </div>
          </div>
        </div>
      `;
  }

  bindEvents() {
    const runBtn = this.shadowRoot.getElementById("runBtn");
    const clearBtn = this.shadowRoot.getElementById("clearBtn");
    const clearOutputBtn = this.shadowRoot.getElementById("clearOutputBtn");
    const addFileBtn = this.shadowRoot.getElementById("addFileBtn");
    const saveBtn = this.shadowRoot.getElementById("saveBtn");
    const divider = this.shadowRoot.getElementById("divider");
    const editorPane = this.shadowRoot.getElementById("editorPane");
    const outputPane = this.shadowRoot.getElementById("outputPane");

    // Editor events are handled in initEditor() method for CodeMirror
    // Fallback textarea events are handled in initFallbackEditor() method

    runBtn.addEventListener("click", () => {
      this.handleRun();
    });

    clearBtn.addEventListener("click", () => {
      this.clearOutput();
    });

    clearOutputBtn.addEventListener("click", () => {
      this.clearOutput();
    });

    addFileBtn.addEventListener("click", () => {
      this.addFile();
    });

    saveBtn.addEventListener("click", () => {
      this.handleSave();
    });

    // Load initial file
    this.loadActiveFile();

    // Resizer drag logic
    let isDragging = false;
    let startX = 0;
    let startEditorWidth = 0;
    const minEditor = 240;
    const minOutput = 240;

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      const container = this.shadowRoot.querySelector(".py-ide-main");
      const containerRect = container.getBoundingClientRect();
      const newEditorWidth = Math.max(
        minEditor,
        Math.min(containerRect.width - minOutput, startEditorWidth + delta)
      );
      const editorBasis = (newEditorWidth / containerRect.width) * 100;
      const outputBasis = 100 - editorBasis;
      editorPane.style.flexBasis = editorBasis + "%";
      outputPane.style.flexBasis = outputBasis + "%";
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    divider.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startEditorWidth = editorPane.getBoundingClientRect().width;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  // Handle editor input with debouncing
  handleEditorInput(content) {
    const activeFile = this.getActiveFile();
    if (activeFile) {
      activeFile.content = content;
      activeFile.lastModified = Date.now();
    }

    // Debounced input event
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
    }
    this.inputTimeout = setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent("input", {
          detail: { content, fileName: activeFile?.name },
        })
      );
      // Auto-save on input debounce
      this.saveToStorage();
    }, 300);
  }

  // Handle editor change (when user tabs away)
  handleEditorChange() {
    const activeFile = this.getActiveFile();
    if (activeFile && activeFile.content !== this.lastContent) {
      const saveBtn = this.shadowRoot.getElementById("saveBtn");
      const checkSvg =
        '<svg viewBox="0 0 16 16" width="14" height="14" style="vertical-align: -2px; margin-left:6px; fill:#4ade80;"><path d="M6.173 13.727L.946 8.5l1.414-1.414 3.813 3.813 7.466-7.466 1.414 1.414z"/></svg>';
      if (saveBtn) {
        if (!saveBtn.dataset.originalText)
          saveBtn.dataset.originalText = saveBtn.textContent || "Save";
        saveBtn.textContent = "Saving...";
        saveBtn.disabled = true;
      }

      this.lastContent = activeFile.content;
      this.dispatchEvent(
        new CustomEvent("change", {
          detail: {
            content: activeFile.content,
            fileName: activeFile.name,
            fileId: activeFile.id,
          },
        })
      );
      this.saveToStorage();
      setTimeout(() => {
        if (saveBtn) {
          saveBtn.innerHTML = `Saved ${checkSvg}`;
          setTimeout(() => {
            const btn = this.shadowRoot?.getElementById("saveBtn");
            if (btn) {
              btn.textContent = btn.dataset.originalText || "Save";
              btn.disabled = false;
            }
          }, 1200);
        }
      }, 150);
    }
  }

  handleRun() {
    if (!this.pyodideReady || this.isRunning) return;

    const activeFile = this.getActiveFile();
    if (!activeFile) return;

    this.dispatchEvent(
      new CustomEvent("submit", {
        detail: {
          content: activeFile.content,
          fileName: activeFile.name,
        },
      })
    );

    this.runCode(activeFile.content);
  }

  handleSave() {
    const saveBtn = this.shadowRoot.getElementById("saveBtn");
    const checkSvg =
      '<svg viewBox="0 0 16 16" width="14" height="14" style="vertical-align: -2px; margin-left:6px; fill:#4ade80;"><path d="M6.173 13.727L.946 8.5l1.414-1.414 3.813 3.813 7.466-7.466 1.414 1.414z"/></svg>';
    if (saveBtn) {
      if (!saveBtn.dataset.originalText)
        saveBtn.dataset.originalText = saveBtn.textContent || "Save";
      saveBtn.textContent = "Saving...";
      saveBtn.disabled = true;
    }

    this.saveToStorage();

    this.dispatchEvent(
      new CustomEvent("save", {
        detail: {
          files: this.code,
          output: this.output,
          timestamp: new Date().toISOString(),
        },
      })
    );

    setTimeout(() => {
      if (saveBtn) {
        saveBtn.innerHTML = `Saved ${checkSvg}`;
        setTimeout(() => {
          const btn = this.shadowRoot?.getElementById("saveBtn");
          if (btn) {
            btn.textContent = btn.dataset.originalText || "Save";
            btn.disabled = false;
          }
        }, 1200);
      }
    }, 150);
  }

  async loadPyodide() {
    try {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js";

      script.onload = async () => {
        try {
          this.pyodide = await loadPyodide();
          this.updateStatus("Installing packages...", "loading");

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
          this.updateStatus("Ready", "ready");
          this.updateOutput("Ready to run Python code.");
          this.shadowRoot.getElementById("runBtn").disabled = false;
        } catch (error) {
          this.updateStatus("Error loading Python", "error");
          this.updateOutput("Error loading Python: " + error);
        }
      };

      script.onerror = () => {
        this.updateStatus("Failed to load", "error");
        this.updateOutput("Failed to load Pyodide script");
      };

      document.head.appendChild(script);
    } catch (error) {
      this.updateStatus("Error", "error");
      this.updateOutput("Error: " + error);
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

  async runCode(code) {
    if (!this.pyodideReady || this.isRunning) return;

    this.isRunning = true;
    this.updateRunningIndicator(true);
    this.updateOutput("Running code...\n");

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
        this.updateOutput("=== Output ===\n(empty)");
      } else {
        this.updateOutput(`=== Output ===\n${finalOutput}`);
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
          this.updateOutput(
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
          this.updateOutput(
            (prev) =>
              prev +
              `\nCode executed successfully after installing ${missingModule}` +
              (retryOutput ? `:\n${retryOutput}` : "")
          );
        } catch (retryErr) {
          this.updateOutput(
            (prev) =>
              prev +
              `\nCode failed after installing ${missingModule}:\n${this.formatError(
                String(retryErr)
              )}`
          );
        }
      } else {
        const cleanError = this.formatError(errorString);
        this.updateOutput(`Error:\n${cleanError}`);
      }
    } finally {
      this.isRunning = false;
      this.updateRunningIndicator(false);
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

  // file management methods
  getActiveFile() {
    return this.files.find((f) => f.id === this.activeFileId) || null;
  }

  addFile() {
    let name = prompt("Enter file name (e.g., script.py):");
    if (!name) return;

    if (!name.endsWith(".py")) {
      name += ".py";
    }

    const id = "file-" + Math.random().toString(36).substr(2, 9);
    const newFile = {
      id,
      name,
      content: "",
      lastModified: Date.now(),
    };

    this.files.push(newFile);
    this.openFiles.push(id);
    this.selectFile(id);
    this.renderFileTabs();
    this.saveToStorage();
  }

  selectFile(fileId) {
    if (!this.openFiles.includes(fileId)) {
      this.openFiles.push(fileId);
    }
    this.activeFileId = fileId;
    this.loadActiveFile();
    this.renderFileTabs();
    this.saveToStorage();
  }

  closeFile(fileId) {
    const index = this.openFiles.indexOf(fileId);
    if (index > -1) {
      this.openFiles.splice(index, 1);

      // Also remove from files array to fix memory leak
      const fileIndex = this.files.findIndex((f) => f.id === fileId);
      if (fileIndex > -1) {
        this.files.splice(fileIndex, 1);
      }

      if (this.activeFileId === fileId) {
        this.activeFileId =
          this.openFiles.length > 0
            ? this.openFiles[this.openFiles.length - 1]
            : this.files[0]?.id;
        this.loadActiveFile();
      }

      this.renderFileTabs();
      this.saveToStorage();
    }
  }

  loadActiveFile() {
    const activeFile = this.getActiveFile();

    if (activeFile) {
      // update CodeMirror if available
      if (this.codeMirror) {
        this.codeMirror.setValue(activeFile.content);
      } else {
        // fallback to textarea editor
        const editor = this.shadowRoot.getElementById("editor");
        if (editor) {
          editor.value = activeFile.content;
        }
      }

      this.lastContent = activeFile.content;
    }
  }

  renderFileTabs() {
    const container = this.shadowRoot.getElementById("fileTabs");
    const openFiles = this.openFiles
      .map((id) => this.files.find((f) => f.id === id))
      .filter(Boolean);

    container.innerHTML = openFiles
      .map(
        (file) => `
        <div class="py-ide-file-tab ${
          file.id === this.activeFileId ? "active" : ""
        }" 
             data-file-id="${file.id}">
          <span>${file.name}</span>
          <span class="py-ide-file-tab-close" data-close="${file.id}">×</span>
        </div>
      `
      )
      .join("");

    // bind tab events
    container.addEventListener("click", (e) => {
      const fileId = e.target.closest(".py-ide-file-tab")?.dataset.fileId;
      const closeId = e.target.dataset.close;

      if (closeId) {
        e.stopPropagation();
        this.closeFile(closeId);
      } else if (fileId) {
        this.selectFile(fileId);
      }
    });
  }

  // UI update methods
  updateStatus(text, type) {
    const status = this.shadowRoot.getElementById("status");
    status.textContent = text;
    status.className = `py-ide-status ${type}`;
  }

  updateOutput(content) {
    const output = this.shadowRoot.getElementById("output");
    if (typeof content === "function") {
      output.innerHTML = content(output.innerHTML);
    } else {
      output.innerHTML = content;
    }
    this.lastOutput = output.textContent;
    output.scrollTop = output.scrollHeight;
  }

  updateRunningIndicator(isRunning) {
    const runBtn = this.shadowRoot.getElementById("runBtn");
    const original = runBtn?.dataset?.originalText || "Run";
    const checkSvg =
      '<svg viewBox="0 0 16 16" width="14" height="14" style="vertical-align: -2px; margin-left:6px; fill:#4ade80;"><path d="M6.173 13.727L.946 8.5l1.414-1.414 3.813 3.813 7.466-7.466 1.414 1.414z"/></svg>';
    if (!runBtn) return;
    if (isRunning) {
      if (!runBtn.dataset.originalText)
        runBtn.dataset.originalText = runBtn.textContent || "Run";
      runBtn.textContent = "Running...";
      runBtn.disabled = true;
    } else {
      runBtn.innerHTML = `Ran ${checkSvg}`;
      setTimeout(() => {
        const btn = this.shadowRoot?.getElementById("runBtn");
        if (btn) {
          btn.textContent = btn.dataset.originalText || "Run";
          btn.disabled = !this.pyodideReady;
        }
      }, 1200);
    }
  }

  clearOutput() {
    this.updateOutput(
      this.pyodideReady ? "Ready to run Python code." : "Loading Python..."
    );
  }
}

customElements.define("py-ide", PyIDEWebComponent);

// export for module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = PyIDEWebComponent;
}
