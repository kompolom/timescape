/**
 * @param {string} id
 * @param {string} title
 * @param {string} description
 * @param {import('../value-objects/iso-range').ISODateRange} dateRange
 * @param {import('../value-objects/geopoint').GeoPoint} geopoint
 * @param {string[]} placeId
 * @param {{ image: string; commonsCategory: string }} media
 * @param {{tile: string; url: string}} wikipedia
 * @param {string[]} participants
 */
export class DetailedEventDTO {
  /**
   * @param {string} id
   * @param {string} title
   * @param {string} description
   * @param {import('../value-objects/iso-range').ISODateRange} dateRange
   * @param {import('../value-objects/geopoint').GeoPoint} geopoint
   * @param {string} placeId
   * @param {{ image: string; commonsCategory: string }} media
   * @param {string} wikipedia
   * @param {string[]} participants
   */
  constructor(
    id,
    title,
    description,
    date,
    geopoint,
    placeId,
    media,
    wikipedia,
    paritcipants,
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.date = date;
    this.geopoint = geopoint;
    this.placeId = placeId;
    this.media = media;
    this.wikipedia = wikipedia;
    this.participants = paritcipants;
  }
}
