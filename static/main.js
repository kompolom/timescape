import { TSMap } from "./components/map.js";
import { TSTimeline } from "./components/timeline.js";
import { TSLoader } from "./components/loader.js";
import { TSEventPanel } from "./components/event-panel.js";
import { TSSkeleton } from "./components/skeleton.js";
import { TSEventDescription } from "./components/event-description.js";
import { Timescape } from "./app.js";

const registerComponent = (name, ComponentClass) => {
  if (!customElements.get(name)) {
    console.info(`Register: ${name}`);
    customElements.define(name, ComponentClass);
  }
};

const initComponents = () => {
  registerComponent("ts-map", TSMap);
  registerComponent("ts-timeline", TSTimeline);
  registerComponent("ts-loader", TSLoader);
  registerComponent("ts-event-panel", TSEventPanel);
  registerComponent("ts-skeleton", TSSkeleton);
  registerComponent("ts-event", TSEventDescription);
};
initComponents();

document.addEventListener("DOMContentLoaded", async () => {
  initComponents();
  console.group("Init application");
  window.timescape = new Timescape(
    document.querySelector("ts-map"),
    document.querySelector("ts-timeline"),
    document.querySelector("ts-loader"),
    document.querySelector("ts-event-panel"),
  );
  console.groupEnd();
  window.timescape.run();
});
