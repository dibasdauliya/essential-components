import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";

// Declare the custom element type for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "chat-ui": {
        title?: string;
        placeholder?: string;
      };
    }
  }
}

export function ChatUI({
  title,
  placeholder,
}: {
  title?: string;
  placeholder?: string;
}) {
  return (
    <BrowserOnly>
      {() => {
        // Import the custom element only in the browser environment
        require("../../../../src/chat-ui");
        return <chat-ui title={title} placeholder={placeholder}></chat-ui>;
      }}
    </BrowserOnly>
  );
}
