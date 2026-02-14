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
import { Timescape } from "./entities/timescape.js";
import { loadData } from "./wikibase.js";
import { ISODateRange } from "./value-objects/iso-range.js";
import { BBox } from "./value-objects/bbox.js";

export class Store {
  #eventsById;
  /**
   * @type {Map<string, Timescape[]>}
   */
  #loadedScapes;
  constructor() {
    this.#eventsById = new Map();
    this.#loadedScapes = new Map();
  }

  // /**
  //  *
  //  * @param {HistoricalEvent[]} events
  //  */
  // addEvents(events) {
  //   for (const event of events) {
  //     this.#eventsById.set(event.id, event);
  //   }
  // }

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
    if (!bbox.getArea()) {
      console.debug("skip empty area");
      return from([]).pipe(toArray());
    }
    const cachedTimeScape = this.loadTimeScape(dateRange, bbox);
    if (cachedTimeScape) {
      const ids = Array.from(cachedTimeScape);
      console.info("Cached timescape", cachedTimeScape.hash);
      return from(ids.map((id) => this.#eventsById.get(id))).pipe(
        filter(
          (he) =>
            HistoricalEvent.inPeriod(dateRange, he) &&
            HistoricalEvent.inPlace(bbox, he),
        ),
        toArray(),
      );
    }
    console.info("Load timescape from wikidata");
    return loadData({ range: dateRange, bbox, limit: 500 }).pipe(
      map((events) => events.map(HistoricalEvent.create)),
      tap((he) => {
        const ts = new Timescape(dateRange, bbox);
        this.saveTimeScape(ts, he);
      }),
    );
  }

  /**
   * @param {Timescape} timescape
   * @param {HistoricalEvent[]} events
   */
  saveTimeScape(timescape, events) {
    for (const event of events) {
      this.#eventsById.set(event.id, event);
      timescape.registerEvent(event);
    }
    const hash = String(timescape.range);
    const scapes = (this.#loadedScapes.get(hash) || []).sort(
      (a, b) => a.geoSize - b.geoSize,
    );
    // TODO: check sorted DESC
    let inserted = false;
    for (let i = 0; i < scapes.length; i++) {
      // new one fully contains existing
      if (Timescape.contains(timescape, scapes[i])) {
        scapes[i] = timescape;
        inserted = true;
        break;
      } else if (Timescape.overlaps(scapes[i], timescape)) {
        scapes[i] = Timescape.concat(scapes[i], timescape);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      scapes.push(timescape);
      inserted = true;
    }
    this.#loadedScapes.set(hash, scapes);
  }

  /**
   * @param {ISODateRange} range
   * @param {BBox} bbox
   * @returns {Timescape|undefined}
   */
  loadTimeScape(range, bbox) {
    // TODO: check existing range contains queried
    const hash = String(range);
    const scapes = this.#loadedScapes.get(hash);
    if (!Array.isArray(scapes)) return;
    return scapes.find((ts) => BBox.contains(ts.bbox, bbox));
  }
}
