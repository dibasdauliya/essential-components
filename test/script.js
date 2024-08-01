customElements.whenDefined('uinl-button').then(() => {
  const button = document
    .querySelector('uinl-button')
    .shadowRoot.querySelector('button')
  if (button) {
    button.addEventListener('click', () => {
      alert('Button clicked from script.js')
    })
  }
})
