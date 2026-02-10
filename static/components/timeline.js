import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3.3.1/core/lit-core.min.js";
import { Timeline } from "https://cdn.jsdelivr.net/npm/vis-timeline@8.5.0/+esm";
import { DataSet } from "https://cdn.jsdelivr.net/npm/vis-data@8.0.3/+esm";
import styles from "https://cdn.jsdelivr.net/npm/vis-timeline@8.5.0/styles/vis-timeline-graph2d.min.css" with { type: "css" };
import { ISODateRange } from "../value-objects/iso-range.js";

export class TSTimeline extends LitElement {
  #timeline;
  static properties = {
    open: { type: Boolean, reflect: true },
    items: { type: Array },
    selected: { type: String },
    _open: { state: true, type: Boolean },
  };

  get range() {
    if (!this.#timeline) {
      return null;
    }
    return this.#timeline.getWindow();
  }

  connectedCallback() {
    super.connectedCallback();
    this.renderRoot.adoptedStyleSheets.unshift(styles);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.#timeline.off("rangechanged");
    this.#timeline.off("select");
  }

  constructor() {
    super();
    this._open = true;
    this.items = [];
    this.options = {
      start: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365),
      max: new Date(),
      end: new Date(),
      zoomMin: 1000 * 60 * 60 * 24,
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 100,
    };
  }

  render() {
    return html`<div class="panel" ?open=${this._open}>
      <div id="timeline-root"></div>
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
          class="lucide lucide-chevron-up-icon lucide-chevron-up"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </div>`;
  }

  firstUpdated() {
    this.#timeline = new Timeline(
      this.renderRoot.getElementById("timeline-root"),
      this.items,
      this.options,
    );
    this.#timeline.on("rangechanged", (props) => {
      this.dispatchEvent(
        new CustomEvent("rangechanged", {
          detail: { range: new ISODateRange(props.start, props.end) },
          bubbles: true,
          composed: true,
        }),
      );
    });
    this.#timeline.on("select", (props) => {
      const [id] = props.items;
      this.dispatchEvent(
        new CustomEvent("select", {
          bubbles: true,
          composed: true,
          detail: id,
        }),
      );
    });
  }

  updated(changedProps) {
    if (changedProps.has("items")) {
      console.debug("update items", this.items);
      this.#timeline.setItems(this.items);
    }
    if (changedProps.has("selected")) {
      this.#timeline.setSelection([this.selected]);
      this.dispatchEvent(
        new CustomEvent("select", {
          bubbles: true,
          composed: true,
          detail: this.selected,
        }),
      );
    }
  }

  #onCloserClick(e) {
    this._open = !this._open;
  }

  static styles = css`
    :host {
      display: block;
    }
    .panel {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100dvw;
      min-height: 81px;
      transform: translateY(100%);
      transition-property: transform, opacity;
      transition-duration: 200ms;
      transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
      background-color: var(--color-background);
      z-index: 2;
    }
    .panel[open] {
      opacity: 1;
      transform: translateY(0);
    }
    .vis-timeline {
      font-family: sans-serif;
      font-size: 0.9rem;
    }
    .vis-time-axis .vis-text {
      color: inherit;
    }
    .vis-item {
      font-family: sans-serif;
      font-size: 0.8rem;
      color: var(--text-primary);
      background-color: var(--surface-elevated-100);
      border-color: var(--border);
    }
    .vis-time-axis {
      color: var(--text-secondary);
    }
    .vis-item.vis-selected {
      background: var(--surface-elevated-200);
    }
    .closer {
      z-index: 0;
      position: absolute;
      width: 48px;
      height: 24px;
      padding: 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      left: calc(50% - 24px);
      bottom: 100%;
      border-radius: 8px 8px 0 0;
      border-width: 0;
      background-color: var(--color-background);
      color: var(--color-text);
    }
    .panel .closer svg {
      transition-property: transform;
      transition-duration: 200ms;
    }
    .panel[open] .closer svg {
      transform: rotate(180deg);
    }
  `;
}
