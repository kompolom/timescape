function* createDesignator() {
  const DESIGNATORS_SEQ = ["P", "Y", "M", "W", "D", "T", "H", "M", "S"];
  const VAlUES_SEQ = [
    "",
    "years",
    "months",
    "weeks",
    "days",
    "",
    "hours",
    "minutes",
    "seconds",
  ];
  let i = 0,
    lastSeenDesignatorIdx,
    lastSeenDesignator;
  while (i < DESIGNATORS_SEQ.length) {
    lastSeenDesignator = yield {
      designator: DESIGNATORS_SEQ[i],
      duration: VAlUES_SEQ[i],
    };
    i++;
    lastSeenDesignatorIdx = lastSeenDesignator
      ? DESIGNATORS_SEQ.indexOf(lastSeenDesignator, i)
      : -1;
    if (~lastSeenDesignatorIdx) {
      i = lastSeenDesignatorIdx;
    }
  }
  return { designator: DESIGNATORS_SEQ[i], duration: VAlUES_SEQ[i] };
}
export class ISODuration {
  years;
  months;
  weeks;
  days;
  hours;
  minutes;
  seconds;
  constructor(value = {}) {
    const d = typeof value === "string" ? ISODuration.parse(value) : value;
    this.years = d.years;
    this.months = d.months;
    this.weeks = d.weeks;
    this.days = d.days;
    this.hours = d.hours;
    this.minutes = d.minutes;
    this.seconds = d.seconds;
  }
  get empty() {
    return (
      !this.years &&
      !this.months &&
      !this.weeks &&
      !this.days &&
      !this.hours &&
      !this.minutes &&
      !this.seconds
    );
  }
  toString() {
    return this.empty ? "" : ISODuration.stringifyOptimizedDuration(this);
  }
  static canParse(str) {
    return typeof str === "string" && str.length > 2 && str.startsWith("P");
  }
  static parse(str) {
    const d = {};
    const generator = createDesignator();
    let digits = "",
      designator = generator.next();
    for (let i = 0; i < str.length; i++) {
      // number
      if (str.charCodeAt(i) >= 48 && str.charCodeAt(i) <= 57) {
        digits += str[i];
        continue;
      }
      // we got designator
      while (designator.value.designator !== str[i]) {
        designator = generator.next(str[i]);
      }
      if (designator.value.duration) {
        d[designator.value.duration] = Number.parseInt(digits);
      }
      digits = "";
    }
    return new ISODuration(d);
  }
  static stringifyOptimizedDuration(d) {
    const tokens = [];
    const generator = createDesignator();
    let lastDesignatorAtLength = 0;
    for (const { designator, duration } of generator) {
      if (!duration) {
        tokens.push(designator);
        lastDesignatorAtLength = tokens.length;
      }
      if (d[duration]) {
        tokens.push(d[duration] + designator);
      }
    }
    if (tokens.length === lastDesignatorAtLength) {
      tokens.pop();
    }
    return tokens.join("");
  }
}
