export class BBox {
  #minLon;
  #minLat;
  #maxLon;
  #maxLat;

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

  /**
   * Checks if a given `GeoPoint` is within the bounding box.
   * @param {import('./geopoint').GeoPoint} point to check
   * @returns {boolean} - True if the point is within the bounding box, false otherwise.
   */
  contains(point) {
    return (
      point.longitude >= this.#minLon &&
      point.longitude <= this.#maxLon &&
      point.latitude >= this.#minLat &&
      point.latitude <= this.#maxLat
    );
  }

  toArray() {
    return [this.#minLon, this.#minLat, this.#maxLon, this.#maxLat];
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
