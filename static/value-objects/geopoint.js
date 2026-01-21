import { parseParams } from "../util/param.js";

const isGeolocationCoordinates = (d) =>
  typeof d === "object" &&
  d !== null &&
  typeof d["latitude"] === "number" &&
  typeof d["longitude"] === "number" &&
  typeof d["accuracy"] === "number";

const isGeoJsonPoint = (d) =>
  typeof d === "object" &&
  d !== null &&
  Object.hasOwn(d, "type") &&
  d.type === "Point" &&
  Object.hasOwn(d, "coordinates") &&
  Array.isArray(d.coordinates);

/**
 * RFC-5870 compatible Geolocation position
 * @url https://www.rfc-editor.org/rfc/rfc5870
 * @url https://datatracker.ietf.org/doc/html/draft-butler-geojson
 * @example 'geo:48.2010,16.3695,183'
 * @example 'geo:66,30;u=6.500'
 */
export class GeoPoint extends URL {
  get type() {
    return "Point";
  }

  constructor(geo) {
    super(geo);
    const [coordsPart, paramsPart = ""] = this.pathname.split(";", 2);
    const coords = coordsPart.split(",").map(Number.parseFloat);
    const params = parseParams(paramsPart);
    this.latitude = coords[0];
    this.longitude = coords[1];
    this.altitude = coords[2];
    if (typeof params["u"] === "string") {
      this.uncertainty = Number.parseFloat(params["u"]);
    }
  }

  get coordinates() {
    return [this.longitude, this.latitude];
  }

  valueOf() {
    return [this.latitude, this.longitude, this.altitude, this.uncertainty];
  }

  toJSON() {
    return JSON.stringify({
      latitude: this.latitude,
      longitude: this.longitude,
      altitude: this.altitude || null,
      uncertainty: this.uncertainty || null,
    });
  }

  /**
   * return GeoJSON point
   * @link https://datatracker.ietf.org/doc/html/draft-butler-geojson#section-2.1.2
   * @link https://datatracker.ietf.org/doc/html/draft-butler-geojson#section-6.3 coordinate order
   */
  toGeoJSON() {
    return {
      type: this.type,
      coordinates: this.coordinates,
    };
  }

  static parse(location) {
    return new GeoPoint(location);
  }

  static canParse(location) {
    return location.startsWith("geo:") && URL.canParse(location);
  }

  static create(d) {
    if (isGeolocationCoordinates(d)) {
      return new GeoPoint(
        `geo:${[d.latitude, d.longitude, d.altitude].filter(Boolean).join(",")}` +
          (d.accuracy ? `;u=${d.accuracy}` : ""),
      );
    } else if (isGeoJsonPoint(d)) {
      return new GeoPoint(`geo:${d.coordinates[1]},${d.coordinates[0]}`);
    }
    return new GeoPoint(
      `geo:${[d.latitude, d.longitude, d.altitude].filter(Boolean).join(",")}` +
        (d.uncertainty ? `;u=${d.uncertainty}` : ""),
    );
  }
}
