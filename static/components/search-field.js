import {
  LitElement,
  html,
  css,
} from "https://cdn.jsdelivr.net/gh/lit/dist@3.3.1/core/lit-core.min.js";
import {
  fromEvent,
  tap,
  map,
  debounceTime,
  switchMap,
  filter,
  combineLatest,
  startWith,
  toArray,
} from "https://cdn.jsdelivr.net/npm/rxjs@7.8.2/+esm";
import { searchTheme } from "../wikibase.js";

export class SearchField extends LitElement {
  #typeSubscription;
  static properties = {
    _suggests: { state: true },
    _open: { state: true },
  };

  constructor() {
    super();
    this._suggests = [];
  }

  firstUpdated() {
    const input = this.renderRoot.querySelector("sl-input");
    this.#typeSubscription = fromEvent(input, "input")
      .pipe(
        debounceTime(300),
        map(() => input.value),
        filter((text) => text.length >= 3),
        switchMap((text) => searchTheme(text)),
      )
      .subscribe((s) => this.#updateSuggests(s));
  }

  render() {
    return html`<form @submit=${this.#onSubmit}>
      <input type="hidden" name="id" />
      <sl-input name="q" placeholder="Search some historical period"></sl-input>
      <sl-popup
        id="search-popup"
        anchor="search"
        placement="bottom-start"
        distance="4"
        ?active=${this._suggests.length && this._open}
      >
        <sl-menu @sl-select=${this.#onSelect} id="search-results"
          >${this.#renderMenu()}</sl-menu
        >
      </sl-popup>
    </form>`;
  }

  /**
   *
   * @param {{id: string; label: string; description: string}[]} suggests
   */
  #updateSuggests(suggests) {
    this._suggests = suggests;
    this._open = true;
  }

  #onSelect(e) {
    this._open = false;
    this.dispatchEvent(
      new CustomEvent("search", {
        detail: e.detail.item.value,
        bubbles: true,
        composed: true,
      }),
    );
  }

  #renderMenu() {
    return html`${this._suggests.map(
      (suggest) =>
        html`<sl-menu-item value="${suggest.id}"
          >${suggest.label}<br /><small
            >${suggest.description}</small
          ></sl-menu-item
        >`,
    )}`;
  }

  async #onSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const id = formData.get("id");
    this._open = false;
    if (id) {
      this.dispatchEvent(
        new CustomEvent("search", {
          detail: id,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
  disconnectedCallback() {
    this.#typeSubscription.unsubscribe();
  }
}
