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
  #loader = null;
  #observable = null;
  constructor(mapEl, timeline, loader) {
    this.#map = mapEl;
    this.#timeline = timeline;
    this.#loader = loader;

    const time$ = fromEvent(this.#timeline, "rangechanged").pipe(
      map((e) => e.detail.range),
      tap((r) => console.info(`Timeline update: ${r}`)),
      startWith(this.#timeline.range),
    );
    const map$ = fromEvent(this.#map, "change").pipe(
      map((e) => e.target.boundaries),
      startWith(this.#map.boundaries),
    );
    this.#observable = combineLatest([time$, map$]).pipe(
      debounceTime(400),
      tap(() => (this.#loader.active = true)),
      switchMap(([range, position]) => {
        return loadData({ range, position, limit: 50 });
      }),
      map((data) => {
        return data.map((item) => ({
          ...item,
          coord: GeoPoint.create(item.coord),
        }));
      }),
      tap(() => (this.#loader.active = false)),
    );
    const marker$ = fromEvent(this.#map, "markerclick").pipe(
      map((e) => e.detail.id),
    );
    const eventSelect$ = fromEvent(this.#timeline, "select").pipe(
      map((e) => e.detail),
    );
    marker$.subscribe((id) => {
      console.debug("Clicked marker:", id);
      this.#timeline.selected = id;
    });
    // eventSelect$.subscribe((id) => {
    //   // TODO: get event position from global storage
    //   ///this.#map.center =
    // });
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
      this.#map.markers = events.map((event) => ({
        id: event.event.value,
        coord: event.coord,
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
