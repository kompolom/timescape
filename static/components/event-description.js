import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3.3.1/core/lit-core.min.js";

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

  render() {
    console.debug(this.data);
    return html`<article>
      ${this.nopicture ? null : TSEventDescription.renderPicture(this.data)}
      ${this.#renderTitle()}
      <p>${this.data.description}</p>
      ${this.data.wikipedia?.url
        ? html`<a href="${this.data.wikipedia.url}" target="_blank"
            >Read more</a
          >`
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
  `;
}
