import {
  from,
  filter,
  tap,
  toArray,
  map,
  of,
  switchMap,
} from "https://cdn.jsdelivr.net/npm/rxjs@7.8.2/+esm";
import { HistoricalEvent } from "./entities/historical-event.js";
import { loadData } from "./wikibase.js";

export class Store {
  #eventsById;
  #loadedScapes;
  constructor() {
    this.#eventsById = new Map();
    this.#loadedScapes = new Map();
  }

  /**
   *
   * @param {HistoricalEvent[]} events
   */
  addEvents(events) {
    for (const event of events) {
      this.#eventsById.set(event.id, event);
    }
  }

  /**
   * Find single event by wikidata id
   * @param {string} eventId
   * @returns {HistoricalEvent|null}
   */
  getEventById(id) {
    return this.#eventsById.get(id);
  }

  /**
   *
   * @param {import('./value-objects/iso-range').ISODateRange} dateRange
   * @param {import('./value-objects/bbox').BBox} bbox
   * @returns {Observable<HistoricalEvent>}
   */
  getEvents(dateRange, bbox) {
    console.debug("loading events:", String(dateRange));
    return from(this.#eventsById.values()).pipe(
      filter(
        (event) =>
          HistoricalEvent.inPeriod(dateRange, event) &&
          HistoricalEvent.inPlace(bbox, event),
      ),
      toArray(),
      switchMap((arr) => {
        if (arr.length) {
          return of(arr);
        }
        console.debug("Load from wikidata");
        return loadData({ range: dateRange, bbox, limit: 500 }).pipe(
          map((events) => events.map(HistoricalEvent.create)),
          tap((he) => this.addEvents(he)),
        );
      }),
    );
  }
}
