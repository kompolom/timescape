// @ts-check

/**
 * Detailed description of event
 * @class
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {import('../value-objects/iso-range').ISODateRange} dateRange
 * @property {import('../value-objects/geopoint').GeoPoint} geopoint
 * @property {string[]} place
 * @property {{ image: string; commonsCategory: string }} media
 * @property {{tile: string; url: string}} wikipedia
 * @property {Array<import('./person.dto').PersonDTO>} participants
 */
export class DetailedEventDTO {
  /**
   * @param {string} id
   * @param {string} title
   * @param {string} description
   * @param {import('../value-objects/iso-range').ISODateRange} dateRange
   * @param {import('../value-objects/geopoint').GeoPoint} geopoint
   * @param {string} place
   * @param {{ image: string; commonsCategory: string }} media
   * @param {string} wikipedia related wiki page
   * @param {Array<import('./person.dto').PersonDTO>} participants
   */
  constructor(
    id,
    title,
    description,
    dateRange,
    geopoint,
    place,
    media,
    wikipedia,
    participants,
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.date = dateRange;
    this.geopoint = geopoint;
    this.place = place;
    this.media = media;
    this.wikipedia = wikipedia;
    this.participants = participants;
  }
}
