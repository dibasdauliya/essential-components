import { LitElement, html, css } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

@customElement("activities-widget")
export class ActivitiesWidget extends LitElement {
  @property({ type: String, attribute: "prev-text" }) prevText = "←";
  @property({ type: String, attribute: "next-text" }) nextText = "→";
  @property({ type: String, attribute: "counter-format" }) counterFormat =
    "{current} / {total}";
  @property({ type: Boolean, attribute: "hide-counter", reflect: true })
  hideCounter = false;
  @property({ type: Boolean, attribute: "hide-nav", reflect: true }) hideNav =
    false;
  @property({ type: Boolean, reflect: true }) compact = false;
  @property({ type: String, reflect: true }) theme?: string;

  @state() private activeActivity = 1;
  @state() private count = 0;
  @state() private activities: Element[] = [];
  @state() private isAnimating = false;
  @state() private activeText = "";
  @state() private textHidden = false;

  @query(".activities-container") private activitiesContainer?: HTMLElement;

  connectedCallback() {
    super.connectedCallback();
    this.setupActivities();
  }

  setupActivities() {
    // Get the activities from light DOM
    this.activities = Array.from(this.querySelectorAll(".activity"));
    this.count = this.activities.length;

    // Set initial active text
    if (this.count > 0) {
      this.updateActiveText();
    }
  }

  firstUpdated() {
    // Move activities to shadow DOM after first render
    if (this.activitiesContainer) {
      this.activities.forEach((activity) => {
        const activityClone = activity.cloneNode(true) as Element;
        // Remove the text from the activity clone since we'll display it separately
        const textElement = activityClone.querySelector(".text");
        if (textElement) {
          textElement.remove();
        }
        this.activitiesContainer!.appendChild(activityClone);
      });

      // Update activities reference to shadow DOM elements
      this.activities = Array.from(
        this.activitiesContainer.querySelectorAll(".activity")
      );

      // Set first activity as active
      if (this.activities.length > 0) {
        this.makeActive(0);
      }
    }
  }

  updateActiveText() {
    const originalActivities = Array.from(this.querySelectorAll(".activity"));
    const activeIndex = this.activeActivity - 1;

    if (originalActivities[activeIndex]) {
      const textElement =
        originalActivities[activeIndex].querySelector(".text");
      if (textElement) {
        // Temporarily hide with animation
        this.textHidden = true;

        setTimeout(() => {
          this.activeText = textElement.innerHTML;
          this.textHidden = false;
        }, 100);
      }
    }
  }

  movePrevious() {
    if (this.activeActivity > 1) {
      this.activeActivity--;
      this.makeActive(this.activeActivity - 1);
    }
  }

  moveNext() {
    if (this.activeActivity < this.count) {
      this.activeActivity++;
      this.makeActive(this.activeActivity - 1);
    }
  }

  makeActive(index: number) {
    if (!this.activities || index >= this.activities.length) return;

    // Remove active class from all activities
    this.activities.forEach((el) => {
      el.classList.remove("active");
    });

    // Add active class to the selected activity
    this.activities[index].classList.add("active");

    // Add animation class to the host
    this.classList.add("children-animating");
    this.isAnimating = true;

    // Remove animation class after animation completes
    setTimeout(() => {
      this.classList.remove("children-animating");
      this.isAnimating = false;
    }, 500);

    this.updateActiveText();
  }

  getCounterText(): string {
    return this.counterFormat
      .replace("{current}", String(this.activeActivity))
      .replace("{total}", String(this.count));
  }

