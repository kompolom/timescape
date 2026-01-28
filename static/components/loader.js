import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3.3.1/core/lit-core.min.js";

export class TSLoader extends LitElement {
  static properties = {
    active: { type: Boolean },
  };
  render() {
    return html`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ?animated=${!!this.active}
      >
        <path d="M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0" />
        <path d="M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6" />
        <path d="M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    `;
  }
  static styles = css`
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
    :host {
      display: block;
      visibility: hidden;
    }
    :host:has(svg[animated=""]) {
      visibility: visible;
      animation: fadeIn 300ms linear;
      opacity: 1;
      animaion-delay: 0.1s;
    }
    svg {
      transform-box: fill-box;
      transform-origin: center;
    }
    svg[animated=""] {
      animation: spin 2s ease-in-out infinite;
    }
  `;
}
