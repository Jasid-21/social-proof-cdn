class SocialProofPopup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Crear el contenedor principal
    const popup = document.createElement("div");
    popup.className = "social-proof-popup";

    // Header
    const header = document.createElement("div");
    header.className = "popup-header";

    // Icono
    const icon = document.createElement("div");
    icon.className = "popup-icon";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21A2 2 0 0 0 5 23H19A2 2 0 0 0 21 21V9H21ZM19 21H5V3H13V9H19V21Z"
    );
    svg.appendChild(path);
    icon.appendChild(svg);

    // Título
    const title = document.createElement("h4");
    title.className = "popup-title";
    title.textContent = this.getAttribute('title') || 'Nuevo evento';

    // Agregar icono, título y botón al header
    header.appendChild(icon);
    header.appendChild(title);

    // Mensaje
    const message = document.createElement("p");
    message.className = "popup-message";
    message.textContent = this.getAttribute('message') || 'Un nuevo evento ha ocurrido';

    // Tiempo
    const time = document.createElement("div");
    time.className = "popup-time";
    time.id = "popupTime";
    time.textContent = "Hace pocos segundos";

    // Montar todo en el contenedor
    popup.appendChild(header);
    popup.appendChild(message);
    popup.appendChild(time);

    const style = document.createElement("style");
    style.textContent = `
      .social-proof-popup {
        position: fixed;
        bottom: 1.5rem;
        right: -1rem;

        width: 320px;

        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(0, 0, 0, 0.08);

        padding: 16px;
        z-index: 9999;
        opacity: 0;

        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 14px;
        line-height: 1.4;
    }

    .social-proof-popup.show {
        right: 1.5rem;
        opacity: 1;
    }

    /* Header */
    .popup-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
    }

    .popup-icon {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        flex-shrink: 0;
    }

    .popup-icon svg {
        width: 16px;
        height: 16px;
        fill: white;
    }

    .popup-title {
        font-weight: 600;
        color: #1a1a1a;
        font-size: 14px;
        margin: 0;
    }

    .popup-close {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        margin-left: auto;
        color: #999;
        border-radius: 4px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .popup-close:hover {
        background: #f5f5f5;
        color: #666;
    }

    /* Content */
    .popup-message {
        color: #666;
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
    }

    .popup-time {
        color: #999;
        font-size: 12px;
        margin-top: 8px;
        display: flex;
        align-items: center;
    }

    .popup-time::before {
        content: '';
        width: 4px;
        height: 4px;
        background: #999;
        border-radius: 50%;
        margin-right: 6px;
    }

    /* Responsive */
    @media (max-width: 480px) {
        .social-proof-popup {
            width: calc(100vw - 40px);
            left: 20px;
            right: 20px;
        }
    }
    `;

    this.shadowRoot.append(style, popup);
    this.popup = popup;
  }

  show() {
    this.popup.classList.add('show');
  }

  close() {
    this.popup.classList.remove('show');
  }

  static get observedAttributes() {
    return ["title", "message"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.shadowRoot) {
      if (name === "title") {
        this.shadowRoot.querySelector(".popup-title").textContent = newValue;
      }
      if (name === "message") {
        this.shadowRoot.querySelector(".popup-message").textContent = newValue;
      }
    }
  }
}


// sdk.js
(function (global) {
  class SocialProofSDK {
    constructor() {
      this.apiUrl = 'https://rembgapi.vps.webdock.cloud/social-proof';
      this.socketUrl = 'wss://rembgapi.vps.webdock.cloud/social-proof/';
      this.popups = new Map();
      this.socket = null;
      this.businessKey = null;

      // Registrar el custom element solo una vez
      if (!customElements.get("social-proof-popup")) {
        customElements.define("social-proof-popup", SocialProofPopup);
      }
    }

    init({ businessKey }) {
      this.businessKey = businessKey;

      this.connectSocket();
      this.loadPopups();

      // Registrar el custom element solo una vez
      if (!customElements.get("social-proof-popup")) {
        customElements.define("social-proof-popup", SocialProofPopup);
      }
    }

    async pushEvent(eventName, parameters) {
      // Agregar validación
      if (!this.businessKey) {
        console.error("[SocialProof] BusinessId no válido:", this.businessKey);
        return;
      }

      const resp = await fetch(this.apiUrl + '/events/pushEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName,
          parameters,
          businessKey: this.businessKey,
        }),
      });
      return resp;
    }

    async loadPopups() {
      try {
        if (!this.businessKey) {
          console.error("[SocialProof] BusinessId no válido para cargar popups:", this.businessKey);
          return;
        }

        const url = `${this.apiUrl}/popups/getBusinessPopups?businessKey=${this.businessKey}`;
        console.log("[SocialProof] Cargando popups desde:", url); // Debug
        
        const resp = await fetch(url);
        const data = await resp.json();
        data.forEach(popup => {
          this.popups.set(popup.id, popup);
        });
        
        console.log("[SocialProof] Popups cargados:", this.popups.size); // Debug
      } catch (err) {
        console.error("[SocialProof] Error cargando popups:", err);
      }
    }

    connectSocket() {
      if (!this.socketUrl) return;

      this.socket = new WebSocket(this.socketUrl + '?businessKey=' + this.businessKey);

      this.socket.onopen = () => {
        console.log("[SocialProof] Socket conectado");
      };

      this.socket.onmessage = (event) => {
        console.log(event);
        const data = JSON.parse(event.data);
        if (data.type === "firePopup") {
          this.firePopup(data.popupId, data.title, data.message);
        }
      };

      this.socket.onerror = (err) => {
        console.error("[SocialProof] Error en socket:", err);
      };

      this.socket.onclose = () => {
        console.log("[SocialProof] Socket cerrado, reintentando...");
        setTimeout(() => this.connectSocket(), 3000); // reconexión
      };
    }

    firePopup(id, title, message) {
      const popup = this.popups.get(id);
      if (!popup) {
        console.warn(`[SocialProof] Popup con id ${id} no encontrado`);
        return;
      }

      this.showPopup(title, message);
    }

    showPopup(title, message) {
      const popup = document.createElement("social-proof-popup");
      popup.setAttribute("title", title);
      popup.setAttribute("message", message);

      document.body.appendChild(popup);

      setTimeout(() => {
        popup.show();
      }, 16);

      setTimeout(() => {
        popup.close();
        
        setTimeout(() => popup.remove(), 400);
      }, 3416);
    }
  }

  // Exponer global
  global.SocialProof = new SocialProofSDK();

})(window);
