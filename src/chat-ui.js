class ChatUI extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.messages = [];
    this.onUserMessage = null; // Callback for when user sends a message
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  addMessage(text, type = "user") {
    const message = {
      id: Date.now(),
      text,
      type,
      timestamp: new Date(),
    };
    this.messages.push(message);
    this.renderMessages();
    this.scrollToBottom();
    return message;
  }

  // Get the last user message
  getLastUserMessage() {
    const userMessages = this.messages.filter((msg) => msg.type === "user");
    return userMessages[userMessages.length - 1] || null;
  }

  // Get all user messages
  getUserMessages() {
    return this.messages.filter((msg) => msg.type === "user");
  }

  // Get all messages
  getAllMessages() {
    return [...this.messages];
  }

  // Manually send a bot response
  sendBotResponse(text) {
    return this.addMessage(text, "bot");
  }

  // Clear all messages
  clearMessages() {
    this.messages = [];
    this.renderMessages();
  }

  // Set callback for when user sends a message
  setUserMessageCallback(callback) {
    this.onUserMessage = callback;
  }

  setupEventListeners() {
    const input = this.shadowRoot.querySelector(".chat-input");
    const sendBtn = this.shadowRoot.querySelector(".send-btn");

    const sendMessage = () => {
      const text = input.value.trim();
      if (text) {
        const userMessage = this.addMessage(text, "user");
        input.value = "";

        // Call the user message callback if set
        if (this.onUserMessage) {
          this.onUserMessage(userMessage, this);
        }

        // Dispatch custom event
        this.dispatchEvent(
          new CustomEvent("user-message", {
            detail: { message: userMessage, chatUI: this },
            bubbles: true,
          })
        );
      }
    };

    sendBtn.addEventListener("click", sendMessage);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }

  getBotResponse(userMessage) {
    const responses = [
      "That's interesting! Tell me more.",
      "I understand what you're saying.",
      "Thanks for sharing that with me.",
      "How do you feel about that?",
      "That's a great point!",
      "I'm here to help. What else would you like to discuss?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  renderMessages() {
    const messagesContainer = this.shadowRoot.querySelector(".messages");
    messagesContainer.innerHTML = "";

    this.messages.forEach((message) => {
      const messageEl = document.createElement("div");
      messageEl.className = `message ${message.type}`;
      messageEl.innerHTML = `
        <div class="message-content">${message.text}</div>
        <div class="message-time">${message.timestamp.toLocaleTimeString()}</div>
      `;
      messagesContainer.appendChild(messageEl);
    });
  }

  scrollToBottom() {
    const messagesContainer = this.shadowRoot.querySelector(".messages");
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  render() {
    const title = this.getAttribute("title") || "Chat";
    const placeholder =
      this.getAttribute("placeholder") || "Type your message...";

    // Customizable colors
    const primaryGradient =
      this.getAttribute("primary-gradient") ||
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    const primaryColor = this.getAttribute("primary-color") || "#667eea";
    const botMessageBg = this.getAttribute("bot-message-bg") || "#f1f3f4";
    const botMessageColor = this.getAttribute("bot-message-color") || "#333";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          max-width: 400px;
          height: 500px;
          border: 1px solid #e1e5e9;
          border-radius: 12px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .chat-header {
          background: ${primaryGradient};
          color: white;
          padding: 16px;
          font-weight: 600;
          text-align: center;
        }

        .messages {
          height: 340px;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          display: flex;
          flex-direction: column;
          max-width: 80%;
        }

        .message.user {
          align-self: flex-end;
        }

        .message.bot {
          align-self: flex-start;
        }

        .message-content {
          padding: 12px 16px;
          border-radius: 18px;
          word-wrap: break-word;
        }

        .message.user .message-content {
          background: ${primaryGradient};
          color: white;
        }

        .message.bot .message-content {
          background: ${botMessageBg};
          color: ${botMessageColor};
        }

        .message-time {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
          padding: 0 8px;
        }

        .message.user .message-time {
          text-align: right;
        }

        .chat-input-container {
          display: flex;
          padding: 16px;
          border-top: 1px solid #e1e5e9;
          background: #fafbfc;
        }

        .chat-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e1e5e9;
          border-radius: 24px;
          outline: none;
          font-size: 14px;
          margin-right: 8px;
        }

        .chat-input:focus {
          border-color: ${primaryColor};
        }

        .send-btn {
          padding: 12px 20px;
          background: ${primaryGradient};
          color: white;
          border: none;
          border-radius: 24px;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.2s;
        }

        .send-btn:hover {
          transform: translateY(-1px);
        }

        .send-btn:active {
          transform: translateY(0);
        }

        /* Custom scrollbar */
        .messages::-webkit-scrollbar {
          width: 6px;
        }

        .messages::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .messages::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .messages::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      </style>
      <div class="chat-header">${title}</div>
      <div class="messages"></div>
      <div class="chat-input-container">
        <input type="text" class="chat-input" placeholder="${placeholder}">
        <button class="send-btn">Send</button>
      </div>
    `;
  }
}

customElements.define("chat-ui", ChatUI);
