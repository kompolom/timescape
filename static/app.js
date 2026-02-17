import {
  fromEvent,
  tap,
  map,
  debounceTime,
  switchMap,
  combineLatest,
  startWith,
  toArray,
} from "https://cdn.jsdelivr.net/npm/rxjs@7.8.2/+esm";
import { GeoPoint } from "./value-objects/geopoint.js";
import { Store } from "./store.js";
import { HistoricalEvent } from "./entities/historical-event.js";
import { loadThemeInfo, searchTheme } from "./wikibase.js";
import { BBox } from "./value-objects/bbox.js";

export class Timescape {
  #map = null;
  #timeline = null;
  #loader = null;
  #observable = null;
  #panel = null;
  #search = null;
  #store = new Store();

  constructor(mapEl, timeline, loader, panel, search) {
    this.#map = mapEl;
    this.#timeline = timeline;
    this.#loader = loader;
    this.#panel = panel;
    this.#search = search;

    const time$ = fromEvent(this.#timeline, "rangechanged").pipe(
      map((e) => e.detail.range),
      tap((r) => console.info(`Timeline update: ${r}`)),
      startWith(this.#timeline.range),
    );
    const map$ = fromEvent(this.#map, "change").pipe(
      map((e) => e.target.boundaries),
      startWith(BBox.fromArray([0, 0, 0, 0])),
    );
    this.#observable = combineLatest([time$, map$]).pipe(
      debounceTime(400),
      tap(() => (this.#loader.active = true)),
      switchMap(([range, bbox]) => this.#store.getEvents(range, bbox)),
      tap(() => (this.#loader.active = false)),
    );
    const marker$ = fromEvent(this.#map, "markerclick").pipe(
      map((e) => e.detail.id),
    );
    const eventSelect$ = fromEvent(this.#timeline, "select").pipe(
      map((e) => e.detail),
    );
    const eventSearch$ = fromEvent(this.#search, "search")
      .pipe(map((e) => e.detail))
      .subscribe((eID) => {
        this.research(eID);
      });
    marker$.subscribe((id) => {
      console.debug("Clicked marker:", id);
      this.#timeline.selected = id;
    });

    eventSelect$.subscribe((id) => {
      console.debug("timeline event select");
      this.#panel.eventid = id;
      const event = this.#store.getEventById(id);
      if (event) {
        this.#map.selectEvent(event);
      }
    });
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

    this.#observable.subscribe(
      /**
       * @param {HistoricalEvent[]} events
       */
      (events) => {
        console.info("update timeline events");
        console.table(events);
        this.#timeline.items = events.map((event) => ({
          id: event.id,
          content: event.label,
          start: event.start,
          end: event.end,
        }));
        this.#map.markers = events.map((event) => ({
          id: event.id,
          coord: event.position,
        }));
      },
    );
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

  /**
   * search events by theme
   * @param {string} theme
   */
  search(theme) {
    searchTheme(theme);
  }

  /**
   *
   * @param {string} itemId
   */
  async research(itemId) {
    const data = await loadThemeInfo(itemId);
    if (data.center) {
      this.#map.center = data.center;
    }
    if (data.bbox) {
      this.#map.bbox = data.bbox;
    }
    if (data.range) {
      this.#timeline.window = data.range;
    }
  }
}
