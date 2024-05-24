Set of web platform API's that allow us to create custom, reusable and
encapsulated html tags to use in web pages and web apps

Web components do not require any special 3rd party libraries or
frameworks but can certainly be used with them

Main Building Blocks

- Custom Elements

class MyElement extends HTMLElement {...}

    - constructor() {...}: called when the element is created or upgraded
    - connectedCallback() {...}: called when the element is inserted into the DOM
    - disconnectedCallback() {...}: called when the element is removed from the DOM
    - attributeChangedCallback(name, oldValue, newValue) {...}: called when an attribute is added, removed, updated or replaced
    - adoptedCallback() {...}: called when the element is moved to a new document
    - observedAttributes() {...}: returns an array of attribute names to monitor for changes
    - static get observedAttributes() {...}: alternative way to define observedAttributes

customElements.define('my-element', MyElement);

## Shadow DOM

- Encapsulated DOM tree inside a custom element
- Scoped CSS
- Shadow DOM is a part of the Web Components standard
- Can be used standalone without custom elements
- document.createElement('div', {mode: 'open'}) to create a shadow root
- element.attachShadow({mode: 'open'}) to attach a shadow root to an element
- element.shadowRoot to access the shadow root

## HTML Templates

- <template> element
- Content is inert and not rendered
- Can be cloned and inserted into the DOM
- document.createElement('template') to create a template
- template.content to access the content
- document.importNode(template.content, true) to import the content
- template.cloneNode(true) to clone the template
- template.innerHTML to set the content
- template.content.querySelector() to query the content
- template.content.querySelectorAll() to query all the content
