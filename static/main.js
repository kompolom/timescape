import { TSMap } from "./components/map.js";
import { TSTimeline } from "./components/timeline.js";
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
};
initComponents();

document.addEventListener("DOMContentLoaded", async () => {
  initComponents();
  console.group("Init application");
  window.timescape = new Timescape(
    document.getElementsByTagName("ts-map").item(0),
    document.getElementsByTagName("ts-timeline").item(0),
  );
  console.groupEnd();
  window.timescape.run();
});
