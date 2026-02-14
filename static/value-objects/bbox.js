import { getArea } from "../../dist/ol.js";
export class BBox {
  #minLon;
  #minLat;
  #maxLon;
  #maxLat;

  /**
   * @param {number} minLon
   * @param {number} minLat
   * @param {number} maxLon
   * @param {number} maxLat
   */
  constructor(minLon, minLat, maxLon, maxLat) {
    if (
      [minLon, minLat, maxLon, maxLat].some(
        (v) => typeof v !== "number" || Number.isNaN(v),
      )
    ) {
      throw new TypeError("BBox value is not a valid number");
    }
    this.#minLon = minLon;
    this.#minLat = minLat;
    this.#maxLon = maxLon;
    this.#maxLat = maxLat;
  }

  get minLon() {
    return this.#minLon;
  }

  get minLat() {
    return this.#minLat;
  }

  get maxLon() {
    return this.#maxLon;
  }

  get maxLat() {
    return this.#maxLat;
  }

  getArea() {
    return getArea(this.toArray());
  }

  /**
   * Checks if a given `GeoPoint` is within the bounding box.
   * @param {import('./geopoint').GeoPoint} point to check
   * @returns {boolean} - True if the point is within the bounding box, false otherwise.
   */
  containsPoint(point) {
    return (
      point.longitude >= this.#minLon &&
      point.longitude <= this.#maxLon &&
      point.latitude >= this.#minLat &&
      point.latitude <= this.#maxLat
    );
  }

  /**
   * b1 includes all points of b2
   * @param {BBox} b1
   * @param {BBox} b2
   */
  static contains(b1, b2) {
    return (
      b1.#minLat <= b2.minLat &&
      b1.#maxLat >= b2.maxLat &&
      b1.#minLon <= b2.minLon &&
      b1.#maxLon >= b2.maxLon
    );
  }

  /**
   * @param {BBox} b1
   * @param {BBox} b2
   * @returns {boolean}
   */
  static intersectLon(b1, b2) {
    return b1.maxLon <= b2.minLon || b2.maxLon >= b1.minLon;
  }

  /**
   * @param {BBox} b1
   * @param {BBox} b2
   * @returns {boolean}
   */
  static intersectLat(b1, b2) {
    return b1.maxLat <= b2.minLat || b2.maxLat >= b1.minLat;
  }

  /**
   * @param {BBox} b1
   * @param {BBox} b2
   * @returns {BBox}
   */
  static join(b1, b2) {
    return new BBox(
      Math.min(b1.minLon, b2.minLon),
      Math.min(b1.minLat, b2.minLat),
      Math.max(b1.maxLon, b2.maxLon),
      Math.max(b1.maxLat, b2.maxLat),
    );
  }

  /**
   * @param {BBox} b1
   * @param {BBox} b2
   * @returns {boolean}
   */
  static intersects(b1, b2) {
    return BBox.intersectLat(b1, b2) || BBox.intersectLon(b1, b2);
  }

  toArray() {
    return [this.#minLon, this.#minLat, this.#maxLon, this.#maxLat];
  }

  toString() {
    return this.toArray().join(",");
  }

  toGeoJSON() {
    return {
      type: "BBox",
      bbox: this.toArray(),
    };
  }

  static fromArray(values) {
    return new BBox(values[0], values[1], values[2], values[3]);
  }
}
