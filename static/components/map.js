import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3.3.1/core/lit-core.min.js";
import {
  Map,
  View,
  OSM,
  TileLayer,
  Style,
  Circle,
  Stroke,
  Feature,
  Text,
  Fill,
  Point,
  VectorLayer,
  VectorSource,
  fromLonLat,
  transformExtent,
  Cluster,
  Icon,
  boundingExtent,
  Overlay,
  Control,
} from "../../dist/ol.js";
import { GeoPoint } from "../value-objects/geopoint.js";
import { BBox } from "../value-objects/bbox.js";
import olStyles from "https://cdn.jsdelivr.net/npm/ol@10.7.0/ol.css" with { type: "css" };

class FocusControl extends Control {
  #enabled = false;
  constructor(opts = {}) {
    const element = document.createElement("div");
    const button = document.createElement("button");
    element.className = "pin-control ol-unselectable ol-control";
    element.appendChild(button);
    button.addEventListener(
      "click",
      () => {
        this.#enabled = !this.#enabled;
        element.classList.toggle("active", this.#enabled);
        this.#updateButton(button);
        if (opts.onToggle) {
          opts.onToggle(this.#enabled);
        }
      },
      false,
    );
    super({ element, target: opts.target });
    this.#updateButton(button);
  }
  #updateButton(el) {
    const unpin = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-icon lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;
    const pin = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-off-icon lucide-map-pin-off"><path d="M12.75 7.09a3 3 0 0 1 2.16 2.16"/><path d="M17.072 17.072c-1.634 2.17-3.527 3.912-4.471 4.727a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 1.432-4.568"/><path d="m2 2 20 20"/><path d="M8.475 2.818A8 8 0 0 1 20 10c0 1.183-.31 2.377-.81 3.533"/><path d="M9.13 9.13a3 3 0 0 0 3.74 3.74"/></svg>`;
    el.innerHTML = this.#enabled ? unpin : pin;
  }
  get enabled() {
    return this.#enabled;
  }
}

const markerStyle = new Style({
  image: new Icon({
    src: "/static/assets/marker.svg",
    anchor: [0.5, 1],
  }),
  text: new Text({
    fill: new Fill({ color: "#405368" }),
    textAlign: "center",
    textBaseline: "middle",
  }),
});

const markerSelectedStyle = new Style({
  image: new Icon({
    src: "/static/assets/marker-selected.svg",
    anchor: [0.5, 1],
  }),
  text: new Text({
    fill: new Fill({ color: "#405368" }),
    textAlign: "center",
    textBaseline: "middle",
  }),
});

const clusterStyle = (count) =>
  new Style({
    image: new Circle({
      radius: 15,
      stroke: new Stroke({ width: 4, color: "#405368" }),
      fill: new Fill({ color: "#fff" }),
    }),
    text: new Text({
      text: String(count),
      font: "bold 18px Arial",
      fill: new Fill({ color: "#405368" }),
      textAlign: "center",
      textBaseline: "middle",
    }),
  });

export class TSMap extends LitElement {
  /** @type {Map} */
  #ol;
  /** @type {VectorLayer} */
  #markersLayer;
  /** @type {Overlay} */
  #mapPopupOverlay;
  #followMarker = false;
  static properties = {
    center: { type: String },
    zoom: { type: Number },
    markers: { type: Object },
    bbox: {},
    selectedEvents: { type: Array },
  };

  /**
   * @property {BBox} boundaries
   */
  get boundaries() {
    const extent = this.#ol.getView().calculateExtent();
    return BBox.fromArray(transformExtent(extent, "EPSG:3857", "EPSG:4326"));
  }

  render() {
    return html`
      <div id="root">
        <slot></slot>
        <div
          ?active=${Array.isArray(this.selectedEvents) &&
          this.selectedEvents.length}
          id="popup"
        >
          <sl-menu @sl-select=${this.#onMenuItemClick}
            >${this.#renderMenu()}</sl-menu
          >
        </div>
      </div>
    `;
  }

  /**
   *
   * @param {import('../entities/historical-event').HistoricalEvent} event
   */
  selectEvent(event) {
    if (this.#followMarker) {
      this.#ol.getView().setCenter(fromLonLat(event.position.coordinates));
    }
    this.#markersLayer
      .getSource()
      .getFeatures()
      .forEach((feature) => {
        const clustered = feature.get("features");
        if (clustered && clustered.length > 1) {
          //cluster
          return;
        } else {
          const originalFeature = clustered ? clustered[0] : feature;
          const id = originalFeature.getId();
          if (id === event.id) {
            feature.setStyle(markerSelectedStyle);
          } else {
            feature.setStyle(markerStyle);
          }
        }
      });
  }

