import {
  fromEvent,
  tap,
  map,
  debounceTime,
  switchMap,
  combineLatest,
  startWith,
} from "https://cdn.jsdelivr.net/npm/rxjs@7.8.2/+esm";
import { GeoPoint } from "./value-objects/geopoint.js";
import { loadData } from "./wikibase.js";

export class Timescape {
  #map = null;
  #timeline = null;
  #observable = null;
  constructor(mapEl, timeline) {
    this.#map = mapEl;
    this.#timeline = timeline;
    const time$ = fromEvent(this.#timeline, "rangechanged").pipe(
      map((e) => e.detail.range),
      tap((r) => console.info(`Timeline update: ${r}`)),
    );
    const map$ = fromEvent(this.#map, "change").pipe(
      tap((e) => console.info("Map change", e)),
      map((e) => e.target.boundaries),
      startWith(this.#map.boundaries),
    );
    this.#observable = combineLatest([time$, map$]).pipe(
      debounceTime(400),
      switchMap(([range, position]) => {
        return loadData({ range, position, limit: 50 });
      }),
    );
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

    this.#observable.subscribe((events) => {
      console.info("update timeline events");
      console.table(events);
      this.#timeline.items = events.map((event) => ({
        id: event.event.value,
        content: event.event.label,
        start: event.start,
        end: event.end,
      }));
    });
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
