import { ISODateRange } from "../value-objects/iso-range.js";
import { GeoPoint } from "../value-objects/geopoint.js";
import { EventDTO } from "../dto/historical-event.dto.js";
import { BBox } from "../value-objects/bbox.js";

/**
 * Describe HistoricalEvent
 */
export class HistoricalEvent {
  /**
   * @param {string} id wikidata id
   * @param {ISODateRange} duration when happend
   * @param {GeoPoint} position Where happend
   * @param {string} label what happend
   */
  constructor(id, duration, position, label) {
    this.id = id;
    this.duration = duration;
    this.position = position;
    this.label = label;
  }

  get start() {
    return this.duration.start;
  }

  get end() {
    return this.duration.end;
  }

  /**
   * Check event happened in passed range
   * @param {ISODateRange} range
   * @param {HistoricalEvent} event
   * @returns {boolean}
   */
  static inPeriod(range, event) {
    return (
      range.start <= event.duration.start && range.end >= event.duration.end
    );
  }

  /**
   * Check event happened in passed BBox
   * @param {BBox} boundaries
   * @param {HistoricalEvent} event
   * @returns {boolean}
   */
  static inPlace(boundaries, event) {
    return boundaries.containsPoint(event.position);
  }

  /**
   * @param {EventDTO} dto
   */
  static create(dto) {
    return new HistoricalEvent(
      dto.id,
      new ISODateRange(new Date(dto.start), new Date(dto.end)),
      GeoPoint.create(dto.coord),
      dto.label,
    );
  }
}
