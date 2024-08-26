import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export function EmojiHoverWrapper({emoji, content, tag}: {
    emoji: string;
    content: string;
    tag: string;
}) {
  return (
    <BrowserOnly>
      {() => {
        // Import the custom element only in the browser environment
        import('essential-components/src/emoji-hover-wrapper')
        return (
            <emoji-hover-wrapper icon={emoji} tag={tag}>
                {content}
          </emoji-hover-wrapper>
        );
      }}
    </BrowserOnly>
  );
}