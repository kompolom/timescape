import { ISODuration } from "./iso-duration.js";

const isISOString = (input) => {
  return (
    typeof input === "string" &&
    input.length >= 4 &&
    !Number.isNaN(Number(input.slice(0, 4)))
  );
};
export class ISODateRange {
  #range;
  get start() {
    return this.#range[0] instanceof Date ? this.#range[0] : undefined;
  }
  get end() {
    return this.#range[1] instanceof Date ? this.#range[1] : undefined;
  }
  get sub() {
    return this.#range[0] instanceof ISODuration ? this.#range[0] : undefined;
  }
  get add() {
    return this.#range[1] instanceof ISODuration ? this.#range[1] : undefined;
  }
  get empty() {
    if (!(this.#range[0] instanceof Date && this.#range[1] instanceof Date)) {
      return false;
    }
    return this.#range[0].getTime() === this.#range[1].getTime();
  }
  constructor(left, right) {
    this.#range = [left, right];
  }
  toString() {
    return this.#range
      .map((d) => ("toISOString" in d ? d.toISOString() : d.toString()))
      .join("/");
  }
  static canParse(input) {
    if (typeof input !== "string") {
      return false;
    }
    if (!input.includes("/")) {
      return false;
    }
    return input
      .split("/")
      .every((part) => isISOString(part) || ISODuration.canParse(part));
  }
  static parse(input) {
    if (!ISODateRange.canParse(input)) {
      throw new TypeError("IsoDateRange must be a ISO range");
    }
    const [left, right] = input
      .split("/")
      .map((part) =>
        ISODuration.canParse(part) ? ISODuration.parse(part) : new Date(part),
      );
    return new ISODateRange(left, right);
  }

  static contains(r1, r2) {
    return r1.start <= r2.start && r1.end >= r2.end;
  }

  static overlaps(r1, r2) {
    return r1.start <= r2.end || r1.end <= r2.start;
  }

  static join(r1, r2) {
    return new ISODateRange(
      Math.min(r1.start, r2.start),
      Math.max(r1.end, r2.end),
    );
  }
}
