// @ts-check
/**
 * Descripe historical person data
 * @class
 * @property {string} name
 * @property {string} info
 * @property {string} image
 * @property {string} url
 */
export class PersonDTO {
  /**
   * @param {string} name
   * @param {string} info
   * @param {string} image
   * @param {string} url
   */
  constructor(name, info, image, url) {
    this.name = name;
    this.info = info;
    this.image = image;
    this.url = url;
  }
}
