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
import {
  map,
  switchMap,
  from,
} from "https://cdn.jsdelivr.net/npm/rxjs@7.8.2/+esm";
import { DetailedEventDTO } from "./dto/detailed-event.dto.js";
import { PersonDTO } from "./dto/person.dto.js";
import { PlaceDTO } from "./dto/place.dto.js";
import { GeoPoint } from "./value-objects/geopoint.js";
import { getLanguagesWithFallback } from "./util/lang.js";

const wdk = WBK({
  instance: "https://www.wikidata.org",
  sparqlEndpoint: "https://query.wikidata.org/sparql",
});
export async function fetchWikipediaSummary(title, lang = "en") {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

  try {
    const data = await fetch(url).then((r) => r.json());

    return {
      extract: data.extract ?? null,
      description: data.description ?? null,
      thumbnail: data.thumbnail?.source ?? null,
      originalImage: data.originalimage?.source ?? null,
      contentUrls: data.content_urls ?? null,
    };
  } catch (err) {
    console.warn("Failed to load Wikipedia summary:", err);
    return null;
  }
}
export async function fetchWikipediaMediaList(title, lang = "en") {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`;

  try {
    const data = await fetch(url).then((r) => r.json());

    return data.items
      .filter((item) => item.type === "image")
      .map((item) => ({
        title: item.title,
        src: item.original?.source ?? null,
        thumbnail: item.thumbnail?.source ?? null,
      }));
  } catch (err) {
    console.warn("Failed to load Wikipedia media list:", err);
    return [];
  }
}

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
  /** @url https://www.wikidata.org/wiki/Property:P1332 */
  NorthPoint: "P1332",
  SouthPoint: "P1333",
  EastPoint: "P1334",
  WestPoint: "P1335",
  Country: "P17",
  /** @url https://www.wikidata.org/wiki/Property:P30 */
  Continent: "P30",
  Capital: "P36",
  InceptionDate: "P571",
  DemolitionDate: "P576",
  CenterCoordinates: "P5140",
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

/**
 *
 * @param {any} entity
 * @returns {PersonDTO} person dto
 */
function parsePerson(entity) {
  const LANGS = getLanguagesWithFallback(["en"]);
  const sites = LANGS.map((lang) => lang + "wiki").concat(["commonswiki"]);
  const name = getTranslatedValue(LANGS, entity.labels) || entity.id;
  const description = getTranslatedValue(LANGS, entity.descriptions) || "";
  const imageName = getEntityClaimValue(entity, WIKIDATA_PROPERTIES.Image);
  let url = null;
  for (const site of sites) {
    if (entity.sitelinks[site]) {
      url = getSitelinkUrl({
        site: site,
        title: entity.sitelinks[site],
      });
      break;
    }
  }
  return new PersonDTO(
    name,
    description,
    imageName ? getImageUrl(imageName, 600) : null,
    url,
  );
}

/**
 *
 * @param {any} entity
 * @returns {PlaceDTO}
 */
function parsePlace(entity) {
  const LANGS = getLanguagesWithFallback(["en"]);
  const name = getTranslatedValue(LANGS, entity.labels) || "";
  const description = getTranslatedValue(LANGS, entity.descriptions) || "";
  const imageName = getEntityClaimValue(entity, WIKIDATA_PROPERTIES.Image);
  return new PlaceDTO(
    name,
    description,
    imageName ? getImageUrl(imageName, 600) : null,
  );
}

/**
 * Load persons information from wikidata
 * @param {string[]} ids
 * @returns {Promise<PersonDTO[]>}
 */
export function getPersons(ids) {
  if (!Array.isArray(ids) || !ids.length) {
    return Promise.resolve([]);
  }
  return fetch(
    wdk.getEntities({
      ids,
      languages: getLanguagesWithFallback(["en"]),
    }),
  )
    .then((r) => r.json())
    .then((res) => (res.entities ? wdk.simplify.entities(res.entities) : {}))
    .then((persons) => Object.values(persons).map(parsePerson));
}

/**
 * Load places info
 * @param {string[]} ids
 * @returns {Promise<PlaceDTO[]>}
 */
export function getPlaces(ids) {
  if (!Array.isArray(ids) || !ids.length) return Promise.resolve([]);
  return fetch(
    wdk.getEntities({
      ids,
      languages: getLanguagesWithFallback(["en"]),
    }),
  )
    .then((r) => r.json())
    .then((res) => (res.entities ? wdk.simplify.entities(res.entities) : {}))
    .then((places) => Object.values(places).map(parsePlace));
}

async function parseWikidataEvent(json) {
  const LANGS = getLanguagesWithFallback(["en"]);
  const entity = wdk.simplify.entity(Object.values(json.entities)[0]);
  // helpers
  const getClaim = getEntityClaimValue.bind(null, entity);
  const getClaims = getEntityClaimValues.bind(null, entity);

  const title = getTranslatedValue(LANGS, entity.labels) || entity.id;
  const description = getTranslatedValue(LANGS, entity.descriptions) ?? "";

  const r = [
    wikibaseTimeToISOString(getClaim(WIKIDATA_PROPERTIES.StartTime)),
    wikibaseTimeToISOString(getClaim(WIKIDATA_PROPERTIES.EndTime)),
  ].join("/");
  const dateRange = ISODateRange.canParse(r) ? ISODateRange.parse(r) : null;

  const coordsRaw = getClaim(WIKIDATA_PROPERTIES.Coords);
  const coords = coordsRaw
    ? GeoPoint.create({ latitude: coordsRaw[0], longitude: coordsRaw[1] })
    : null;

  const participantIds = getClaims(WIKIDATA_PROPERTIES.Participant);

  const priority = LANGS.map((lang) => ({ lang, site: lang + "wiki" })).concat([
    {
      lang: "en",
      site: "commonswiki",
    },
  ]);
  let wikipedia = {
    url: null,
    summary: "",
    media: null,
  };
  for (const item of priority) {
    if (entity.sitelinks[item.site]) {
      wikipedia.url = getSitelinkUrl({
        site: item.site,
        title: entity.sitelinks[item.site],
      });
      const summary = await fetchWikipediaSummary(
        entity.sitelinks[item.site],
        item.lang,
      );
      wikipedia.summary = summary?.extract;
      // wikipedia.media = await fetchWikipediaMediaList(
      //   entity.sitelinks[item.site],
      //   item.lang,
      // );
      break;
    }
  }

  const imageName = getClaim(WIKIDATA_PROPERTIES.Image);

  const media = {
    image: imageName ? getImageUrl(imageName, 600) : null,
    commonsCategory: getClaim(WIKIDATA_PROPERTIES.CommonsCategory),
  };

  return new DetailedEventDTO(
    entity.id,
    title,
    [wikipedia.summary, description]
      .filter(Boolean)
      .sort((a, b) => a.length - b.length)
      .pop(),
    dateRange,
    coords,
    await getPlaces(getClaims(WIKIDATA_PROPERTIES.Location)),
    media,
    wikipedia.url,
    await getPersons(participantIds),
  );
}

export const loadEntityById = (id) => {
  const url = wdk.getEntities({
    ids: [id],
    languages: getLanguagesWithFallback(["en"]),
    format: "json",
  });
  return fromFetch(url, { selector: (res) => res.json() }).pipe(
    switchMap((data) => {
      return from(parseWikidataEvent(data));
    }),
  );
};

/**
 *
 * @param {string} theme
 */
export function searchTheme(theme) {
  const searchURL = wdk.searchEntities({
    search: theme,
    languages: getLanguagesWithFallback(["en"]),
    limit: 5,
  });
  return fromFetch(searchURL, { selector: (res) => res.json() }).pipe(
    map((res) =>
      res.search.map((ent) => ({
        id: ent.id,
        label: ent.label,
        description: ent.description,
      })),
    ),
  );
}

/**
 *
 * @param {string} itemID wikibase entitiy ID
 */
export async function loadThemeInfo(itemID) {
  const LANGS = getLanguagesWithFallback(["en"]);
  const url = wdk.getEntities({
    ids: [itemID],
    languages: LANGS,
  });
  const entity = await fetch(url)
    .then((res) => res.json())
    .then((r) => (r.entities ? wdk.simplify.entity(r.entities[itemID]) : null));

  // range
  let range = dateRangeFromClaims(
    getEntityClaimValue(entity, WIKIDATA_PROPERTIES.StartTime),
    getEntityClaimValue(entity, WIKIDATA_PROPERTIES.EndTime),
  );
  if (!range) {
    range = dateRangeFromClaims(
      getEntityClaimValue(entity, WIKIDATA_PROPERTIES.InceptionDate),
      getEntityClaimValue(entity, WIKIDATA_PROPERTIES.DemolitionDate),
    );
  }

  // coords
  console.debug(entity);
  return {
    id: entity.id,
    range,
    ...(await getEntityGeography(entity)),
  };
}

/**
 *
 * @param {} entity
 * @returns {Promise<{ bbox?: BBox; center?: GeoPoint; zoom?: number}>}
 */
async function getEntityGeography(entity) {
  const coordsRaw = getEntityClaimValue(entity, WIKIDATA_PROPERTIES.Coords);
  const center = coordsRaw
    ? GeoPoint.create({ latitude: coordsRaw[0], longitude: coordsRaw[1] })
    : null;
  let zoom = undefined;
  let bbox = bboxFromClaims(entity);
  const levels = [
    getEntityClaimValue(entity, WIKIDATA_PROPERTIES.Location),
    getEntityClaimValue(entity, WIKIDATA_PROPERTIES.Country),
    getEntityClaimValue(entity, WIKIDATA_PROPERTIES.Continent),
  ];

  for (let i = 0; i < levels.length; i++) {
    if (bbox) {
      console.debug("boundaries found on level", i - 1);
      break;
    }
    if (!levels[i]) {
      continue;
    }
    let nextEnt = await fetchEntityClaims(levels[i]);
    bbox = bboxFromClaims(nextEnt);
    levels[1] =
      levels[1] || getEntityClaimValue(nextEnt, WIKIDATA_PROPERTIES.Country);
    levels[2] =
      levels[2] || getEntityClaimValue(nextEnt, WIKIDATA_PROPERTIES.Continent);
  }

  if (!bbox) {
    zoom = 2;
  }
  return {
    center,
    zoom,
    bbox,
  };
}

function bboxFromClaims(entity) {
  const north = getEntityClaimValue(entity, WIKIDATA_PROPERTIES.NorthPoint),
    south = getEntityClaimValue(entity, WIKIDATA_PROPERTIES.SouthPoint),
    east = getEntityClaimValue(entity, WIKIDATA_PROPERTIES.EastPoint),
    west = getEntityClaimValue(entity, WIKIDATA_PROPERTIES.WestPoint);
  if (!north || !south || !east || !west) {
    return null;
  }
  return new BBox(west[1], south[0], east[1], north[0]);
}

function dateRangeFromClaims(start, end) {
  if (start && end) {
    return new ISODateRange(new Date(start), new Date(end));
  }
  return null;
}

async function fetchEntityClaims(id) {
  return fetch(
    wdk.getEntities({ ids: [id], props: ["claims"], language: "en" }),
  )
    .then((res) => res.json())
    .then((r) => (r.entities ? wdk.simplify.entity(r.entities[id]) : null));
}
