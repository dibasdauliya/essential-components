/**
 * UIManager - Handles UI rendering, styling, and DOM manipulation
 */
export class UIManager {
  constructor(shadowRoot, showSaveButton = true) {
    this.shadowRoot = shadowRoot;
    this.showSaveButton = showSaveButton;
    this._activeTimeouts = new Set();
  }

  // Update save button visibility setting
  updateSaveButtonSetting(showSaveButton) {
    this.showSaveButton = showSaveButton;
  }

  // Render the main UI structure
  render() {
    const saveButtonHtml = this.showSaveButton
      ? '<button class="py-ide-button secondary" id="saveBtn" style="margin-left:auto;">Save</button>'
      : "";

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
                ${saveButtonHtml}
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

  // Update save button visibility dynamically
  updateSaveButtonVisibility() {
    const controlsContainer = this.shadowRoot.querySelector(".py-ide-controls");
    if (!controlsContainer) return;

    const saveBtn = controlsContainer.querySelector("#saveBtn");

    if (this.showSaveButton && !saveBtn) {
      // Add save button
      const newSaveBtn = document.createElement("button");
      newSaveBtn.className = "py-ide-button secondary";
      newSaveBtn.id = "saveBtn";
      newSaveBtn.style.marginLeft = "auto";
      newSaveBtn.textContent = "Save";
      controlsContainer.appendChild(newSaveBtn);
      return newSaveBtn;
    } else if (!this.showSaveButton && saveBtn) {
      // Remove save button
      saveBtn.remove();
      return null;
    }
    return saveBtn;
  }

  // Update status indicator
  updateStatus(text, type) {
    const status = this.shadowRoot.getElementById("status");
    if (status) {
      status.textContent = text;
      status.className = `py-ide-status ${type}`;
    }
  }

  // Update output content
  updateOutput(content) {
    const output = this.shadowRoot.getElementById("output");
    if (!output) return;

    if (typeof content === "function") {
      output.innerHTML = content(output.innerHTML);
    } else {
      output.innerHTML = content;
    }
    output.scrollTop = output.scrollHeight;
  }

  // Update button state with visual feedback
  updateButtonState(
    buttonId,
    isActive,
    activeText,
    inactiveText,
    showCheckmark = false
  ) {
    const button = this.shadowRoot.getElementById(buttonId);
    if (!button) return;

    const checkSvg =
      '<svg viewBox="0 0 16 16" width="14" height="14" style="vertical-align: -2px; margin-left:6px; fill:#4ade80;"><path d="M6.173 13.727L.946 8.5l1.414-1.414 3.813 3.813 7.466-7.466 1.414 1.414z"/></svg>';

    if (isActive) {
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent || inactiveText;
      }
      button.textContent = activeText;
      button.disabled = true;
    } else {
      if (showCheckmark) {
        button.innerHTML = `${inactiveText} ${checkSvg}`;
        const timeout = setTimeout(() => {
          this._activeTimeouts.delete(timeout);
          const btn = this.shadowRoot?.getElementById(buttonId);
          if (btn) {
            btn.textContent = btn.dataset.originalText || inactiveText;
            btn.disabled = false;
          }
        }, 1200);
        this._activeTimeouts.add(timeout);
      } else {
        button.textContent = button.dataset.originalText || inactiveText;
        button.disabled = false;
      }
    }
  }

  // Setup resizer for panes
  setupResizer() {
    const divider = this.shadowRoot.getElementById("divider");
    const editorPane = this.shadowRoot.getElementById("editorPane");
    const outputPane = this.shadowRoot.getElementById("outputPane");

    if (!divider || !editorPane || !outputPane) return;

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

  // Clear output
  clearOutput(defaultText = "Ready to run Python code.") {
    this.updateOutput(defaultText);
  }

  // Clean up timeouts
  destroy() {
    this._activeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this._activeTimeouts.clear();
  }
}
