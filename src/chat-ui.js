class ChatUI extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.messages = [];
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
  }

  setupEventListeners() {
    const input = this.shadowRoot.querySelector(".chat-input");
    const sendBtn = this.shadowRoot.querySelector(".send-btn");

    const sendMessage = () => {
      const text = input.value.trim();
      if (text) {
        this.addMessage(text, "user");
        input.value = "";

        // Simulate bot response after a delay
        setTimeout(() => {
          this.addMessage(this.getBotResponse(text), "bot");
        }, 1000);
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          font-weight: 600;
          text-align: center;
        }

        .messages {
          height: 380px;
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .message.bot .message-content {
          background: #f1f3f4;
          color: #333;
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
          border-color: #667eea;
        }

        .send-btn {
          padding: 12px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
