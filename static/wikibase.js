import { EventDTO } from "./dto/historical-event.dto.js";
import {
  WBK,
  simplifySparqlResults,
  getImageUrl,
  wikibaseTimeToISOString,
  getSitelinkUrl,
} from "https://cdn.jsdelivr.net/npm/wikibase-sdk@11.2.1/+esm";
import { ISODateRange } from "./value-objects/iso-range.js";
import { BBox } from "./value-objects/bbox.js";
import { fromFetch } from "https://cdn.jsdelivr.net/npm/rxjs@7.8.1/fetch/+esm";
import { map } from "https://cdn.jsdelivr.net/npm/rxjs@7.8.2/+esm";
import { DetailedEventDTO } from "./dto/detailed-event.dto.js";
import { GeoPoint } from "./value-objects/geopoint.js";
import { getCurrentLanguage, getLanguagesWithFallback } from "./util/lang.js";

const wdk = WBK({
  instance: "https://www.wikidata.org",
  sparqlEndpoint: "https://query.wikidata.org/sparql",
});

const WIKIDATA_PROPERTIES = {
  /** @url https://www.wikidata.org/wiki/Property:P580 */
  StartTime: "P580",
  /** @url https://www.wikidata.org/wiki/Property:P582 */
  EndTime: "P582",
  /** @url https://www.wikidata.org/wiki/Property:P625 */
  Coords: "P625",
  /** @url https://www.wikidata.org/wiki/Property:P276 */
  Location: "P276",
  /** @url https://www.wikidata.org/wiki/Property:P710 */
  Participant: "P710",
  /** @url https://www.wikidata.org/wiki/Property:P18 */
  Image: "P18",
  /** @url https://www.wikidata.org/wiki/Property:P373 */
  CommonsCategory: "P373",
};

/**
 * Get translated text according to language preferences
 * @param {string[]} languages
 * @param {Record<string, string>} prop
 * @returns {string|undefined}
 */
const getTranslatedValue = (languages, prop) => {
  for (const lang of languages) {
    if (prop[lang]) return prop[lang];
  }
};
/**
 * @param {{ claims: Record<string, string[]>}} entity simplified entity
 * @param {string} claim claim ID
 * @returns { string[]}
 */
const getEntityClaimValues = (entity, claim) => entity.claims[claim] || [];
/**
 * @param {{ claims: Record<string, string[]>}} entity simplified entity
 * @param {string} claim claim ID
 * @returns { string|undefined}
 */
const getEntityClaimValue = (entity, claim) =>
  getEntityClaimValues(entity, claim)[0];

/**
 * Query wikidata
 * @param {Object} query
 * @param {ISODateRange} query.range
 * @param {BBox} query.bbox
 * @param {number} query.limit
 * @returns Promise<EventDTO[]>
 */
export const loadData = (query) => {
  if (!query?.range) {
    throw new Error("Cant load data without range");
  } else if ((!query.range) instanceof ISODateRange) {
    throw new Error("query.range should be ISODateRange");
  } else if (query.range.empty) {
    throw new Error("Empty ISODateRange");
  } else if ((!query.bbox) instanceof BBox) {
    throw new Error("Wrong query poition boundary");
  }

  const sparql = `
    SELECT ?event ?eventLabel ?start ?end (SAMPLE(?coord) AS ?coord)
    WHERE
    {
      ?event wdt:P31/wdt:P279*  wd:Q13418847.

      OPTIONAL { ?event wdt:P580 ?start. }    # начало (start time)
      OPTIONAL { ?event wdt:P582 ?end. }      # конец (end time)
      FILTER (?start >= "${query.range.start.toISOString()}"^^xsd:dateTime &&
              ?end <= "${query.range.end.toISOString()}"^^xsd:dateTime)
      ?event wdt:P276 ?location.
      ?location wdt:P625 ?coord.
      FILTER(geof:latitude(?coord) >= ${query.bbox.minLat} &&
              geof:latitude(?coord) <= ${query.bbox.maxLat} &&
              geof:longitude(?coord) >= ${query.bbox.minLon} &&
              geof:longitude(?coord) <= ${query.bbox.maxLon})
      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,${getLanguagesWithFallback(["en"]).join(",")}". }
    }
    GROUP BY ?event ?eventLabel ?start ?end
    ORDER BY ?start
    LIMIT ${query.limit || 20}
    `;
  // console.debug(sparql);
  const url = wdk.sparqlQuery(sparql);

  return fromFetch(url, { selector: (res) => res.json() }).pipe(
    map(simplifySparqlResults),
    map((events) =>
      events.map(
        (e) =>
          new EventDTO(e.event.value, e.event.label, e.start, e.end, e.coord),
      ),
    ),
  );
};

function parseWikidataEvent(json) {
  const LANGS = getLanguagesWithFallback(["en"]);
  const entity = wdk.simplify.entity(Object.values(json.entities)[0]);
  // helpers
  const getClaim = getEntityClaimValue.bind(null, entity);
  const getClaims = getEntityClaimValues.bind(null, entity);

  const title = getTranslatedValue(LANGS, entity.labels) || entity.id;
  const description = getTranslatedValue(LANGS, entity.descriptions) || "";

  const r = [
    wikibaseTimeToISOString(getClaim(WIKIDATA_PROPERTIES.StartTime)),
    wikibaseTimeToISOString(getClaim(WIKIDATA_PROPERTIES.EndTime)),
  ].join("/");
  const dateRange = ISODateRange.canParse(r) ? ISODateRange.parse(r) : null;

  const coordsRaw = getClaim(WIKIDATA_PROPERTIES.Coords);
  const coords = coordsRaw
    ? GeoPoint.create({ latitude: coordsRaw[0], longitude: coordsRaw[1] })
    : null;

  const placeIds = getClaims(WIKIDATA_PROPERTIES.Location);
  const participantIds = getClaims(WIKIDATA_PROPERTIES.Participant);

  const priority = LANGS.map((lang) => lang + "wiki").concat("commonswiki");
  let url = null;
  for (const site of priority) {
    if (entity.sitelinks[site]) {
      url = getSitelinkUrl({ site, title: entity.sitelinks[site] });
      break;
    }
  }
  debugger;

  const imageName = getClaim(WIKIDATA_PROPERTIES.Image);
  const commonsCategory = getClaim(WIKIDATA_PROPERTIES.CommonsCategory);

  const media = {
    image: imageName ? getImageUrl(imageName, 600) : null,
    commonsCategory,
  };

  return new DetailedEventDTO(
    entity.id,
    title,
    description,
    dateRange,
    coords,
    placeIds,
    media,
    url,
    participantIds,
  );
}

export const loadEntityById = (id) => {
  const url = wdk.getEntities({
    ids: [id],
    languages: getLanguagesWithFallback(["en"]),
    format: "json",
  });
  return fromFetch(url, { selector: (res) => res.json() }).pipe(
    map((data) => {
      return parseWikidataEvent(data);
    }),
  );
};
