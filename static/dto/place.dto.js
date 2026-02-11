// @ts-check
/**
 * Descripe historical place data
 * @class
 * @property {string} title
 * @property {string} info
 * @property {string} image
 * @property {string} url
 */
export class PlaceDTO {
  /**
   * @param {string} title
   * @param {string} info
   * @param {string} image
   * @param {string} url
   */
  constructor(title, info, image, url) {
    this.title = title;
    this.info = info;
    this.image = image;
    this.url = url;
  }
}
