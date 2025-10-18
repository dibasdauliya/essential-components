import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        activitiesWidget: resolve(__dirname, "activities-widget.html"),
        pyCodeEditor: resolve(__dirname, "py-code-editor.html"),
      },
    },
  },
});
