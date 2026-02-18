# Timescape
#### Video Demo:  <URL HERE>
#### Description:
The Timescape is research tool helping to visualise history timeline with geographical place to get entire view of significant history events. With timescape you can look to the world history from different angle. For example you can see events happened not only related to person you research but all events what happened during they lifetime.

#### Possibilities
The Timescape allows to search by different entities. Here is some useful examples:
 - Free mode. The default one. In this mode user free to move and scale timeline and map to see historical events in particular time and place.
 - Historical period. When user types some historical period, like "French revolution", timleline auto moved to 1789-1799 and map centered on the France. So user can see all events in time and place related to french revolution.
 - Historical place. When user types something like "German empire" timeline also moves to 1871-1918 and moved to central europe.
 - Our time place. It may be City or country or something else. In this case app tries to get events from place inception to current date or last 100 years.
  - Historical person. When user types some person, for example "Peter the Great" timeline moves to his period 1682-1725 and related country.
  - year. When user type single year in timeline, application show events for given year in current place.
By default timescape locate map to user current position. It is usefull when user wants to know what is the history of his place.
  
#### Interface
The most important parts of the app are timeline and map. This two components combined create history context (timescape in terms of the app). On the map user can see events related to context. Many events in the same place collapse into clusters. When user zoom in claster it expands to single events or, if events was exactly in the same place, user can see menu with event list. When the user click on map pin, or select event on the timeline, or click on the event in map menu, application hightlight the event in all pannels and optionally, if enabled in settings center map on the event place. After that apllication download more detailed information about the event. It is event dates, event place, event image, excerpt from related wikipedia page if exsist, and event participants with photos and links to each participant related wikipedia page. And of cource link to event related wikipedia page. So by select event, user can see detailed context and continue research of event.
Events on the timeline are sorted by its start-end and duration.

When its too many events collapse button on the timeline becomes really useful.

Alse here is a pin-contol on the map. It allow to keep selected event in map center, what is extreme useful when user works actively with timeline and want to see event places. In the other hand when pin-control is off user can keep map on center of place (eg Country) and briefly see all set of events.

Another important part of the interface is searchbox. It makes application really useful because it accept all wikidata entities and allow to fast move to history period, person lifetime, country, city, war and many other entities.

#### Challenges
The challenge of project is a good dataset. I decided to use wikidata as source of thuth. When user type something in searchbox, application looks for related entities. But not all of them has enough data to build history context. For example if user research person lifetime, it could not be place or too many related places. So application has set of fallbacks to get historical context. For each entity the app look for direct position or related place or related city, country, continent.

Another challenge was data management. We do not want to food wikibase with a lot of queries. To be honest, it works really slow when the map-timeline includes wide context. Even more, if we loaded events in scale of country and then zoom-in map to particular location, we already have all context loaded so despite context changed we should not make any queries to wikidata. To solve it, application has store component which effectively map time with places and events. So UI is responsive when user zoom the map. Furtermore, when user move map, we load anothe chunk of data for next viewbox and join new events to existing timescape to get contigious map related to timeline.

The third challenge was tech stack. I want to make my app awailable for all people. So browser app is a good choice I think. I tried to use modern browser features like geolocation api, of async functions, esm support and even import attributes. Also I used rxjs to keep complex async scenarios maintainable and smooth. For example, when user move map or timeline fast ehough we cancel our stale xhr requests. It helps to reduce network trafic.

The next challenge is localization. We want to get data on user language if possible so we need some utitlies to prioritize wikidata entities and links to get data on user language if possible. But we have to keep fallback not to skip significant events if its not if user language.

As we know js has dynamic types. To ensure data consitency I decided to make dto and entity classes and incapsulate all data to it. It helps to avoid some type-mismatch errors. Also jsodoc notation was really helpful.

#### Tecnoligy
For this project I decided to use bleeding-edge browser technologies: 
  - Native ESM modules helps to load components directly from cdn.
  - Custom elements by lit components allows to hide inner complexity and get smooth interface.
  - rollup is ESM bundler needed only for openlayers map support, which won't work without pre-bundling.
  - native support of dark mode as we have css media queries we can respect user device theme. But it was a little challenging to support it for external web-components by shoelace.style which need to be js managed.

### Components
- index.html contains application "backbone"
- main.css contains global styles
- styles keep shared styles used by many components
- util folder stands for small reusable utilities
- dto & entities contains main application classes
- components folder contains all UI components
- main.js is entrypoint registring all required components and start the app
- app.js is the heart of project which bind orchestrate all components in whole app.
- package.json contains project configuration
