import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3.3.1/core/lit-core.min.js";
import containerStyles from "../styles/container.css" with { type: "css" };
import { loadEntityById } from "../wikibase.js";
import { TSEventDescription } from "./event-description.js";

export class TSEventPanel extends LitElement {
  static properties = {
    eventid: { type: String },
    _data: { state: true },
    _open: { state: true, type: Boolean },
    _loading: { state: true, type: Boolean },
  };

  constructor() {
    super();
    this._data = {};
    this._open = Boolean(this.eventid);
  }

  connectedCallback() {
    super.connectedCallback();
    this.renderRoot.adoptedStyleSheets.push(containerStyles);
  }

  updated(props) {
    if (props.has("eventid")) {
      this.#loadEventData(this.eventid);
      this._open = Boolean(this.eventid);
    }
  }

  #loadEventData(id) {
    this._loading = true;
    loadEntityById(id).subscribe((data) => {
      this._data = data;
      this._loading = false;
    });
  }

  #onCloserClick(e) {
    this._open = !this._open;
  }

  #renderPicture() {
    return this._loading
      ? html`<ts-skeleton
          variant="rectangular"
          class="event-picture"
        ></ts-skeleton>`
      : TSEventDescription.renderPicture(this._data);
  }

  #renderLoader() {
    return html`<ts-skeleton></ts-skeleton><ts-skeleton></ts-skeleton style="width:80%"><ts-skeleton></ts-skeleton>`;
  }

  render() {
    return html`<section
      class="event-panel"
      ?empty=${!this.eventid}
      ?open=${this._open}
      ?loading=${this._loading}
    >
      <div class="wrapper">
        ${this.#renderPicture()}
        <div class="container event-info">
          ${this._loading
            ? this.#renderLoader()
            : html` <ts-event nopicture .data=${this._data}></ts-event> `}
        </div>
      </div>
      <button class="closer" @click=${this.#onCloserClick}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-chevron-right-icon lucide-chevron-right"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </section>`;
  }
  static styles = css`
    picture {
      display: contents;
    }
    .event-panel {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 400px;
      height: 100dvh;
      transform: translateX(-100%);
      transition-property: transform, opacity;
      transition-duration: 200ms;
      transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
      background-color: var(--color-background);
      z-index: 3;
    }
    .event-panel[empty] {
      opacity: 0;
    }
    .event-panel[open] {
      opacity: 1;
      transform: translateX(0);
    }
    .wrapper {
      overflow-x: hidden;
    }
    .event-picture {
      max-width: 100%;
    }
    .closer {
      z-index: 0;
      position: absolute;
      height: 48px;
      width: 24px;
      padding: 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      top: calc(50% - 24px);
      left: 100%;
      border-radius: 0 8px 8px 0;
      border-width: 0;
      background-color: var(--color-background);
      color: var(--color-text);
    }
    .event-panel .closer svg {
      transition-property: transform;
      transition-duration: 200ms;
    }
    .event-panel[open] .closer svg {
      transform: rotate(180deg);
    }
  `;
}
