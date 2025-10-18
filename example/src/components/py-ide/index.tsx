import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "py-ide": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
      "code-editor": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          code?: string;
          language?: string;
          theme?: string;
          readonly?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

export function PyIDE({
  children,
}: {
  storageKey?: string;
  children?: string;
}) {
  return (
    <BrowserOnly>
      {() => {
        // Import the custom element only in the browser environment
        require("../../../../github-sample/dist/assets/main-Bj_FM842.js");

        const code = `function x() {
  console.log("Hello world! :)");
}`;

        const scriptElement = React.createElement("script", {
          type: "text/javascript",
          dangerouslySetInnerHTML: { __html: code },
        });

        return React.createElement("code-editor", null, scriptElement);

        // const code =
        //   children ||
        //   `print("Hello from PyIDE 👋")\nfor i in range(3):\n    print(f"Line {i+1}")`;

        // const scriptElement = React.createElement("script", {
        //   dangerouslySetInnerHTML: { __html: code },
        // });

        // return React.createElement("py-ide", scriptElement);
      }}
    </BrowserOnly>
  );
}
