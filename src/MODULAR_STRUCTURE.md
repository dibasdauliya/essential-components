# PyIDE Modular Structure

The PyIDE web component has been refactored from a single 1550-line file into a modular architecture with clear separation of concerns.

## Architecture Overview

The modular structure consists of:

1. **Main Component** (`py-ide-modular.js`) - Orchestrates all modules
2. **Five Specialized Modules** - Each handling specific functionality

## Module Breakdown

### 1. EditorManager (`modules/EditorManager.js`)

**Responsibilities:**

- CodeMirror initialization and configuration
- Fallback textarea editor for when CodeMirror fails to load
- Editor event handling (input, change, blur)
- Content synchronization
- Cleanup and memory management

**Key Features:**

- Debounced input handling
- Automatic refresh and resize handling
- Clean fallback mechanism
- Proper event listener management

### 2. FileManager (`modules/FileManager.js`)

**Responsibilities:**

- File creation, deletion, and switching
- Tab rendering and management
- File content management
- Initial file parsing from light DOM
- File state persistence preparation

**Key Features:**

- Support for `<py-file>` and `<script>` elements in light DOM
- Tab-based file switching
- File content tracking with timestamps
- Memory-efficient file operations

### 3. PyodideRunner (`modules/PyodideRunner.js`)

**Responsibilities:**

- Pyodide loading and initialization
- Python code execution
- Package management and auto-installation
- Output capture and formatting
- Error handling and formatting

**Key Features:**

- Automatic missing package installation
- Matplotlib plot rendering as base64 images
- Network error handling and user-friendly messages
- Warning suppression for cleaner output

### 4. StorageManager (`modules/StorageManager.js`)

**Responsibilities:**

- localStorage operations
- Data serialization/deserialization
- Debounced saving to prevent excessive writes
- Storage configuration management

**Key Features:**

- Configurable storage keys
- Optional localStorage disable
- Debounced saves for performance
- Error handling for storage operations

### 5. UIManager (`modules/UIManager.js`)

**Responsibilities:**

- UI rendering and styling
- Status updates and visual feedback
- Button state management
- Pane resizing functionality
- Output display management

**Key Features:**

- Responsive design with mobile support
- Dark theme consistency
- Visual feedback for user actions
- Resizable panes with drag handles

## Benefits of Modular Architecture

### 1. **Maintainability**

- Each module has a single responsibility
- Easy to locate and fix bugs
- Clear interfaces between components
- Reduced cognitive load when working on specific features

### 2. **Testability**

- Modules can be tested in isolation
- Mock dependencies easily
- Better unit test coverage
- Easier to debug specific functionality

### 3. **Reusability**

- Modules can be used independently
- Easy to create variations (e.g., read-only editor)
- Components can be swapped or extended
- Better code organization

### 4. **Performance**

- Lazy loading possibilities
- Better memory management
- Reduced bundle size for specific use cases
- Cleaner event handling

### 5. **Extensibility**

- Easy to add new features
- Plugin-like architecture possible
- Clear extension points
- Better separation of concerns

## Usage

### Import the Modular Version

```javascript
// Instead of the monolithic version
import "./src/py-ide.js";

// Use the modular version
import "./src/py-ide-modular.js";
```

### API Compatibility

The modular version maintains 100% API compatibility with the original:

- Same custom element `<py-ide>`
- Same attributes: `storage-key`, `show-save-button`, `save-in-local-storage`
- Same events: `input`, `change`, `save`, `submit`
- Same methods: `setCode()`, `code`, `output`

### HTML Usage Example

```html
<py-ide storage-key="my-ide" show-save-button="true">
  <py-file name="main.py"> print("Hello, modular world!") </py-file>
  <py-file name="utils.py">
    def helper(): return "This is from a helper function"
  </py-file>
</py-ide>
```

## File Structure

```
src/
├── py-ide-modular.js          # Main orchestrator component
├── modules/
│   ├── EditorManager.js       # CodeMirror & editor handling
│   ├── FileManager.js         # File operations & tabs
│   ├── PyodideRunner.js       # Python execution
│   ├── StorageManager.js      # localStorage operations
│   └── UIManager.js           # UI rendering & styling
└── MODULAR_STRUCTURE.md       # This documentation
```

## Migration Guide

To migrate from the monolithic version to the modular version:

1. **Replace the import:**

   ```javascript
   // Old
   import "./src/py-ide.js";

   // New
   import "./src/py-ide-modular.js";
   ```

2. **No other changes needed** - The API is identical

3. **Optional: Leverage modularity**
   ```javascript
   // You can now import individual modules if needed
   import { EditorManager } from "./src/modules/EditorManager.js";
   import { FileManager } from "./src/modules/FileManager.js";
   ```

## Development Benefits

### For Contributors

- Easier to understand specific functionality
- Clearer git diffs when making changes
- Reduced merge conflicts
- Better code review process

### For Maintainers

- Easier to identify performance bottlenecks
- Better error isolation
- Simpler debugging process
- Cleaner architecture documentation

### For Users

- Same functionality with better stability
- Potential for custom builds
- Better error messages and debugging
- More predictable behavior

## Future Possibilities

The modular architecture opens up several possibilities:

1. **Custom Builds** - Include only needed modules
2. **Alternative Editors** - Swap CodeMirror for other editors
3. **Different Runners** - Support for other languages
4. **Theme System** - Modular theme management
5. **Plugin System** - Community-contributed extensions

## Testing

Use the test file to verify the modular implementation:

```bash
# Open in browser
open test/modular-test.html
```

The test includes:

- Basic functionality verification
- Multi-file support
- Event listener testing
- Attribute configuration testing
- Storage functionality testing
