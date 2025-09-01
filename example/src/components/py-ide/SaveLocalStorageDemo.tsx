import React, { useEffect, useRef, useState } from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "py-ide": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "storage-key"?: string;
        "show-save-button"?: string;
        "save-in-local-storage"?: string;
      };
    }
  }
}

export function PyIDESaveLocalStorageDemo() {
  return (
    <BrowserOnly>
      {() => {
        require("../../../../src/py-ide");

        const Demo = () => {
          const defaultIdeRef = useRef<HTMLElement | null>(null);
          const noSaveIdeRef = useRef<HTMLElement | null>(null);

          const [saveLog, setSaveLog] = useState<string>("Save events log:\n");
          const [localStorageContents, setLocalStorageContents] =
            useState<string>("");

          const appendSaveLog = (message: string) => {
            const timestamp = new Date().toLocaleTimeString();
            setSaveLog((prev) => prev + `[${timestamp}] ${message}\n`);
          };

          const updateLocalStorageDisplay = () => {
            const contents = {
              "demo-with-save": localStorage.getItem("demo-with-save"),
              "demo-without-save": localStorage.getItem("demo-without-save"),
            };
            setLocalStorageContents(JSON.stringify(contents, null, 2));
          };

          useEffect(() => {
            // Update localStorage display every 2 seconds
            const interval = setInterval(updateLocalStorageDisplay, 2000);
            updateLocalStorageDisplay(); // Initial update

            return () => {
              clearInterval(interval);
            };
          }, []);

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  border: "1px solid #e1e5e9",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <h4 style={{ margin: "0 0 12px 0", color: "#1c1e21" }}>
                  1. With Save Button & localStorage enabled (default)
                </h4>

                {React.createElement(
                  "py-ide",
                  {
                    ref: defaultIdeRef as any,
                    "storage-key": "demo-with-save",
                    style: { height: "400px" },
                  },
                  React.createElement("script", {
                    type: "text/plain",
                    "data-filename": "with_save.py",
                    dangerouslySetInnerHTML: {
                      __html: `print("Full-featured PyIDE with save button and localStorage enabled (default)")`,
                    },
                  })
                )}
              </div>

              <div
                style={{
                  border: "1px solid #e1e5e9",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <h4 style={{ margin: "0 0 12px 0", color: "#1c1e21" }}>
                  2. No Save Button & No localStorage
                </h4>

                {React.createElement(
                  "py-ide",
                  {
                    ref: noSaveIdeRef as any,
                    "storage-key": "demo-without-save",
                    "show-save-button": "false",
                    "save-in-local-storage": "false",
                    style: { height: "400px" },
                  },
                  React.createElement("script", {
                    type: "text/plain",
                    "data-filename": "no_save.py",
                    dangerouslySetInnerHTML: {
                      __html: `print("Minimal PyIDE!")`,
                    },
                  })
                )}
              </div>
            </div>
          );
        };

        return <Demo />;
      }}
    </BrowserOnly>
  );
}
