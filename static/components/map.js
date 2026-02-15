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
} from "../../dist/ol.js";
import { GeoPoint } from "../value-objects/geopoint.js";
import { BBox } from "../value-objects/bbox.js";
import olStyles from "https://cdn.jsdelivr.net/npm/ol@10.7.0/ol.css" with { type: "css" };

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
  static properties = {
    center: { type: String },
    zoom: { type: Number },
    markers: { type: Object },
    bbox: {},
  };

  /**
   * @property {BBox} boundaries
   */
  get boundaries() {
    const extent = this.#ol.getView().calculateExtent();
    return BBox.fromArray(transformExtent(extent, "EPSG:3857", "EPSG:4326"));
  }

  render() {
    return html`<div id="root"><slot></slot></div>`;
  }

  /**
   *
   * @param {import('../entities/historical-event').HistoricalEvent} event
   */
  selectEvent(event) {
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
    this.#ol.on("click", (event) => {
      this.#ol.forEachFeatureAtPixel(event.pixel, (feature) => {
        const maxZoom = 15;
        const clustered = feature.get("features");
        if (clustered && clustered.length > 1) {
          // Cluster
          if (this.#ol.getView().getZoom() >= maxZoom) {
            const ids = clustered.map((f) => f.getId());
            this.dispatchEvent(
              new CustomEvent("clusterclick", {
                detail: { ids },
                bubbles: true,
                composed: true,
              }),
            );
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
    .ol-zoom {
      right: 0.5em;
      left: auto;
    }
    @media (prefers-color-scheme: dark) {
      .ol-layer {
        filter: saturate(0.5) brightness(0.9);
      }
    }
  `;
}
