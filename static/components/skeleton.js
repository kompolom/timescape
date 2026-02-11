import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3.3.1/core/lit-core.min.js";

export class TSSkeleton extends LitElement {
  static properties = {
    variant: { reflect: true, type: String },
    style: { type: String, reflect: true },
  };
  render() {
    return html`<span class="skeleton"><slot></slot></span>`;
  }
  static styles = css`
    @keyframes animation-blink {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.4;
      }
      100% {
        opacity: 1;
      }
    }
    :host {
      display: block;
      position: relative;
      overflow: hidden;
      height: 1.2em;
      border-radius: 4px / 6.7px;
      background-color: var(--skeleton-background-color, rgb(0 0 0 / 11%));
      animation: 2s ease-in-out 0.5s infinite normal none running
        animation-blink;
    }
    :host([variant="circular"]) {
      border-radius: 50%;
      width: 50px;
      height: 50px;
    }
    :host([variant="rectangular"]) {
      border-radius: 0;
      height: 190px;
    }
  `;
}
