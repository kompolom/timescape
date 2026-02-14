import { BBox } from "../value-objects/bbox.js";
import { ISODateRange } from "../value-objects/iso-range.js";
import { HistoricalEvent } from "./historical-event.js";
/**
 * Present time-space
 * @constructor
 * @class
 */
export class Timescape {
  /**
   * @type {import('../value-objects/iso-range').ISODateRange}
   */
  #range;
  /**
   * @type {import('../value-objects/bbox').BBox}
   */
  #bbox;
  /**
   * @type Set<string>
   */
  #eventIds;

  get range() {
    return this.#range;
  }

  get bbox() {
    return this.#bbox;
  }

  get hash() {
    return Timescape.hash(this.#range, this.#bbox);
  }

  get timeSize() {
    return this.#range.end - this.#range.start;
  }

  get geoSize() {
    return this.#bbox.getArea();
  }

  /**
   * @param {import('../value-objects/iso-range').ISODateRange} range
   * @param {import('../value-objects/bbox').BBox} bbox
   * @param {string[]} ids event ids
   */
  constructor(range, bbox, ids = []) {
    this.#range = range;
    this.#bbox = bbox;
    this.#eventIds = new Set(ids);
  }

  /**
   * @param {HistoricalEvent} historicalEvent
   * @returns boolean
   */
  includes(historicalEvent) {
    return (
      HistoricalEvent.inPeriod(this.#range, historicalEvent) &&
      HistoricalEvent.inPlace(this.#bbox, historicalEvent)
    );
  }

  /**
   * @param {HistoricalEvent} event
   */
  registerEvent(event) {
    this.#eventIds.add(event.id);
  }

  [Symbol.iterator]() {
    return this.#eventIds[Symbol.iterator]();
  }

  /**
   * @param {import('../value-objects/iso-range').ISODateRange} range
   * @param {import('../value-objects/bbox').BBox} bbox
   */
  static hash(range, bbox) {
    return `${range}|${bbox}`;
  }

  static contains(t1, t2) {
    const range = ISODateRange.contains(t1.range, t2.range);
    const bbox = BBox.contains(t1.bbox, t2.bbox);
    return range && bbox;
  }

  static overlaps(t1, t2) {
    // TODO: may not fully overlaps or overlaps by time and not by place
    return (
      ISODateRange.overlaps(t1.range, t2.range) &&
      BBox.intersects(t1.bbox, t2.bbox)
    );
  }

  /**
   * Concat two timescapes in bigger one
   * @param {Timescape} t1
   * @param {Timescape} t2
   * @returns {Timescape} joined timescape
   */
  static concat(t1, t2) {
    const range = new ISODateRange(
      new Date(Math.min(t1.range.start, t2.range.start)),
      new Date(Math.max(t1.range.end, t2.range.end)),
    );
    const bbox = BBox.join(t1.bbox, t2.bbox);
    // join events
    const ids = Array.from(t1).concat(Array.from(t2));
    return new Timescape(range, bbox, ids);
  }
}
