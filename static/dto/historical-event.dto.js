export class EventDTO {
  /**
   * @param {string} id
   * @param {string} label
   * @param {string} start
   * @param {string} end
   * @param {string} coord
   */
  constructor(id, label, start, end, coord) {
    this.id = id;
    this.label = label;
    this.start = start;
    this.end = end;
    this.coord = coord;
  }
}
