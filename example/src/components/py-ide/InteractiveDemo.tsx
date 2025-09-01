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

export function PyIDEInteractiveDemo() {
  return (
    <BrowserOnly>
      {() => {
        require("../../../../src/py-ide");

        const Demo = () => {
          const ideRef = useRef<HTMLElement | null>(null);
          const [codeJson, setCodeJson] = useState<string>("");
          const [output, setOutput] = useState<string>("");
          const [eventLog, setEventLog] = useState<string>(
            "Event log ready...\n"
          );
          const eventLogRef = useRef<HTMLPreElement | null>(null);
          const eventCountRef = useRef<number>(0);

          const appendLog = (type: string, data: unknown) => {
            eventCountRef.current += 1;
            const timestamp = new Date().toLocaleTimeString();
            const entry = `[${timestamp}] ${type}: ${JSON.stringify(
              data,
              null,
              2
            )}\n`;
            setEventLog((prev) => prev + entry);
            // scroll to bottom after state updates on next tick
            setTimeout(() => {
              if (eventLogRef.current) {
                eventLogRef.current.scrollTop =
                  eventLogRef.current.scrollHeight;
              }
            }, 0);
          };

          useEffect(() => {
            const el = ideRef.current as any;
            if (!el) return;

            const onInput = (e: any) => {
              appendLog("INPUT", {
                fileName: e.detail?.fileName,
                contentLength: e.detail?.content?.length ?? 0,
                preview:
                  (e.detail?.content || "").substring(0, 50) +
                  ((e.detail?.content || "").length > 50 ? "..." : ""),
              });
            };
            const onChange = (e: any) => {
              appendLog("CHANGE", {
                fileName: e.detail?.fileName,
                fileId: e.detail?.fileId,
                contentLength: e.detail?.content?.length ?? 0,
              });
            };
            const onSubmit = (e: any) => {
              appendLog("SUBMIT", {
                fileName: e.detail?.fileName,
                contentLength: e.detail?.content?.length ?? 0,
              });
              setTimeout(() => {
                setOutput(el.output || "");
                appendLog("EXECUTION_COMPLETE", {
                  outputLength: (el.output || "").length,
                });
              }, 800);
            };
            const onSave = (e: any) => {
              setTimeout(
                () => setCodeJson(JSON.stringify(el.code, null, 2)),
                100
              );
              appendLog("SAVE", {
                fileCount: e.detail?.files?.length,
                timestamp: e.detail?.timestamp,
                outputLength: e.detail?.output?.length,
              });
            };

            el.addEventListener("input", onInput as any);
            el.addEventListener("change", onChange as any);
            el.addEventListener("submit", onSubmit as any);
            el.addEventListener("save", onSave as any);

            return () => {
              el.removeEventListener("input", onInput as any);
              el.removeEventListener("change", onChange as any);
              el.removeEventListener("submit", onSubmit as any);
              el.removeEventListener("save", onSave as any);
            };
          }, []);

          const handleGetCode = () => {
            const el = ideRef.current as any;
            if (!el) return;
            setCodeJson(JSON.stringify(el.code, null, 2));
          };

          const handleGetOutput = () => {
            const el = ideRef.current as any;
            if (!el) return;
            setOutput(el.output || "");
          };

          const handleReset = () => {
            const el = ideRef.current as any;
            if (!el) return;
            localStorage.removeItem("docs-live-demo");
            el.setCode([
              {
                name: "main.py",
                content: `print("Hello from PyIDE 👋")
for i in range(3):
      print(f"Line {i+1}")`,
              },
              {
                name: "utils.py",
                content: "def sqr(x): return x*x",
              },
            ]);
            setCodeJson("");
            setOutput("");
            setEventLog("Event log cleared...\n");
            eventCountRef.current = 0;
          };

          return (
            <div
              style={{
                border: "1px solid var(--ifm-toc-border-color,#e5e7eb)",
                borderRadius: 8,
                padding: 12,
              }}
            >
              {React.createElement(
                "py-ide",
                { ref: ideRef as any, "storage-key": "docs-live-demo" },
                React.createElement("script", {
                  type: "text/plain",
                  "data-filename": "main.py",
                  dangerouslySetInnerHTML: {
                    __html: `print("Hello from PyIDE 👋")
for i in range(3):
      print(f"Line {i+1}")`,
                  },
                }),
                React.createElement("script", {
                  type: "text/plain",
                  "data-filename": "utils.py",
                  dangerouslySetInnerHTML: { __html: "def sqr(x): return x*x" },
                })
              )}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="button button--secondary"
                  onClick={handleGetCode}
                >
                  Get Code
                </button>
                <button
                  className="button button--secondary"
                  onClick={handleGetOutput}
                >
                  Get Output
                </button>
                <button
                  className="button button--secondary"
                  onClick={handleReset}
                >
                  Reset
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  gridTemplateColumns: "1fr 1fr",
                  marginTop: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Code (JSON)
                  </div>
                  <pre
                    style={{
                      maxHeight: 240,
                      width: "100%",
                      whiteSpace: "pre-wrap",
                      overflow: "auto",
                      background: "var(--ifm-pre-background)",
                    }}
                  >
                    {codeJson || ""}
                  </pre>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Output</div>
                  <pre
                    style={{
                      maxHeight: 240,
                      overflow: "auto",
                      background: "var(--ifm-pre-background)",
                    }}
                  >
                    {output || ""}
                  </pre>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  Event log
                </div>
                <pre
                  ref={eventLogRef}
                  style={{
                    maxHeight: 240,
                    overflow: "auto",
                    background: "var(--ifm-pre-background)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {eventLog}
                </pre>
              </div>
            </div>
          );
        };

        return <Demo />;
      }}
    </BrowserOnly>
  );
}
