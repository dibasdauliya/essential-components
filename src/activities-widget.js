class ActivitiesWidget extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.activeActivity = 1;
		this.count = 0;
		this.activities = [];
	}

	connectedCallback() {
		this.setupActivities();
		this.render();
	}

	setupActivities() {
		// Get the activities from light DOM and move them to shadow DOM
		this.activities = Array.from(this.querySelectorAll('.activity'));
		this.count = this.activities.length;
	}

	render() {
		this.shadowRoot.innerHTML = `
			<style>
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
					border: 3px solid white;
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
					color: #333;
				}

				.text-display p {
					margin: 0;
					font-size: 1rem;
					color: #666;
					line-height: 1.4;
				}

				.activities-count {
					grid-column: 2;
					grid-row: 1;
					font-weight: bold;
					font-size: 0.9rem;
					color: #888;
					align-self: start;
				}

				.activities-nav {
					grid-column: 2;
					grid-row: 3;
					align-self: end;
					margin-top: 1rem;
				}

				.activities-nav button {
					background: white;
					border: 2px solid #ddd;
					border-radius: 0.25rem;
					padding: 0.5rem 0.8rem;
					margin-right: 0.5rem;
					cursor: pointer;
					font-size: 1rem;
					transition: all 0.2s ease;
				}

				.activities-nav button:hover {
					background: #f0f0f0;
					border-color: #bbb;
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
			</style>
			<div class="widget-container">
				<div class="activities-container"></div>
				<div class="activities-count">${this.activeActivity} / ${this.count}</div>
				<div class="text-display"></div>
				<nav class="activities-nav">
					<button id="prev-btn" aria-label="previous activity">${this.getAttribute('prev-text') || '←'}</button>
					<button id="next-btn" aria-label="next activity">${this.getAttribute('next-text') || '→'}</button>
				</nav>
			</div>
		`;

		// Move activities to shadow DOM
		const container = this.shadowRoot.querySelector('.activities-container');
		
		this.activities.forEach((activity, index) => {
			const activityClone = activity.cloneNode(true);
			// Remove the text from the activity clone since we'll display it separately
			const textElement = activityClone.querySelector('.text');
			if (textElement) {
				textElement.remove();
			}
			container.appendChild(activityClone);
		});

		// Update activities reference to shadow DOM elements
		this.activities = Array.from(container.querySelectorAll('.activity'));

		// Set first activity as active and show its text
		if (this.activities.length > 0) {
			this.makeActive(0);
		}

		this.updateCounter();
		this.updateButtons();

		// Add event listeners
		this.shadowRoot.getElementById('prev-btn').addEventListener('click', () => this.movePrevious());
		this.shadowRoot.getElementById('next-btn').addEventListener('click', () => this.moveNext());
	}

	showActiveText() {
		const textContainer = this.shadowRoot.querySelector('.text-display');
		const originalActivities = Array.from(this.querySelectorAll('.activity'));
		const activeIndex = this.activeActivity - 1;
		
		if (originalActivities[activeIndex] && textContainer) {
			const textElement = originalActivities[activeIndex].querySelector('.text');
			if (textElement) {
				// Temporarily hide with animation
				textContainer.classList.add('hidden');
				
				setTimeout(() => {
					textContainer.innerHTML = textElement.innerHTML;
					textContainer.classList.remove('hidden');
				}, 100);
			}
		}
	}

	movePrevious() {
		if (this.activeActivity > 1) {
			this.activeActivity = this.activeActivity - 1;
			this.makeActive(this.activeActivity - 1);
		}
	}

	moveNext() {
		if (this.activeActivity < this.count) {
			this.activeActivity = this.activeActivity + 1;
			this.makeActive(this.activeActivity - 1);
		}
	}

	makeActive(index) {
		if (!this.activities || index >= this.activities.length) return;

		// Remove active class from all activities
		this.activities.forEach((el, i) => {
			el.classList.remove('active');
		});

		// Add active class to the selected activity
		this.activities[index].classList.add('active');

		// Add animation class to the host
		this.classList.add('children-animating');
		
		// Remove animation class after animation completes
		setTimeout(() => {
			this.classList.remove('children-animating');
		}, 500);
		
		this.showActiveText();
		this.updateCounter();
		this.updateButtons();
	}

	updateCounter() {
		const counter = this.shadowRoot.querySelector('.activities-count');
		if (counter) {
			const format = this.getAttribute('counter-format') || '{current} / {total}';
			counter.textContent = format
				.replace('{current}', this.activeActivity)
				.replace('{total}', this.count);
		}
	}

	updateButtons() {
		const prevBtn = this.shadowRoot.getElementById('prev-btn');
		const nextBtn = this.shadowRoot.getElementById('next-btn');
		
		if (prevBtn) {
			prevBtn.disabled = this.activeActivity <= 1;
		}
		
		if (nextBtn) {
			nextBtn.disabled = this.activeActivity >= this.count;
		}
	}

	// Allow dynamic updates
	static get observedAttributes() {
		return ['prev-text', 'next-text', 'counter-format', 'hide-counter', 'hide-nav', 'compact'];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (this.shadowRoot) {
			if (name === 'prev-text' || name === 'next-text') {
				this.updateButtons();
				const prevBtn = this.shadowRoot.getElementById('prev-btn');
				const nextBtn = this.shadowRoot.getElementById('next-btn');
				if (name === 'prev-text' && prevBtn) {
					prevBtn.textContent = newValue || '←';
				}
				if (name === 'next-text' && nextBtn) {
					nextBtn.textContent = newValue || '→';
				}
			}
			if (name === 'counter-format') {
				this.updateCounter();
			}
		}
	}
}

customElements.define('activities-widget', ActivitiesWidget);

export { ActivitiesWidget }; 