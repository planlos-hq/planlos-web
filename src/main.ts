import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";

import "./assets/main.css";
import "./assets/vuecal-override.css";
import { getAllApplicationData } from "./api/globalGalactic";

async function init() {
  const pinia = createPinia();
  const app = createApp(App);

  app.use(pinia);
  app.use(router);

  try {
    await getAllApplicationData();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }

  app.mount("#app");
}
init();
