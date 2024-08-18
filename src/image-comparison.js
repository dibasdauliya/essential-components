class ImageComparison extends HTMLElement {
    constructor() {
        super();
        this.clicked = false;
    }

    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' });
        const thumbColor = this.getAttribute('thumb-color') || '#2196F3';
        const slot1 = this.querySelector('img[slot="image1"]');
        const slot2 = this.querySelector('img[slot="image2"]');
        const slot1Height = slot1.getAttribute('height') || 500;
        const slot2Height = slot2.getAttribute('height') || 500,
        slot1Width = slot1.getAttribute('width') || 500,
        slot2Width = slot2.getAttribute('width') || 500;


        shadow.innerHTML = `
            <style>
                * {box-sizing: border-box;}
                .img-comp-container {
                    position: relative;
                    min-height: ${slot1Height > slot2Height ? slot1Height : slot2Height}px;
                }
                .img-comp-img {
                    position: absolute;
                    width: auto;
                    height: auto;
                    overflow: hidden;
                }
                ::slotted(img) {
                    display: block;
                    object-fit: cover;
                    width: ${slot1Width}px;
                    height: ${slot1Height}px;
                }
                .img-comp-slider {
                    position: absolute;
                    z-index: 9;
                    cursor: ew-resize;
                    width: 40px;
                    height: 40px;
                    background-color: ${thumbColor};
                    opacity: 0.8;
                    border-radius: 50%;
                }
            </style>
            <div class="img-comp-container">
                <div class="img-comp-img">
                    <slot name="image1"></slot>
                </div>
                <div class="img-comp-img img-comp-overlay">
                    <slot name="image2"></slot>
                </div>
            </div>
        `;

        this.initComparisons();
    }

    initComparisons() {
        const overlays = this.shadowRoot.querySelectorAll(".img-comp-overlay");
        overlays.forEach(img => this.compareImages(img));
    }

    compareImages(img) {
        let slider, w, h;
        const container = img.closest('.img-comp-container');
        w = container.offsetWidth;
        h = container.offsetHeight;

        img.style.width = (w / 2) + "px";

        slider = document.createElement("div");
        slider.setAttribute("class", "img-comp-slider");
        container.insertBefore(slider, img);

        slider.style.top = (h / 2) - (slider.offsetHeight / 2) + "px";
        slider.style.left = (w / 2) - (slider.offsetWidth / 2) + "px";

        const mouseDownHandler = (e) => this.slideReady(e, slider, img, w);
        const mouseUpHandler = () => this.slideFinish();
        const mouseMoveHandler = (e) => this.slideMove(e, slider, img, w);

        slider.addEventListener("mousedown", mouseDownHandler);
        window.addEventListener("mouseup", mouseUpHandler);
        window.addEventListener("mousemove", mouseMoveHandler);

        slider.addEventListener("touchstart", mouseDownHandler);
        window.addEventListener("touchend", mouseUpHandler);
        window.addEventListener("touchmove", mouseMoveHandler);

        // Store references to these handlers for later removal
        this.mouseMoveHandler = mouseMoveHandler;
        this.mouseUpHandler = mouseUpHandler;
        this.mouseDownHandler = mouseDownHandler;
    }

    slideReady(e, slider, img, w) {
        e.preventDefault();
        this.clicked = true;
    }

    slideFinish() {
        this.clicked = false;
    }

    slideMove(e, slider, img, w) {
        if (!this.clicked) return;
        let pos = this.getCursorPos(e, img);

        const mainContainer = slider.closest('.img-comp-container');
        const mainContainerPosition = mainContainer.getBoundingClientRect();

        if (pos.x < mainContainerPosition.left || pos.x > mainContainerPosition.right) return;

        if (pos.x < 0) pos.x = 0;
        if (pos.x > w) pos.x = w;

        img.style.width = pos.x + "px";
        slider.style.left = img.offsetWidth - (slider.offsetWidth / 2) + "px";
    }

    getCursorPos(e, img) {
        let x = 0;
        e = e.changedTouches ? e.changedTouches[0] : e;
        const rect = img.getBoundingClientRect();
        x = e.pageX - rect.left - window.pageXOffset;
        return { x };
    }

    disconnectedCallback() {
        window.removeEventListener("mousemove", this.mouseMoveHandler);
        window.removeEventListener("touchmove", this.mouseMoveHandler);
        window.removeEventListener("mouseup", this.mouseUpHandler);
        window.removeEventListener("touchend", this.mouseUpHandler);
    }
}

customElements.define('image-comparison', ImageComparison);