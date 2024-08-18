class CustomHeading extends HTMLElement {
    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
      this.startTime = Date.now()
    }

    connectedCallback() {
      this.render()
      this.loadScript()
    }

    getTimeElapsed() {
      return Date.now() - this.startTime
    }

    render() {
      const classAttr = this.getAttribute('class') || '',
        id = this.getAttribute('id') || '',
        initialStyle = this.getAttribute('style') || '',
        cssFile = this.getAttribute('css-file'),
        type = this.getAttribute('type'),
        gradientColor = this.getAttribute('gradient-color')
          ? this.getAttribute('gradient-color').split(';')
          : [],
        bgImg = this.getAttribute('bg-img'),
        showBorder = this.getAttribute('show-border'),
        borderColor = this.getAttribute('border-color'),
        fill = this.getAttribute('fill-color'),
        stroke = this.getAttribute('stroke-width')

      let style = initialStyle

      if (type === 'gradient' && gradientColor.length) {
        style += `
            background: linear-gradient(to right, ${gradientColor.join(', ')});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
          `
        // console.log('Gradient style applied:', style)
      }

      if (bgImg) {
        style += `
        background-image: url(${bgImg});
        background-size: cover;
        background-position: center;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      `
      }

      if (showBorder) {
        style += `
        -webkit-background-clip: text;
        -webkit-text-fill-color: ${fill || 'transparent'};
         -webkit-text-stroke-width: ${stroke || '1px'};
         -webkit-text-stroke-color: ${borderColor || 'black'};
      `
      }

      const styleElement = document.createElement('style')
      styleElement.textContent = `
  .${classAttr} {
    ${style}
  }
`

      this.shadowRoot.appendChild(styleElement)

      if (cssFile) {
        const linkElement = document.createElement('link')
        linkElement.setAttribute('rel', 'stylesheet')
        linkElement.setAttribute('href', cssFile)
        this.shadowRoot.appendChild(linkElement)
      }

      const headingElement = document.createElement('h1')
      headingElement.className = classAttr
      headingElement.id = id
      headingElement.textContent = this.textContent
      this.shadowRoot.appendChild(headingElement)
    }

    loadScript() {
      const jsFile = this.getAttribute('js-file')
      if (jsFile) {
        const script = document.createElement('script')
        script.src = jsFile
        document.body.appendChild(script)
      }
    }
  }

customElements.define('essential-heading', CustomHeading)