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
    constructor(bId) {
      this.apiUrl = 'https://rembgapi.vps.webdock.cloud/social-proof';
      this.socketUrl = 'wss://rembgapi.vps.webdock.cloud/social-proof/';
      this.popups = new Map();
      this.socket = null;
      this.businessId = Number(bId);

      // Inicializar cuando el DOM esté listo
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }

    init() {
      this.connectSocket();
      this.loadPopups();

      // Registrar el custom element solo una vez
      if (!customElements.get("social-proof-popup")) {
        customElements.define("social-proof-popup", SocialProofPopup);
      }
    }

    pushEvent(eventName, parameters) {
      // Agregar validación
      if (!this.businessId) {
        console.error("[SocialProof] BusinessId no válido:", this.businessId);
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
          businessId: this.businessId,
        }),
      })
      .catch(err => console.error("[SocialProof] Error en pushEvent:", err));
    }

    async loadPopups() {
      try {
        if (!this.businessId) {
          console.error("[SocialProof] BusinessId no válido para cargar popups:", this.businessId);
          return;
        }

        const url = `${this.apiUrl}/popups/getBusinessPopups?businessId=${this.businessId}`;
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

    // ... resto del código igual
  }

  const currentScript = document.currentScript;
  const src = new URL(currentScript.src);
  const bId = src.searchParams.get("bId");
  
  console.log("[SocialProof] BusinessId detectado:", Number(bId)); // Mejor debug

  // Exponer global
  global.SocialProof = new SocialProofSDK(bId);

})(window);
