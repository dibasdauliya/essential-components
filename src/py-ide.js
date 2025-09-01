/**
 * Modular PyIDE Web Component
 * This is the main component that orchestrates all the modules
 */
import { EditorManager } from "./modules/EditorManager.js";
import { FileManager } from "./modules/FileManager.js";
import { PyodideRunner } from "./modules/PyodideRunner.js";
import { StorageManager } from "./modules/StorageManager.js";
import { UIManager } from "./modules/UIManager.js";

class PyIDEWebComponent extends HTMLElement {
  static get observedAttributes() {
    return [
      "storage-key",
      "show-save-button",
      "save-in-local-storage",
      "indent-spaces",
    ];
  }

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    // Initialize with default values - will be updated in connectedCallback
    this.storageKey = "py-ide";
    this.showSaveButton = true;
    this.saveInLocalStorage = true;
    this.indentSpaces = 4;

    // Flags for lifecycle coordination (React/SSR-safe)
    this._loadedFromStorage = false;
    this._parsedInitialFiles = false;
    this._childrenObserver = null;
    this._initialized = false;

    // Initialize managers (will be properly set up in init)
    this.editorManager = null;
    this.fileManager = null;
    this.pyodideRunner = null;
    this.storageManager = null;
    this.uiManager = null;
  }

  // Read attributes and initialize - called after attributes are set
  initializeAttributes() {
    this.storageKey = this.getAttribute("storage-key") || "py-ide";
    this.showSaveButton = this.getAttribute("show-save-button") !== "false";
    this.saveInLocalStorage =
      this.getAttribute("save-in-local-storage") !== "false";
    this.indentSpaces = parseInt(this.getAttribute("indent-spaces")) || 4;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "storage-key":
        this.storageKey = newValue || "py-ide";
        if (this.storageManager) {
          this.storageManager.updateSettings(
            this.storageKey,
            this.saveInLocalStorage
          );
        }
        break;
      case "show-save-button":
        const oldShowSave = this.showSaveButton;
        this.showSaveButton = newValue !== "false";
        // Re-render only the controls if already initialized and value changed
        if (this.uiManager && oldShowSave !== this.showSaveButton) {
          this.uiManager.updateSaveButtonSetting(this.showSaveButton);
          const saveBtn = this.uiManager.updateSaveButtonVisibility();
          if (saveBtn) {
            this.bindSaveButton(saveBtn);
          }
        }
        break;
      case "save-in-local-storage":
        this.saveInLocalStorage = newValue !== "false";
        if (this.storageManager) {
          this.storageManager.updateSettings(
            this.storageKey,
            this.saveInLocalStorage
          );
        }
        break;
      case "indent-spaces":
        this.indentSpaces = parseInt(newValue) || 4;
        if (this.editorManager) {
          this.editorManager.updateIndentSpaces(this.indentSpaces);
        }
        if (this.uiManager) {
          this.uiManager.updateIndentSelector(this.indentSpaces);
        }
        break;
    }
  }

  init() {
    // Initialize managers
    this.storageManager = new StorageManager(
      this.storageKey,
      this.saveInLocalStorage
    );
    this.uiManager = new UIManager(this.shadowRoot, this.showSaveButton);

    // Initialize file manager with callback
    this.fileManager = new FileManager(this.shadowRoot, (activeFile) => {
      if (this.editorManager && activeFile) {
        this.editorManager.setValue(activeFile.content);
      }
    });

    // Initialize PyodideRunner with callbacks
    this.pyodideRunner = new PyodideRunner(
      (text, type) => {
        this.uiManager.updateStatus(text, type);
        // Enable run button when Pyodide is ready
        if (type === "ready") {
          this.uiManager.updateButtonState(
            "runBtn",
            false,
            "Running...",
            "Run"
          );
        }
      },
      (content) => this.uiManager.updateOutput(content)
    );

    // Initialize editor manager with callbacks
    this.editorManager = new EditorManager(
      this.shadowRoot,
      (content) => this.handleEditorInput(content),
      (content) => this.handleEditorChange(content),
      this.indentSpaces
    );

    // Render UI and bind events
    this.uiManager.render();
    this.bindEvents();

    // Load from storage
    this.loadFromStorage();

    // Ensure initial tabs render when there is no saved state
    if (this.fileManager.files && this.fileManager.files.length > 0) {
      this.fileManager.renderFileTabs();
    }

    // Initialize editor after a short delay
    setTimeout(() => this.editorManager.initializeCodeMirror(), 50);
  }

  bindEvents() {
    const runBtn = this.shadowRoot.getElementById("runBtn");
    const clearOutputBtn = this.shadowRoot.getElementById("clearOutputBtn");
    const addFileBtn = this.shadowRoot.getElementById("addFileBtn");
    const saveBtn = this.showSaveButton
      ? this.shadowRoot.getElementById("saveBtn")
      : null;

    runBtn.addEventListener("click", () => this.handleRun());
    clearOutputBtn.addEventListener("click", () => this.clearOutput());
    addFileBtn.addEventListener("click", () => this.fileManager.addFile());

    if (saveBtn) {
      this.bindSaveButton(saveBtn);
    }

    // Setup resizer
    this.uiManager.setupResizer();

    // Setup indent selector
    this.uiManager.setupIndentSelector(this.indentSpaces, (newIndentSpaces) => {
      this.handleIndentChange(newIndentSpaces);
    });
  }

  bindSaveButton(saveBtn) {
    // Remove existing listeners to prevent duplicates
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    newSaveBtn.addEventListener("click", () => this.handleSave());
  }

  // Handle editor input with debouncing
  handleEditorInput(content) {
    this.fileManager.updateActiveFileContent(content);

    const activeFile = this.fileManager.getActiveFile();
    this.dispatchEvent(
      new CustomEvent("input", {
        detail: { content, fileName: activeFile?.name },
      })
    );

    // Auto-save on input
    this.saveToStorage();
  }

  // Handle editor change (when user tabs away)
  handleEditorChange(content) {
    this.fileManager.updateActiveFileContent(content);

    const activeFile = this.fileManager.getActiveFile();
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

    // Update save button state
    this.uiManager.updateButtonState("saveBtn", true, "Saving...", "Save");
    setTimeout(() => {
      this.uiManager.updateButtonState(
        "saveBtn",
        false,
        "Saving...",
        "Save",
        true
      );
    }, 150);
  }

  handleRun() {
    if (!this.pyodideRunner.isReady() || this.pyodideRunner.getIsRunning())
      return;

    const activeFile = this.fileManager.getActiveFile();
    if (!activeFile) return;

    this.dispatchEvent(
      new CustomEvent("submit", {
        detail: {
          content: activeFile.content,
          fileName: activeFile.name,
        },
      })
    );

    // Update run button state
    this.pyodideRunner.runCode(activeFile.content, (isRunning) => {
      this.uiManager.updateButtonState(
        "runBtn",
        isRunning,
        "Running...",
        "Run",
        !isRunning
      );
    });
  }

  handleSave() {
    this.uiManager.updateButtonState("saveBtn", true, "Saving...", "Save");
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
      this.uiManager.updateButtonState(
        "saveBtn",
        false,
        "Saving...",
        "Save",
        true
      );
    }, 150);
  }

  handleIndentChange(newIndentSpaces) {
    this.indentSpaces = newIndentSpaces;

    // Update the editor
    if (this.editorManager) {
      this.editorManager.updateIndentSpaces(newIndentSpaces);
    }

    // Update the attribute (this will trigger attributeChangedCallback but won't cause infinite loop due to the check)
    this.setAttribute("indent-spaces", newIndentSpaces.toString());

    // Save to storage if needed
    this.saveToStorage();

    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent("indent-change", {
        detail: { indentSpaces: newIndentSpaces },
      })
    );
  }

  saveToStorage() {
    if (!this.storageManager || !this.fileManager) return;

    const storageData = {
      ...this.fileManager.getStorageData(),
      lastOutput: this.output,
    };

    this.storageManager.save(storageData);
  }

  loadFromStorage() {
    if (!this.storageManager || !this.fileManager) return;

    const data = this.storageManager.load();
    if (data) {
      const loaded = this.fileManager.loadFromStorageData(data);
      if (loaded) {
        this._loadedFromStorage = true;
        if (data.lastOutput) {
          this.uiManager.updateOutput(data.lastOutput);
        }
      }
    }
  }

  clearOutput() {
    const defaultText = this.pyodideRunner.isReady()
      ? "Ready to run Python code."
      : "Loading Python...";
    this.uiManager.clearOutput(defaultText);
  }

  connectedCallback() {
    // Initialize attributes first (React may have set them after constructor)
    if (!this._initialized) {
      this.initializeAttributes();
      this.init();
      this._initialized = true;
    }

    this.pyodideRunner.loadPyodide();

    // Defer parsing light DOM so React has time to append children
    const tryParseChildren = () => {
      if (this._parsedInitialFiles) return;
      const initialFiles = this.fileManager.parseInitialFilesFromLightDom(this);
      if (initialFiles && initialFiles.length > 0) {
        // Only apply if nothing meaningful was loaded from storage
        if (
          !this._loadedFromStorage ||
          this.fileManager.hasOnlyDefaultContent()
        ) {
          this.fileManager.setCode(initialFiles);
        }
        this._parsedInitialFiles = true;
        if (this._childrenObserver) {
          this._childrenObserver.disconnect();
          this._childrenObserver = null;
        }
      }
    };

    // Try on next microtask and animation frame
    queueMicrotask(tryParseChildren);
    requestAnimationFrame(tryParseChildren);

    // Fallback: observe for late-added children (e.g., React)
    this._childrenObserver = new MutationObserver(() => tryParseChildren());
    this._childrenObserver.observe(this, { childList: true, subtree: true });
  }

  disconnectedCallback() {
    // Clean up all managers
    if (this.editorManager) {
      this.editorManager.destroy();
    }
    if (this.fileManager) {
      this.fileManager.destroy();
    }
    if (this.storageManager) {
      this.storageManager.destroy();
    }
    if (this.uiManager) {
      this.uiManager.destroy();
    }

    // Clean up observers
    if (this._childrenObserver) {
      this._childrenObserver.disconnect();
      this._childrenObserver = null;
    }
  }

  // Public API
  get code() {
    return this.fileManager ? this.fileManager.getCode() : [];
  }

  get output() {
    const outputElement = this.shadowRoot?.getElementById("output");
    return outputElement ? outputElement.textContent : "";
  }

  setCode(filesArray) {
    if (this.fileManager) {
      this.fileManager.setCode(filesArray);
      this.saveToStorage();
    }
  }
}

customElements.define("py-ide", PyIDEWebComponent);

// export for module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = PyIDEWebComponent;
}
