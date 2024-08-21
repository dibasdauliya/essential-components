import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function ImageComparison() {
  return (
    <BrowserOnly>
      {() => {
        // Import the custom element only in the browser environment
        import('essential-components/src/image-comparison');
        return (
          <image-comparison thumb-color="#000">
            <img slot="image1" src="/img/japan-2011-after.jpg" alt="" />
            <img slot="image2" src="/img/japan-2011-before.jpg" alt="" />
          </image-comparison>
        );
      }}
    </BrowserOnly>
  );
}