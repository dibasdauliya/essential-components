class EmojiHoverWrapper extends HTMLElement {
    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
    }

    connectedCallback() {
      this.render()
    }

    emojiToBase64(emoji) {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = 32; // Set the size of the canvas
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      
      // Set properties for the emoji to be drawn
      ctx.font = '24px serif'; // Adjust font size as needed
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw the emoji onto the canvas
      ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);
      
      // Convert the canvas to a Base64 encoded image
      return canvas.toDataURL();
    }

    render() {
      const icon = this.getAttribute('icon'),
        base64Icon = this.emojiToBase64(icon),
        tag = this.getAttribute('tag')
      
      const element = document.createElement(tag || 'div');
      element.style.cursor = `url('${base64Icon}'), auto`;
      element.textContent = this.textContent;
      this.shadowRoot.appendChild(element);
    }
  }

  customElements.define('emoji-hover-wrapper', EmojiHoverWrapper)