import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "py-ide": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "storage-key"?: string;
      };
    }
  }
}

type PyIDEFile = { name: string; content: string };

export function PyIDE({
  storageKey,
  files,
}: {
  storageKey?: string;
  files?: PyIDEFile[];
}) {
  console.log({ filesComp: files });
  return (
    <BrowserOnly>
      {() => {
        // Import the custom element only in the browser environment
        require("../../../../src/py-ide");

        const providedFiles =
          files && files.length > 0
            ? files
            : [
                {
                  name: "main.py",
                  content: `print("Hello from PyIDE 👋")\nfor i in range(3):\n    print(f"Line {i+1}")\n`,
                },
                {
                  name: "utils.py",
                  content: "def square(x): return x*x",
                },
              ];

        const scriptChildren = providedFiles.map((f, idx) =>
          React.createElement("script", {
            type: "text/plain",
            "data-filename": f.name,
            key: `${f.name}-${idx}`,
            dangerouslySetInnerHTML: { __html: f.content },
          })
        );

        return React.createElement(
          "py-ide",
          { "storage-key": storageKey },
          ...scriptChildren
        );
      }}
    </BrowserOnly>
  );
}
