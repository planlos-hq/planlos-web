import { createRouter, createWebHistory, START_LOCATION } from "vue-router";

import PlanningView from "@/views/PlanningView.vue";
import { toViewQuery } from "./viewQuery";
import { loadSavedView } from "./viewStorage";

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

// Beim Laden der Seite ohne Query-Parameter die gespeicherte Ansicht wiederherstellen.
// Nur beim ersten Aufruf, sonst wäre die Standardansicht (= leere Query) nicht erreichbar.
router.beforeEach((to, from) => {
  if (from !== START_LOCATION || to.path !== "/" || Object.keys(to.query).length > 0) return;

  const saved = loadSavedView();
  if (!saved) return;
  const query = toViewQuery(saved);
  // Gespeicherte Standardansicht: nicht umleiten, sonst Endlosschleife
  if (Object.keys(query).length === 0) return;
  return { path: "/", query, replace: true };
});
