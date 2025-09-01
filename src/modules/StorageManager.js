/**
 * StorageManager - Handles localStorage operations for persistence
 */
export class StorageManager {
  constructor(storageKey, saveInLocalStorage = true) {
    this.storageKey = storageKey;
    this.saveInLocalStorage = saveInLocalStorage;
    this._saveTimeout = null;
    this._activeTimeouts = new Set();
  }

  // Update storage settings
  updateSettings(storageKey, saveInLocalStorage) {
    this.storageKey = storageKey || "py-ide";
    this.saveInLocalStorage = saveInLocalStorage !== false;
  }

  // Save data to localStorage with debouncing
  save(data) {
    if (!this.saveInLocalStorage) return;

    // Debounce storage saves to prevent excessive localStorage writes
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
      this._activeTimeouts.delete(this._saveTimeout);
    }

    this._saveTimeout = setTimeout(() => {
      this._activeTimeouts.delete(this._saveTimeout);
      try {
        const payload = {
          ...data,
          savedAt: Date.now(),
        };
        localStorage.setItem(this.storageKey, JSON.stringify(payload));
      } catch (err) {
        console.warn("PyIDE: Failed to save to localStorage:", err);
      }
    }, 100);

    this._activeTimeouts.add(this._saveTimeout);
  }

  // Load data from localStorage
  load() {
    if (!this.saveInLocalStorage) return null;

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data || null;
    } catch (err) {
      console.warn("PyIDE: Failed to load from localStorage:", err);
      return null;
    }
  }

  // Clear stored data
  clear() {
    if (!this.saveInLocalStorage) return;

    try {
      localStorage.removeItem(this.storageKey);
    } catch (err) {
      console.warn("PyIDE: Failed to clear localStorage:", err);
    }
  }

  // Check if data exists in storage
  hasData() {
    if (!this.saveInLocalStorage) return false;
    return localStorage.getItem(this.storageKey) !== null;
  }

  // Clean up timeouts
  destroy() {
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }
    this._activeTimeouts.forEach((timeout) => clearTimeout(timeout));
    this._activeTimeouts.clear();
  }
}
