import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3.3.1/core/lit-core.min.js";
import { Timeline } from "https://cdn.jsdelivr.net/npm/vis-timeline@8.5.0/+esm";
import { DataSet } from "https://cdn.jsdelivr.net/npm/vis-data@8.0.3/+esm";
import styles from "https://cdn.jsdelivr.net/npm/vis-timeline@8.5.0/styles/vis-timeline-graph2d.min.css" with { type: "css" };

export class TSTimeline extends LitElement {
  #timeline;
  static properties = {
    events: { type: Array },
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
  }

  constructor() {
    super();
    this.events = [];
    this.options = {};
  }

  render() {
    return html`<div id="timeline-root"></div>`;
  }

  firstUpdated() {
    this.#timeline = new Timeline(
      this.renderRoot.getElementById("timeline-root"),
      this.events,
      this.options,
    );
    this.#timeline.on("rangechanged", (props) => {
      this.dispatchEvent(
        new CustomEvent("rangechanged", {
          detail: props,
          bubbles: true,
          composed: true,
        }),
      );
    });
  }

  static styles = css`
    :host {
      display: block;
    }
    .vis-time-axis .vis-text {
      color: inherit;
    }
  `;
}
