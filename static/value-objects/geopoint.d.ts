export type GeoJsonPoint = {
  type: "Point";
  coordinates: number[];
};
export type CustomJson = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  uncertainty?: number | null;
};
/**
 * RFC-5870 compatible Geolocation position
 * @url https://www.rfc-editor.org/rfc/rfc5870
 * @url https://datatracker.ietf.org/doc/html/draft-butler-geojson
 * @example 'geo:48.2010,16.3695,183'
 * @example 'geo:66,30;u=6.500'
 */
export declare class GeoPoint extends URL implements GeoJsonPoint {
  /** latitude in WGS-84 */
  latitude: number;
  /** longitude in WGS-84 */
  longitude: number;
  /** altitude in WGS-84 in meters */
  altitude?: number;
  /** Uncertainty in meters */
  uncertainty?: number;
  readonly type = "Point";
  constructor(geo: string);
  get coordinates(): number[];
  valueOf(): (number | undefined)[];
  toJSON(): string;
  /**
   * return GeoJSON point
   * @link https://datatracker.ietf.org/doc/html/draft-butler-geojson#section-2.1.2
   * @link https://datatracker.ietf.org/doc/html/draft-butler-geojson#section-6.3 coordinate order
   */
  toGeoJSON(): GeoJsonPoint;
  static parse(location: string): GeoPoint;
  static canParse(location: string): boolean;
  static create(
    d: GeolocationCoordinates | GeoJsonPoint | CustomJson,
  ): GeoPoint;
}
export {};
