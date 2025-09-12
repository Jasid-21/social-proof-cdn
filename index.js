class SocialProofPopup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    const wrapper = document.createElement("div");
    wrapper.classList.add("social-proof-popup");

    const title = document.createElement("div");
    title.classList.add("popup-title");
    title.textContent = this.getAttribute("title") || "Título";

    const content = document.createElement("div");
    content.classList.add("popup-content");
    content.textContent = this.getAttribute("content") || "Contenido del popup";

    wrapper.appendChild(title);
    wrapper.appendChild(content);

    const style = document.createElement("style");
    style.textContent = `
      .social-proof-popup {
        width: 100%;
        max-width: 320px;
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        color: rgb(90, 90, 90);
        padding: 8px;
        font-size: 14px;
        box-shadow: 0 0 4px gray;

        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .popup-title {
        font-size: 16px;
        font-weight: 600;
        border-bottom: 1px solid rgb(124, 124, 124);
        margin-bottom: 8px;
      }

      .popup-content {
        font-size: 14px;
      }
    `;

    this.shadowRoot.append(style, wrapper);
  }

  static get observedAttributes() {
    return ["title", "content"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (this.shadowRoot) {
      if (name === "title") {
        this.shadowRoot.querySelector(".popup-title").textContent = newValue;
      }
      if (name === "content") {
        this.shadowRoot.querySelector(".popup-content").textContent = newValue;
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

    pushEvent(eventName, parameters) {
      // Agregar validación
      if (!this.businessKey) {
        console.error("[SocialProof] BusinessId no válido:", this.businessKey);
        return;
      }

      fetch(this.apiUrl + '/events/pushEvent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName,
          parameters,
          businessKey: this.businessKey,
        }),
      })
      .catch(err => console.error("[SocialProof] Error en pushEvent:", err));
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

    showPopup(title, content) {
      const popup = document.createElement("social-proof-popup");
      popup.setAttribute("title", title);
      popup.setAttribute("content", content);

      Object.assign(popup.style, {
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9999,
      });

      document.body.appendChild(popup);

      setTimeout(() => popup.remove(), 3000);
    }

  }

  // Exponer global
  global.SocialProof = new SocialProofSDK();

})(window);