  static styles = css`
    @property --rotate {
      syntax: "<angle>";
      initial-value: 0deg;
      inherits: true;
    }

    :host {
      display: block;
      max-width: 500px;
      font-family: system-ui, sans-serif;
      line-height: 1.5;
      margin: 16px;

      /* Light defaults */
      --aw-text-primary: #222;
      --aw-text-secondary: #555;
      --aw-text-muted: #595757ff;
      --aw-button-bg: #ffffff;
      --aw-button-border: #dddddd;
      --aw-button-hover-bg: #f0f0f0;
      --aw-button-hover-border: #bbbbbb;
      --aw-image-border: #ffffff;

      color: var(--aw-text-primary);
    }

    .widget-container {
      display: grid;
      gap: 1rem 2rem;
      grid-template-columns: 140px 1fr;
      grid-template-rows: auto 1fr auto;
      min-height: 200px;
      position: relative;
    }

    .activities-container {
      grid-column: 1;
      grid-row: 1 / -1;
      position: relative;
      width: 140px;
      height: 140px;
    }

    .activity {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      opacity: 0.7;
      transition: all 0.3s ease;
    }

    .activity.active {
      z-index: 10;
      opacity: 1;
    }

    .activity:nth-child(1) {
      --rotate: 4deg;
    }

    .activity:nth-child(2) {
      --rotate: -2deg;
    }

    .activity:nth-child(3) {
      --rotate: -9deg;
    }

    .activity:nth-child(4) {
      --rotate: 7deg;
    }

    .img {
      width: 100%;
      height: 100%;
      rotate: var(--rotate, 0deg);
      transition: 0.25s linear;
    }

    .img img {
      width: 100%;
      height: 100%;
      border-radius: 0.25rem;
      border: 3px solid var(--aw-image-border);
      box-shadow: 0 0 5px #0003;
      object-fit: cover;
      display: block;
    }

    .activity.active .img {
      animation: 0.5s ease-in-out fly-out;
      animation-fill-mode: forwards;
    }

    .text-display {
      grid-column: 2;
      grid-row: 2;
      align-self: center;
      opacity: 1;
      transition: 0.25s ease-in-out;
    }

    .text-display.hidden {
      opacity: 0;
      transform: translateY(20px);
    }

    .text-display h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.2rem;
      color: var(--aw-text-primary);
    }

    .text-display p {
      margin: 0;
      font-size: 1rem;
      color: var(--aw-text-secondary);
      line-height: 1.4;
    }

    .activities-count {
      grid-column: 2;
      grid-row: 1;
      font-weight: bold;
      font-size: 0.9rem;
      color: var(--aw-text-muted);
      align-self: start;
    }

    .activities-nav {
      grid-column: 2;
      grid-row: 3;
      align-self: end;
      margin-top: 1rem;
    }

    .activities-nav button {
      background: var(--aw-button-bg);
      border: 2px solid var(--aw-button-border);
      border-radius: 0.25rem;
      padding: 0.5rem 0.8rem;
      margin-right: 0.5rem;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s ease;
      color: var(--aw-text-primary);
    }

    .activities-nav button:hover {
      background: var(--aw-button-hover-bg);
      border-color: var(--aw-button-hover-border);
    }

    .activities-nav button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    :host(.children-animating) .img {
      --rotate: 0deg;
    }

    @keyframes fly-out {
      50% {
        transform: translateX(-110%);
      }

      100% {
        transform: translateX(0);
        z-index: 15;
      }
    }

    /* Customization styles */
    :host([hide-counter]) .activities-count {
      display: none;
    }

    :host([hide-nav]) .activities-nav {
      display: none;
    }

    :host([compact]) {
      max-width: 380px;
    }

    :host([compact]) .widget-container {
      gap: 0.5rem 1.5rem;
      grid-template-columns: 120px 1fr;
      min-height: 150px;
    }

    :host([compact]) .activities-container {
      width: 120px;
      height: 120px;
    }

    :host([compact]) .text-display h3 {
      font-size: 1rem;
    }

    :host([compact]) .text-display {
      min-height: 100px;
    }

    :host([compact]) .text-display p {
      font-size: 0.9rem;
    }

    /* Dark mode overrides */
    :host([theme="dark"]),
    :host-context([data-theme="dark"]) {
      --aw-text-primary: #f5f5f5;
      --aw-text-secondary: #cbd5e1;
      --aw-text-muted: #9aa4b2;
      --aw-button-bg: #111827;
      --aw-button-border: #374151;
      --aw-button-hover-bg: #1f2937;
      --aw-button-hover-border: #4b5563;
      --aw-image-border: #374151;
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --aw-text-primary: #f5f5f5;
        --aw-text-secondary: #cbd5e1;
        --aw-text-muted: #9aa4b2;
        --aw-button-bg: #111827;
        --aw-button-border: #374151;
        --aw-button-hover-bg: #1f2937;
        --aw-button-hover-border: #4b5563;
        --aw-image-border: #374151;
      }
    }
  `;

  render() {
    const textClasses = {
      "text-display": true,
      hidden: this.textHidden,
    };

    return html`
      <div
        class="widget-container ${this.isAnimating ? "children-animating" : ""}"
      >
        <div class="activities-container"></div>
        <div class="activities-count">${this.getCounterText()}</div>
        <div class=${classMap(textClasses)}>${unsafeHTML(this.activeText)}</div>
        <nav class="activities-nav">
          <button
            @click=${this.movePrevious}
            ?disabled=${this.activeActivity <= 1}
            aria-label="previous activity"
          >
            ${this.prevText}
          </button>
          <button
            @click=${this.moveNext}
            ?disabled=${this.activeActivity >= this.count}
            aria-label="next activity"
          >
            ${this.nextText}
          </button>
        </nav>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "activities-widget": ActivitiesWidget;
  }
}
