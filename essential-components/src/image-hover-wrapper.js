class ImageHoverWrapper extends HTMLElement {
    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
    }

    connectedCallback() {
      this.render()
    }

    imageToBase64(src, maxWidth = 50, maxHeight = 50) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = src;
        img.onload = () => {
          // Calculate scale to maintain aspect ratio
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
          const width = img.width * scale;
          const height = img.height * scale;

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Draw the image scaled down to the new dimensions
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL());
        };
        img.onerror = reject;
      });
    }

    async render() {
      try {
        const src = this.getAttribute('src');
        const tag = this.getAttribute('tag');
        // Wait for the imageToBase64 Promise to resolve
        const base64Img = await this.imageToBase64(src);

        const element = document.createElement(tag || 'div');
        element.style.cursor = `url('${base64Img}'), auto`;
        element.textContent = this.textContent;
        this.shadowRoot.appendChild(element);
      } catch (error) {
        console.error('Failed to load image:', error);
        // Handle the error appropriately
      }
    }
  }

  customElements.define('image-hover-wrapper', ImageHoverWrapper)