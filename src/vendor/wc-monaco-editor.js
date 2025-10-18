/* eslint no-undef: 0 */
import "./monaco/editor.main.js";

// Get the base path for workers - construct path dynamically to avoid Webpack static analysis
function getWorkerUrl(filename) {
  try {
    // Build the path string dynamically so Webpack doesn't try to resolve it at build time
    const parts = ["monaco", "workers", filename];
    const workerPath = parts.join("/");
    return new URL(workerPath, import.meta.url).href;
  } catch (e) {
    // Fallback for environments without import.meta.url
    return `monaco/workers/${filename}`;
  }
}

// eslint-disable-next-line
self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    switch (label) {
      case "json":
        return getWorkerUrl("json.worker.js");
      case "css":
        return getWorkerUrl("css.worker.js");
      case "html":
        return getWorkerUrl("html.worker.js");
      case "typescript":
      case "javascript":
        return getWorkerUrl("ts.worker.js");
      default:
        return getWorkerUrl("editor.worker.js");
    }
  },
};

export class WCMonacoEditor extends HTMLElement {
  static get observedAttributes() {
    return ["src", "value"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.__initialized) {
      return;
    }
    if (oldValue !== newValue) {
      this[name] = newValue;
    }
  }

  get src() {
    return this.getAttribute("src");
  }
  set src(value) {
    this.setAttribute("src", value);
    this.setSrc();
  }

  get value() {
    return this.editor.getValue();
  }
  set value(value) {
    this.editor.setValue(value);
  }

  get tabSize() {
    return this.editor.getModel()._options.tabSize;
  }
  set tabSize(value) {
    this.editor.getModel().updateOptions({ tabSize: value });
  }

  constructor() {
    super();
    this.__initialized = false;
    this.editor = null;
  }

  async connectedCallback() {
    this.style.display = "block";
    if (!this.style.width) {
      this.style.width = "100%";
    }
    if (!this.style.height) {
      this.style.height = "100%";
    }

    // Create editor directly in this element (not looking for another element by ID)
    if (this.hasAttribute("config")) {
      const config = await this.fetchConfig(this.getAttribute("config"));
      this.editor = monaco.editor.create(this, config);
    } else {
      this.editor = monaco.editor.create(this, {
        language: this.getAttribute("language"),
        theme: "vs-dark",
        automaticLayout: true,
        lineNumbersMinChars: 3,
        mouseWheelZoom: true,
        fontSize: this.getAttribute("font-size"),
        minimap: { enabled: !this.hasAttribute("no-minimap") },
        wordWrap: this.hasAttribute("word-wrap"),
        wrappingIndent: this.getAttribute("wrap-indent"),
      });
    }

    if (this.hasAttribute("tab-size")) {
      this.tabSize = this.getAttribute("tab-size");
    }

    if (this.hasAttribute("src")) {
      this.setSrc();
    }
    this.__initialized = true;
  }

  async setSrc() {
    const src = this.getAttribute("src");
    const contents = await this.fetchSrc(src);
    this.editor.setValue(contents);
  }

  async fetchSrc(src) {
    const response = await fetch(src);
    return response.text();
  }

  async fetchConfig(config) {
    const response = await fetch(config);
    return response.json();
  }
}

customElements.define("wc-monaco-editor", WCMonacoEditor);
