import { GeoPoint } from "./value-objects/geopoint.js";
export class Timescape {
  #map = null;
  #timeline = null;
  constructor(map, timeline) {
    this.#map = map;
    this.#timeline = timeline;
  }

  async run() {
    console.info("Get current position");
    try {
      const loc = await this.getClientPosition();
      console.info(`Center map to point: ${loc.geopoint}`);
      this.#map.center = loc.geopoint;
    } catch (err) {
      console.info("Cant get current position");
    }

    // TODO: set current date to timeline
    // TODO: get map box boundary
    // TODO: get date-range
    // TODO: make data request
  }

  getClientPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition((pos) => {
        resolve({
          timestamp: pos.timestamp,
          geopoint: GeoPoint.create(pos.coords),
        });
      }, reject);
    });
  }
}
