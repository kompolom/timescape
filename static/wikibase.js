import {
  WBK,
  simplifySparqlResults,
} from "https://cdn.jsdelivr.net/npm/wikibase-sdk@11.2.1/+esm";
import { ISODateRange } from "./value-objects/iso-range.js";
import { fromFetch } from "https://cdn.jsdelivr.net/npm/rxjs@7.8.1/fetch/+esm";
import { map } from "https://cdn.jsdelivr.net/npm/rxjs@7.8.2/+esm";

const wdk = WBK({
  instance: "https://www.wikidata.org",
  sparqlEndpoint: "https://query.wikidata.org/sparql",
});

/**
 * Query wikidata
 * @param {} query
 * @returns
 */
export const loadData = (query) => {
  if (!query?.range) {
    throw new Error("Cant load data without range");
  } else if ((!query.range) instanceof ISODateRange) {
    throw new Error("query.range should be ISODateRange");
  } else if (query.range.empty) {
    throw new Error("Empty ISODateRange");
  } else if (!query.position) {
    throw new Error("No query position");
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
      FILTER(geof:latitude(?coord) >= ${query.position.min.latitude} &&
              geof:latitude(?coord) <= ${query.position.max.latitude} &&
              geof:longitude(?coord) >= ${query.position.min.longitude} &&
              geof:longitude(?coord) <= ${query.position.max.longitude})
      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],mul,en". }
    }
    GROUP BY ?event ?eventLabel ?start ?end
    ORDER BY ?start
    LIMIT ${query.limit || 20}
    `;
  console.debug(sparql);
  const url = wdk.sparqlQuery(sparql);

  return fromFetch(url, { selector: (res) => res.json() }).pipe(
    map(simplifySparqlResults),
  );
};
