# Emoji Hover Wrapper

The `<emoji-hover-wrapper>` component is a versatile element that adds an interactive emoji hover effect to any content. It's perfect for adding a touch of playfulness and engagement to your web applications.

## Installation

To use the `<emoji-hover-wrapper>` component, first ensure you have installed the `essential-components` package in your project.

```bash
npm install essential-components
```

## Import

Import the component in your JavaScript or TypeScript file:

```javascript
import 'essential-components/src/emoji-hover-wrapper';
```

## Usage

After importing, you can use the `<emoji-hover-wrapper>` component in your HTML or JSX. Wrap it around any content you want to associate with an emoji. The component takes two main props: `icon` and `tag`.

```html
<emoji-hover-wrapper icon="🤩" tag="span">
  hover over me
</emoji-hover-wrapper>
```

## Props

| Prop | Type | Description | Required |
|------|------|-------------|----------|
| `icon` | String | The emoji to display on hover. Use the Unicode representation of the emoji. | Yes |
| `tag` | String | The HTML tag to use for wrapping the content. | Yes |

## Examples

1. Basic usage with text:

   ```html
   <emoji-hover-wrapper icon="😊" tag="span">
     Hello, World!
   </emoji-hover-wrapper>
   ```

2. Using with a button:

   ```html
   <emoji-hover-wrapper icon="👍" tag="button">
     Click me!
   </emoji-hover-wrapper>
   ```

3. Wrapping a paragraph:

   ```html
   <emoji-hover-wrapper icon="📚" tag="p">
     This is a longer piece of text that demonstrates how the emoji-hover-wrapper
     can be used with block-level elements.
   </emoji-hover-wrapper>
   ```

## Behavior

When a user hovers over the wrapped content, the specified emoji will appear near the cursor. The emoji follows the cursor movement within the boundaries of the wrapped content.

## Styling

The `<emoji-hover-wrapper>` component doesn't apply any default styles to the wrapped content. You can style the content as you normally would, using CSS classes or inline styles.

## Browser Support

This component should work in all modern browsers that support [Custom Elements](https://caniuse.com/custom-elementsv1), [Shadow DOM](https://caniuse.com/shadowdomv1), and the [Canvas](https://caniuse.com/canvas) API.

## Accessibility

When using this component, consider the following accessibility implications:

- The emoji is purely decorative and doesn't convey essential information.
- Screen readers will ignore the emoji and only read the wrapped content.
- Ensure that any interactive elements wrapped by this component are still accessible via keyboard navigation.

