# Essential Heading

The `<essential-heading>` component is a customizable web component designed to create visually striking headings with various styling options. It's perfect for adding emphasis and design flair to your web pages.

## Installation

To use the `<essential-heading>` component, first ensure you have installed the `essential-components` package in your project.

```bash
npm install essential-components
```

## Import

Import the component in your JavaScript or TypeScript file:

```javascript
import 'essential-components/src/essential-heading';
```

## Usage

After importing, you can use the `<essential-heading>` component in your HTML or JSX. This component provides multiple attributes to customize the appearance of your headings.

### Basic Usage

```html
<essential-heading class="heading-1">
  This is heading 1
</essential-heading>
```

### With Background Image

```html
<essential-heading class="heading-1" bg-img="./img/mountain.avif" style="font-size: 2em;">
  With background image clipped!
</essential-heading>
```

### With Border

```html
<essential-heading class="heading-1" show-border="true" border-color="red" fill-color="black">
  with border
</essential-heading>
```

### Gradient Text

```html
<essential-heading
  class="heading-1"
  id="heading-2"
  type="gradient"
  gradient-color="red;violet;blue">
  This is heading 2
</essential-heading>
```

## Attributes

| Attribute        | Type   | Description                                                                 | Required |
|------------------|--------|-----------------------------------------------------------------------------|----------|
| `class`          | String | The CSS class to apply for styling.                                          | Yes      |
| `css-file`       | String | Path to an external CSS file for additional styling.                         | No       |
| `bg-img`         | String | The path to a background image for the heading.                              | No       |
| `show-border`    | Boolean| Displays a border around the heading if set to `true`.                       | No       |
| `border-color`   | String | The color of the border. Requires `show-border` to be `true`.                | No       |
| `stroke-width`   | String | The width of the border stroke. Requires `show-border` to be `true`.         | No       |
| `fill-color`     | String | The fill color of the heading text when `show-border` is used.               | No       |
| `type`           | String | Specifies the type of heading effect, such as `gradient` for gradient text.  | No       |
| `gradient-color` | String | A semicolon-separated list of colors for gradient text. Requires `type="gradient"`. | No       |

## Examples

1. **Basic Heading:**

   ```html
   <essential-heading class="heading-1">
     This is heading 1
   </essential-heading>
   ```

2. **Heading with Background Image:**

   ```html
   <essential-heading class="heading-1" bg-img="./img/mountain.avif" style="font-size: 2em;">
     With background image clipped!
   </essential-heading>
   ```

3. **Heading with Border:**

   ```html
   <essential-heading class="heading-1" show-border="true" border-color="red" fill-color="black">
     with border
   </essential-heading>
   ```

4. **Heading with Gradient Text:**

   ```html
   <essential-heading
     class="heading-1"
     id="heading-2"
     type="gradient"
     gradient-color="red;violet;blue">
     This is heading 2
   </essential-heading>
   ```

## Behavior

The `<essential-heading>` component allows you to create styled headings with various effects such as borders, background images, and gradient text. These effects can be customized using the attributes provided.

## Styling

You can apply additional styles to the `<essential-heading>` component using CSS classes or by linking an external CSS file through the `css-file` attribute. The component does not enforce any default styling, allowing full customization.

## Browser Support

This component should work in all modern browsers that support [Custom Elements](https://caniuse.com/custom-elementsv1) and [Shadow DOM](https://caniuse.com/shadowdomv1).

## Accessibility

When using this component, consider the following accessibility aspects:

- Ensure that text remains legible with the applied styles.
- Provide alternative text for background images if they convey meaningful information.
- Ensure proper contrast ratios, especially when using gradient or background images.

## Performance

The `<essential-heading>` component is lightweight but be cautious with the use of large background images or complex gradients, as they can affect rendering performance.
