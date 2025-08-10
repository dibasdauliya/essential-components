declare namespace JSX {
  interface IntrinsicElements {
    "emoji-hover-wrapper": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & { icon?: string; tag?: string };
    "image-hover-wrapper": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & { src?: string; tag?: string };
    "essential-heading": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
    "image-comparison": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      "left-image"?: string;
      "right-image"?: string;
      "slider-position"?: string;
    };
    "activities-widget": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      "prev-text"?: string;
      "next-text"?: string;
      "counter-format"?: string;
      "hide-counter"?: boolean;
      "hide-nav"?: boolean;
      compact?: boolean;
    };
    "chat-ui": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & { title?: string; placeholder?: string };
    "py-ide": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      "storage-key"?: string;
    };
  }
}
