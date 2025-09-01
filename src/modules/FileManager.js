/**
 * FileManager - Handles file operations, tabs, and file switching
 */
export class FileManager {
  constructor(shadowRoot, onFileChange) {
    this.shadowRoot = shadowRoot;
    this.onFileChange = onFileChange;
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
    this._tabContainerEventListener = null;
  }

  // Parse initial files from light DOM
  parseInitialFilesFromLightDom(element) {
    console.log("Parsing initial files from light DOM");
    try {
      const files = [];

      // Support <py-file name="main.py">...</py-file>
      element.querySelectorAll("py-file[name]").forEach((el) => {
        const name = el.getAttribute("name") || "untitled.py";
        const content = el.textContent.trim() || "";
        files.push({ name, content });
      });

      // Support <script type="text/plain" data-filename="main.py">...</script>
      element
        .querySelectorAll("script[type='text/plain'][data-filename]")
        .forEach((el) => {
          const name = el.getAttribute("data-filename") || "untitled.py";
          const content = el.textContent.trim() || "";
          files.push({ name, content });
        });

      console.log("Parsed files:", files);
      return files.length > 0 ? files : null;
    } catch (e) {
      console.error("Error parsing initial files:", e);
      return null;
    }
  }

  // Set files programmatically
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
  }

  // Get current files in a simple format
  getCode() {
    return this.files.map((file) => ({
      name: file.name,
      content: file.content,
    }));
  }

  // Get the currently active file
  getActiveFile() {
    return this.files.find((f) => f.id === this.activeFileId) || null;
  }

  // Add a new file
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
  }

  // Select a file (make it active)
  selectFile(fileId) {
    // Skip if already the active file
    if (this.activeFileId === fileId) {
      return;
    }

    if (!this.openFiles.includes(fileId)) {
      this.openFiles.push(fileId);
    }
    this.activeFileId = fileId;
    this.loadActiveFile();
    this.renderFileTabs();
  }

  // Close a file
  closeFile(fileId) {
    const index = this.openFiles.indexOf(fileId);
    if (index > -1) {
      this.openFiles.splice(index, 1);

      // Also remove from files array
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
    }
  }

  // Load the active file content
  loadActiveFile() {
    const activeFile = this.getActiveFile();
    if (activeFile && this.onFileChange) {
      this.onFileChange(activeFile);
    }
  }

  // Update the content of the active file
  updateActiveFileContent(content) {
    const activeFile = this.getActiveFile();
    if (activeFile) {
      activeFile.content = content;
      activeFile.lastModified = Date.now();
    }
  }

  // Render file tabs in the UI
  renderFileTabs() {
    const container = this.shadowRoot.getElementById("fileTabs");
    if (!container) return;

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

    // Remove previous event listener to prevent accumulation
    if (this._tabContainerEventListener) {
      container.removeEventListener("click", this._tabContainerEventListener);
    }

    // Create and store new event listener
    this._tabContainerEventListener = (e) => {
      const fileId = e.target.closest(".py-ide-file-tab")?.dataset.fileId;
      const closeId = e.target.dataset.close;

      if (closeId) {
        e.stopPropagation();
        this.closeFile(closeId);
      } else if (fileId) {
        this.selectFile(fileId);
      }
    };

    // Bind the new event listener
    container.addEventListener("click", this._tabContainerEventListener);
  }

  // Load files from storage data
  loadFromStorageData(data) {
    if (!data || !Array.isArray(data.files) || data.files.length === 0) {
      return false;
    }

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

    this.loadActiveFile();
    this.renderFileTabs();
    return true;
  }

  // Get storage data
  getStorageData() {
    return {
      files: this.files.map((f) => ({
        id: f.id,
        name: f.name,
        content: f.content,
        lastModified: f.lastModified,
      })),
      activeFileId: this.activeFileId,
      openFiles: this.openFiles,
    };
  }

  // Check if files contain only default content
  hasOnlyDefaultContent() {
    return (
      this.files.length === 1 &&
      this.files[0].id === "main-py" &&
      typeof this.files[0].content === "string" &&
      this.files[0].content.includes("Hello, World!")
    );
  }

  // Clean up event listeners
  destroy() {
    if (this._tabContainerEventListener) {
      const container = this.shadowRoot?.getElementById("fileTabs");
      if (container) {
        container.removeEventListener("click", this._tabContainerEventListener);
      }
      this._tabContainerEventListener = null;
    }
  }
}
