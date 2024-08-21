import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export function EssentialHeaderBorder() {
  return (
    <BrowserOnly>
      {() => {
        // Import the custom element only in the browser environment
        import('essential-components/src/essential-heading')
        return (
          <essential-heading class="heading-1" show-border="true" border-color="orange" fill-color="#ddd">
                with border
          </essential-heading>
        );
      }}
    </BrowserOnly>
  );
}

export function EssentialHeaderGradient() {
  return (
    <BrowserOnly>
      {() => {
        // Import the custom element only in the browser environment
        import('essential-components/src/essential-heading')
        return (
          <essential-heading
            class="heading-1"
            type="gradient"
            gradient-color="red;orange;violet"
          >
            This is heading 2
          </essential-heading>
        );
      }}
    </BrowserOnly>
  );
}

export function EssentialHeaderBgImg() {
  return (
    <BrowserOnly>
      {() => {
        // Import the custom element only in the browser environment
        import('essential-components/src/essential-heading')
        return (
          <essential-heading
            class="heading-1"
            bg-img="/essential-components/img/mountain.jpg"
            style={{ fontSize: '2em', fontWeight: 900, lineHeight: 1.2 }}
          >
            With background image clipped!
          </essential-heading>
        );
      }}
    </BrowserOnly>
  );
}