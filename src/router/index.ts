import { createRouter, createWebHistory } from "vue-router";

import PlanningView from "@/views/PlanningView.vue";

const routes = [
  {
    path: "/",
    component: PlanningView,
  },
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
