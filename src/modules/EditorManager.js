/**
 * EditorManager - Handles CodeMirror initialization and editor operations
 */
export class EditorManager {
  constructor(shadowRoot, onInput, onChange, indentSpaces = 4) {
    this.shadowRoot = shadowRoot;
    this.onInput = onInput;
    this.onChange = onChange;
    this.indentSpaces = indentSpaces;
    this.codeMirror = null;
    this.inputTimeout = null;
    this.lastContent = "";
    this._resizeHandler = null;
    this._activeTimeouts = new Set();
  }

  async initializeCodeMirror() {
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

  initEditor(initialContent = "") {
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

    this.codeMirror = window.CodeMirror(editorContainer, {
      value: initialContent,
      mode: {
        name: "python",
        // Disable strict indentation checking to allow flexible indentation
        singleLineStringErrors: false,
      },
      theme: "material-darker",
      lineNumbers: true,
      lineWrapping: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      styleActiveLine: true,
      indentUnit: this.indentSpaces,
      tabSize: this.indentSpaces,
      indentWithTabs: false,
      smartIndent: false, // Disable smart indentation to prevent strict checking
      extraKeys: {
        "Ctrl-Space": "autocomplete",
        Tab: (cm) => {
          if (cm.somethingSelected()) {
            cm.indentSelection("add");
          } else {
            // Auto-detect indentation of current line or use default
            const cursor = cm.getCursor();
            const line = cm.getLine(cursor.line);
            const indentMatch = line.match(/^(\s*)/);
            const currentIndent = indentMatch ? indentMatch[1] : "";

            // If we're at the beginning of a line, try to match previous non-empty line's indentation
            if (cursor.ch === 0 && cursor.line > 0) {
              for (let i = cursor.line - 1; i >= 0; i--) {
                const prevLine = cm.getLine(i);
                if (prevLine.trim().length > 0) {
                  const prevIndentMatch = prevLine.match(/^(\s*)/);
                  const prevIndent = prevIndentMatch ? prevIndentMatch[1] : "";
                  if (prevIndent.length > 0) {
                    cm.replaceSelection(prevIndent);
                    return;
                  }
                  break;
                }
              }
            }

            // Default to spaces based on indentUnit
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
    const refreshTimeout = setTimeout(() => {
      this._activeTimeouts.delete(refreshTimeout);
      this.codeMirror && this.codeMirror.refresh();
    }, 100);
    this._activeTimeouts.add(refreshTimeout);

    // Clean up previous resize handler if it exists
    if (this._resizeHandler) {
      window.removeEventListener("resize", this._resizeHandler);
    }
    this._resizeHandler = () => this.codeMirror && this.codeMirror.refresh();
    window.addEventListener("resize", this._resizeHandler);
  }

  initFallbackEditor(initialContent = "") {
    const editorContainer = this.shadowRoot.getElementById("editorContainer");
    if (!editorContainer) return;

    const textarea = document.createElement("textarea");
    textarea.className = "py-ide-editor-fallback";
    textarea.id = "editor";
    textarea.placeholder = "Enter your Python code here...";
    textarea.value = initialContent;

    textarea.addEventListener("input", (e) => {
      this.handleEditorInput(e.target.value);
    });

    textarea.addEventListener("blur", () => {
      this.handleEditorChange();
    });

    editorContainer.appendChild(textarea);
  }

  handleEditorInput(content) {
    // Debounced input event
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
      this._activeTimeouts.delete(this.inputTimeout);
    }
    this.inputTimeout = setTimeout(() => {
      this.onInput(content);
      this._activeTimeouts.delete(this.inputTimeout);
    }, 300);
    this._activeTimeouts.add(this.inputTimeout);
  }

  handleEditorChange() {
    const currentContent = this.getValue();
    if (currentContent !== this.lastContent) {
      this.lastContent = currentContent;
      this.onChange(currentContent);
    }
  }

  getValue() {
    if (this.codeMirror) {
      return this.codeMirror.getValue();
    } else {
      const editor = this.shadowRoot.getElementById("editor");
      return editor ? editor.value : "";
    }
  }

  setValue(content) {
    if (this.codeMirror) {
      const currentValue = this.codeMirror.getValue();
      if (currentValue !== content) {
        // Temporarily disable change event to prevent unnecessary operations
        this.codeMirror.off("change");
        this.codeMirror.setValue(content);
        // Re-enable change event
        this.codeMirror.on("change", (instance) => {
          this.handleEditorInput(instance.getValue());
        });
      }
      // Only refresh if actually needed
      requestAnimationFrame(() => {
        if (this.codeMirror) {
          this.codeMirror.refresh();
        }
      });
    } else {
      // fallback to textarea editor
      const editor = this.shadowRoot.getElementById("editor");
      if (editor && editor.value !== content) {
        editor.value = content;
      }
    }
    this.lastContent = content;
  }

  refresh() {
    if (this.codeMirror) {
      this.codeMirror.refresh();
    }
  }

  updateIndentSpaces(indentSpaces) {
    this.indentSpaces = indentSpaces;
    if (this.codeMirror) {
      this.codeMirror.setOption("indentUnit", indentSpaces);
      this.codeMirror.setOption("tabSize", indentSpaces);
    }
  }

  destroy() {
    // Clean up timeouts
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
    }
    this._activeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this._activeTimeouts.clear();

    // Clean up CodeMirror
    if (this.codeMirror) {
      this.codeMirror.toTextArea();
      this.codeMirror = null;
    }

    // Clean up event listeners
    if (this._resizeHandler) {
      window.removeEventListener("resize", this._resizeHandler);
      this._resizeHandler = null;
    }
  }
}
