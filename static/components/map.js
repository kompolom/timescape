import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3.3.1/core/lit-core.min.js";
import { Map, View } from "https://cdn.jsdelivr.net/npm/ol@10.7.0/+esm";
import OSM from "https://cdn.jsdelivr.net/npm/ol@10.7.0/source/OSM.js";
import { fromLonLat } from "https://cdn.jsdelivr.net/npm/ol@10.7.0/proj.js";
import TileLayer from "https://cdn.jsdelivr.net/npm/ol@10.7.0/layer/Tile.js";
import { GeoPoint } from "../value-objects/geopoint.js";
import olStyles from "https://cdn.jsdelivr.net/npm/ol@10.7.0/ol.css" with { type: "css" };

export class TSMap extends LitElement {
  #ol;
  static properties = {
    center: { type: String },
    zoom: { type: Number },
  };

  render() {
    return html`<div id="root"><slot></slot></div>`;
  }

  connectedCallback() {
    super.connectedCallback();
    this.renderRoot.adoptedStyleSheets.push(olStyles);
  }

  firstUpdated() {
    this.#ol = new Map({
      target: this.renderRoot.getElementById("root"),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        projection: "EPSG:3857",
        center: fromLonLat(
          this.center ? GeoPoint.parse(this.center).coordinates : [0, 0],
        ),
        zoom: this.zoom,
      }),
    });
  }

  updated(changedProps) {
    if (changedProps.has("center")) {
      const center =
        this.center instanceof GeoPoint
          ? this.center
          : GeoPoint.parse(this.center);
      this.#ol.getView().setCenter(fromLonLat(center.coordinates));
    }
    if (changedProps.has("zoom")) {
      this.#ol.getView().setZoom(this.zoom);
    }
  }

  static styles = css`
    :host {
      display: block;
    }
    #root {
      width: 100%;
      height: 100%;
    }
    @media (prefers-color-scheme: dark) {
      .ol-layer {
        filter: saturate(0.5) brightness(0.9);
      }
    }
  `;
}
