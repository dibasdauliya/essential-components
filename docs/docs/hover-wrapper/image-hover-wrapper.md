# Image Hover Wrapper

The `<image-hover-wrapper>` component is an interactive custom element that changes the cursor to an image when hovering over the wrapped content. This is useful for creating engaging visual effects in your web applications.

## Installation

To use the `<image-hover-wrapper>` component, first ensure you have installed the `essential-components` package in your project.

```bash
npm install essential-components
```

## Import

Import the component in your JavaScript or TypeScript file:

```javascript
import 'essential-components/src/image-hover-wrapper';
```

## Usage

After importing, you can use the `<image-hover-wrapper>` component in your HTML or JSX. Wrap it around any content to apply the image hover effect. The component takes two main attributes: `src` and `tag`.

```html
<image-hover-wrapper src="./img/mountain.avif" tag="h1">
  hover over me
</image-hover-wrapper>
```

## Attributes

| Attribute | Type   | Description                                        | Required |
|-----------|--------|----------------------------------------------------|----------|
| `src`     | String | The path to the image file to use as the cursor.    | Yes      |
| `tag`     | String | The HTML tag to use for wrapping the content.       | Yes      |

## Examples

1. Basic usage with text:

   ```html
   <image-hover-wrapper src="./img/sky.jpg" tag="span">
     Beautiful Sky
   </image-hover-wrapper>
   ```

2. Using with a button:

   ```html
   <image-hover-wrapper src="./img/click.png" tag="button">
     Click for more!
   </image-hover-wrapper>
   ```

3. Wrapping a heading:

   ```html
   <image-hover-wrapper src="./img/landscape.jpg" tag="h2">
     Discover Amazing Landscapes
   </image-hover-wrapper>
   ```

## Behavior

When a user hovers over the content wrapped by `<image-hover-wrapper>`, the cursor changes to the specified image. This effect applies within the boundaries of the wrapped element.

## Styling

The `<image-hover-wrapper>` component does not apply any default styles to the wrapped content. You can style the content as you normally would, using CSS classes or inline styles.

## Browser Support

This component should work in all modern browsers that support [Custom Elements](https://caniuse.com/custom-elementsv1), [Shadow DOM](https://caniuse.com/shadowdomv1), and the [Canvas API](https://caniuse.com/canvas).

## Accessibility

When using this component, consider the following accessibility considerations:

- The hover image is purely decorative and does not convey essential information.
- Screen readers will ignore the hover image and only read the content wrapped by the component.
- Ensure that any interactive elements wrapped by this component are accessible via keyboard navigation.

## Performance

The `<image-hover-wrapper>` is designed to be efficient, but be mindful of the image sizes used to ensure optimal performance. Large images may impact load times and hover interaction smoothness.

## Image Format Support

This component supports various image formats including JPEG, PNG, GIF, and AVIF. Ensure your target browsers support the image format you choose, especially for newer formats like AVIF.