  connectedCallback() {
    super.connectedCallback();
    this.renderRoot.adoptedStyleSheets.unshift(olStyles);
  }

  firstUpdated() {
    this.#markersLayer = new VectorLayer({
      source: new VectorSource({ features: [] }),
    });

    this.#ol = new Map({
      target: this.renderRoot.getElementById("root"),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        this.#markersLayer,
      ],
      view: new View({
        projection: "EPSG:3857",
        center: fromLonLat(
          this.center ? GeoPoint.parse(this.center).coordinates : [0, 0],
        ),
        zoom: this.zoom,
      }),
    });
    this.#ol.getView().on("change", (e) => {
      this.dispatchEvent(
        new CustomEvent("change", { bubbles: true, composed: true }),
      );
    });
    this.#ol.addControl(
      new FocusControl({
        onToggle: (v) => {
          this.#followMarker = v;
        },
      }),
    );
    this.#ol.on("click", (event) => {
      this.#ol.forEachFeatureAtPixel(event.pixel, (feature) => {
        const maxZoom = 15;
        const clustered = feature.get("features");
        if (clustered && clustered.length > 1) {
          // Cluster
          if (this.#ol.getView().getZoom() >= maxZoom) {
            this.#mapPopupOverlay = new Overlay({
              element: this.renderRoot.getElementById("popup"),
              positioning: "bottom-center",
              stopEvent: true,
              offset: [0, -10],
            });
            this.#ol.addOverlay(this.#mapPopupOverlay);
            this.dispatchEvent(
              new CustomEvent("clusterclick", {
                detail: { ids: clustered.map((f) => f.getId()) },
                bubbles: true,
                composed: true,
              }),
            );
            this.#mapPopupOverlay.setPosition(event.coordinate);
            return;
          } else {
            const extent = boundingExtent(
              clustered.map((f) => f.getGeometry().getCoordinates()),
            );
            this.#ol.getView().fit(extent, {
              duration: 300,
              padding: [50, 50, 50, 50],
              maxZoom,
            });
          }
        } else {
          // Point
          const original = clustered ? clustered[0] : feature;
          const id = original.getId();
          this.dispatchEvent(
            new CustomEvent("markerclick", {
              detail: { id },
              bubbles: true,
              composed: true,
            }),
          );
        }
      });
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
    if (changedProps.has("bbox")) {
      const extent = transformExtent(
        this.bbox.toArray(),
        "EPSG:4326",
        "EPSG:3857",
      );
      this.#ol.getView().fit(extent, {
        duration: 500,
        callback: () => {
          console.debug({
            in: this.bbox.toArray(),
            out: this.boundaries.toArray(),
          });
        },
      });
    }
    if (changedProps.has("markers")) {
      const features = (this.markers || []).map(this.#createMarker);
      const source = this.#markersLayer.getSource();
      if (source) {
        source.dispose();
      }
      this.#markersLayer.setStyle((feature) => {
        const size = feature.get("features").length;
        return size > 1 ? clusterStyle(size) : markerStyle;
      });
      this.#markersLayer.setSource(
        new Cluster({ distance: 40, source: new VectorSource({ features }) }),
      );
    }
  }

  #createMarker(conf) {
    const feature = new Feature({
      geometry: new Point(fromLonLat(conf.coord.coordinates)),
    });
    feature.setStyle(markerStyle);
    feature.setId(conf.id);
    return feature;
  }

  #renderMenu() {
    if (!Array.isArray(this.selectedEvents) || !this.selectedEvents.length)
      return null;
    return this.selectedEvents.map(
      (ev) => html`<sl-menu-item value="${ev.id}">${ev.label}</sl-menu-item>`,
    );
  }

  #onMenuItemClick(e) {
    this.#mapPopupOverlay.setPosition(undefined);
    this.#mapPopupOverlay.dispose();
    this.dispatchEvent(
      new CustomEvent("markerclick", {
        detail: { id: e.detail.item.value },
        composed: true,
        bubbles: true,
      }),
    );
  }

  static styles = css`
    :host {
      display: block;
      --ol-background-color: var(--color-background);
      --ol-subtle-foreground-color: var(--text-secondary);
      --ol-foreground-color: var(--text-primary);
    }
    #root {
      width: 100%;
      height: 100%;
    }
    #popup {
      position: absolute;
    }
    .ol-zoom {
      right: 0.5em;
      left: auto;
    }
    .pin-control {
      right: 0.5em;
      top: 4em;
    }
    @media (prefers-color-scheme: dark) {
      .ol-layer {
        filter: saturate(0.5) brightness(0.9);
      }
    }
  `;
}
