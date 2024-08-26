import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export function ImageHoverWrapper({imageName, content, tag}: {
    imageName: string;
    content: string;
    tag: string;
}) {
  return (
    <BrowserOnly>
      {() => {
        // Import the custom element only in the browser environment
        import('essential-components/src/image-hover-wrapper')
        return (
            <image-hover-wrapper src={`/essential-components/img/${imageName}`} tag={tag}>
                {content}
            </image-hover-wrapper>
        );
      }}
    </BrowserOnly>
  );
}