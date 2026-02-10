import { EventDTO } from "./dto/historical-event.dto.js";
import {
  WBK,
  simplifySparqlResults,
} from "https://cdn.jsdelivr.net/npm/wikibase-sdk@11.2.1/+esm";
import { ISODateRange } from "./value-objects/iso-range.js";
import { BBox } from "./value-objects/bbox.js";
import { fromFetch } from "https://cdn.jsdelivr.net/npm/rxjs@7.8.1/fetch/+esm";
import { map } from "https://cdn.jsdelivr.net/npm/rxjs@7.8.2/+esm";
import { DetailedEventDTO } from "./dto/detailed-event.dto.js";

const wdk = WBK({
  instance: "https://www.wikidata.org",
  sparqlEndpoint: "https://query.wikidata.org/sparql",
});

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
      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en". }
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
  const entity = Object.values(json.entities)[0];
  const id = entity.id;

  // helpers
  const getClaimValue = (prop) =>
    entity.claims[prop]?.[0]?.mainsnak?.datavalue?.value ?? null;

  const getTime = (prop) => {
    const v = getClaimValue(prop);
    if (!v) return null;
    return v.time.slice(1, 11); // "+2025-09-16T00:00:00Z" → "2025-09-16"
  };

  const getEntityList = (prop) =>
    (entity.claims[prop] || []).map((c) => c.mainsnak.datavalue.value.id);

  const getSitelink = (site) => entity.sitelinks?.[site]?.title ?? null;

  // 1. Основные поля
  const title = entity.labels?.en?.value ?? id;
  const description = entity.descriptions?.en?.value ?? "";

  // 2. Даты
  const dateStart = getTime("P580");
  const dateEnd = getTime("P582");

  // 3. Координаты (P625)
  const coordsRaw = getClaimValue("P625");
  const coords = coordsRaw ? [coordsRaw.longitude, coordsRaw.latitude] : null;

  // 4. Места (P276)
  const placeIds = getEntityList("P276");

  // 5. Участники (P710)
  const participantIds = getEntityList("P710");

  // 6. Wikipedia
  const wikipediaTitle = getSitelink("enwiki");
  const wikipedia = wikipediaTitle
    ? {
        title: wikipediaTitle,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(
          wikipediaTitle,
        )}`,
      }
    : null;

  // 7. Медиа
  const imageName = getClaimValue("P18");
  const commonsCategory = getClaimValue("P373");

  const media = {
    image: imageName
      ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
          imageName,
        )}`
      : null,
    commonsCategory,
  };

  return {
    id,
    title,
    description,
    dateStart,
    dateEnd,
    coords,
    place: placeIds.map((id) => ({ id })), // можно позже обогащать label'ами
    participants: participantIds.map((id) => ({ id })),
    wikipedia,
    media,
  };
}

export const loadEntityById = (id) => {
  const languages = ["en", "mul"];
  const url = wdk.getEntities({
    ids: [id],
    languages,
    format: "json",
  });
  return fromFetch(url, { selector: (res) => res.json() }).pipe(
    map((data) => {
      return parseWikidataEvent(data);
    }),
  );
};
