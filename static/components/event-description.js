import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3.3.1/core/lit-core.min.js";
import { getCurrentLanguage } from "../util/lang.js";

/**
 * @property {import('../dto/detailed-event.dto').DetailedEventDTO} data event data
 */
export class TSEventDescription extends LitElement {
  static properties = {
    nopicture: { type: Boolean },
    data: {},
  };

  static renderPicture(data) {
    return data.media
      ? html`<picture>
          <img
            class="event-picture"
            decoding="async"
            alt="${data.media.commonsCategory}"
            src="${data.media.image}"
          />
        </picture>`
      : null;
  }
  #renderTitle() {
    return html`<h2>${this.data.title}</h2>`;
  }

  #renderEventDuration() {
    const range = this.data.date;
    if (!range) return null;
    const format = Intl.DateTimeFormat(getCurrentLanguage());
    return html`<time datetime="${range}"
      >${format.formatRange(range.start, range.end)}</time
    >`;
  }

  #renderParticipants() {
    /** @type {import('../dto/person.dto.js').PersonDTO[]} */
    const participants = this.data.participants;
    if (!participants || !participants.length) return null;
    return html`<ul>
      ${participants.map(
        (participant) =>
          html`<li>
            <a target="_blank" href="${participant.url}">
            <figure>
              <img src="${participant.image}" alt="${participant.name}" />
              <figcaption>${participant.name}</figcaption>
            </figure>
            <a>
          </li>`,
      )}
      <ul></ul>
    </ul>`;
  }

  render() {
    console.debug(this.data);
    return html`<article>
      ${this.nopicture ? null : TSEventDescription.renderPicture(this.data)}
      ${this.#renderTitle()} ${this.#renderEventDuration()}
      <p>${this.data.description}</p>
      ${this.data?.participant?.length ? html`<h3>Participants</h3>` : null}
      ${this.#renderParticipants()}
      ${this.data.wikipedia
        ? html`<a href="${this.data.wikipedia}" target="_blank">Read more</a>`
        : null}
    </article>`;
  }
  static styles = css`
    :root {
      display: flex;
      flex-direction: column;
    }
    picture {
      display: contents;
    }
    .event-picture {
      max-width: 100%;
    }
    a {
      color: var(--link-default);
    }
    a:hover {
      color: var(--link-default-hovered);
    }
    time {
      color: var(--text-secondary);
      font-family: math;
    }
    ul {
      padding: 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      list-style: none;
      gap: var(--spacing-1);
    }

    figure {
      overflow: hidden;
      margin: 0;
      padding: 0;
      display: block;
      position: relative;
    }
    figure > img {
      max-width: 100%;
    }
    figure > figcaption {
      font-size: small;
      text-align: center;
    }
  `;
}
