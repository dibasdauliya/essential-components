/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./example/js/main.js":
/*!****************************!*\
  !*** ./example/js/main.js ***!
  \****************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _src_emoji_hover_wrapper_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../src/emoji-hover-wrapper.js */ \"./src/emoji-hover-wrapper.js\");\nconsole.log(\"first\")\n\n;\n\n//# sourceURL=webpack://essential-components/./example/js/main.js?");

/***/ }),

/***/ "./src/emoji-hover-wrapper.js":
/*!************************************!*\
  !*** ./src/emoji-hover-wrapper.js ***!
  \************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\nclass EmojiHoverWrapper extends HTMLElement {\n    constructor() {\n      super()\n      this.attachShadow({ mode: 'open' })\n    }\n\n    connectedCallback() {\n      this.render()\n    }\n\n    emojiToBase64(emoji) {\n      // Create a canvas element\n      const canvas = document.createElement('canvas');\n      canvas.width = 32; // Set the size of the canvas\n      canvas.height = 32;\n      const ctx = canvas.getContext('2d');\n      \n      // Set properties for the emoji to be drawn\n      ctx.font = '24px serif'; // Adjust font size as needed\n      ctx.textAlign = 'center';\n      ctx.textBaseline = 'middle';\n      \n      // Draw the emoji onto the canvas\n      ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);\n      \n      // Convert the canvas to a Base64 encoded image\n      return canvas.toDataURL();\n    }\n\n    render() {\n      const icon = this.getAttribute('icon') || \"👋\",\n        base64Icon = this.emojiToBase64(icon),\n        tag = this.getAttribute('tag')\n      \n      const element = document.createElement(tag || 'div');\n      element.style.cursor = `url('${base64Icon}'), auto`;\n      element.textContent = this.textContent;\n      this.shadowRoot.appendChild(element);\n    }\n  }\n\n  customElements.define('emoji-hover-wrapper', EmojiHoverWrapper)\n\n//# sourceURL=webpack://essential-components/./src/emoji-hover-wrapper.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./example/js/main.js");
/******/ 	
/******/ })()
;