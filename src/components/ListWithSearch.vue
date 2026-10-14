<template>
  <div class="component-container">
    <search-bar @new-search="searchElements" />
    <div
      v-if="props.sortOptions && props.showSortToolbar"
      class="sort-toolbar d-flex align-items-center gap-2 px-2 py-1 ms-1"
    >
      <b-form-select
        v-if="props.sortOptions.length > 1"
        v-model="sortKeyIndex"
        :options="props.sortOptions.map((option, i) => ({ value: i, text: option.label }))"
        size="sm"
        class="sort-select"
      />
      <sort-direction-button v-model="sortDirection" :size="32" />
    </div>
    <div class="list-box">
      <div class="list-wrapper" :style="{ '--max-height': props.maxHeight + 'px' || '300px' }">
        <b-list-group class="d-flex flex-column gap-1">
          <!-- slot wrapped in div mit v-for -> slot für jedes Listenelement -->
          <b-list-group-item
            class="list-item rounded-3"
            v-for="item in displayedItems"
            :key="item.id"
            @click="handleSelect(item as T)"
            :class="{ selected: isSelected(item as T) }"
            :draggable="props.draggable"
            @dragstart="onEventDragStart($event, item as T)"
          >
            <slot name="listElement" :item="item"></slot>
          </b-list-group-item>
        </b-list-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends { id: string | number; selected?: boolean }">
  import SearchBar from "@/components/SearchBar.vue";
  import { computed, ref, watch } from "vue";
  import { BListGroup, BListGroupItem, BFormSelect } from "bootstrap-vue-next";
  import SortDirectionButton from "@/components/IconButtons/SortDirectionButton.vue";
  import type { SortOption } from "@/models/SortOptions";

  const props = defineProps<{
    items: T[];
    searchableText?: (item: T) => string;
    isItemSelected?: (item: T) => boolean;
    draggable: boolean;
    maxSearchDepth?: number;
    selectedId?: number | string | null;
    maxHeight?: number;
    sortOptions?: SortOption<T>[];
    showSortToolbar?: boolean;
  }>();

  const query = ref<string>("");
  const sortKeyIndex = ref(0);
  const sortDirection = ref<"asc" | "desc">("asc");

  watch(
    () => props.sortOptions?.length ?? 0,
    length => {
      if (sortKeyIndex.value >= length) {
        sortKeyIndex.value = 0;
      }
    }
  );

  const emit = defineEmits(["select", "toggle", "onEventDragStart"]);

  function onEventDragStart(event: DragEvent, item: T) {
    emit("onEventDragStart", event, item);
  }

  /**
   * Übergibt per emit die Id des selektierten Items an die Elternkomponente. Wird von der handleSelect()-Funktion nur
   * ausgeührt, insofern das Prop selectedId von der Elternkomponente übergeben wird.
   *
   * @param item - generisches Objekt des Typs T
   */
  function select(id: number | string | null) {
    emit("select", id);
  }

  /**
   * Wird beim Anklicken/Selektieren eines Items aufgerufen und nutzt die Funktionen isSingleSelectActivated
   * und hasSelectedAttribute, um zu entscheiden, wie die Selektion erfolgt. Entweder wird die id des ausgewählten items per emit
   * an die Elternkomponente übergeben oder das Attribut "selected" geändert.
   *
   * @param item - generisches Objekt des Typs T
   */
  function handleSelect(item: T) {
    if (isSingleSelectActivated()) {
      if (isSelected(item)) {
        select(null);
      } else {
        select(item.id);
      }
    } else {
      emit("toggle", item.id);
    }
  }

  /**
   * Überprüft, ob das Prop "selectedId" übergeben wurde.
   * Falls dies der Fall ist, ist immer nur ein Item in der Liste auswählbar
   *
   * @returns ob Prop "selectedId" übergeben wurde (boolean)
   */
  function isSingleSelectActivated(): boolean {
    return props.selectedId !== undefined;
  }

  /**
   * Funktion zum überprüfen, ob ein Item der Liste ausgewählt wurde.
   * Wird genutzt um dynamisch die CSS-Klasse "selected" zu vergeben, um selektierte Items hervorzuheben
   *
   * @returns ob Item ausgewält ist (boolean)
   */
  function isSelected(item: T) {
    if (props.isItemSelected) {
      return props.isItemSelected(item);
    }
    if (isSingleSelectActivated()) {
      return String(props.selectedId) === String(item.id);
    }
    return false;
  }

  const displayedItems = computed(() => {
    const filtered = props.items.filter(item => {
      if (query.value.length === 0) {
        return true;
      }
      if (props.searchableText !== undefined && props.searchableText(item) !== "") {
        if (props.searchableText(item).toLowerCase().includes(query.value)) return true;
      }
      return matchesQuery(item, query.value, props.maxSearchDepth);
    });

    const sortOption = props.sortOptions?.[sortKeyIndex.value];
    if (!sortOption) {
      return filtered;
    }
    const direction = sortDirection.value === "asc" ? 1 : -1;
    return filtered.sort((a, b) => direction * sortOption.comparator(a as T, b as T));
  });

  /**
   * Nutz den Suchterm zum Filtern der Items
   *
   * @param searchText - SuchText von der SearchBar-Komponente
   */
  function searchElements(searchText: string) {
    query.value = searchText.trim().toLowerCase();
  }

  /**
   * Durchsucht rekursiv die Attribute eines Objekts bis zu den primitiven Datentypen und überprüft diese auf Übereinstimmung
   * mit der Query. Über den Parameter `maxDepth` kann dabei gesteuert werden, wie tief innerhalb der Datenstruktur gesucht werden soll.
   * Standardmäßig wird mit einer Tiefe von 1 gesucht.
   *
   * @param obj - Objekt, Array oder Attribut mit primitven Datentyp
   * @param query - gesuchter String
   * @param maxDepth - maximale Suchtiefe (default: 2)
   */
  function matchesQuery(obj: unknown, query: string, maxDepth: number = 2): boolean {
    function search(value: unknown, depth: number): boolean {
      if (depth > maxDepth) return false;
      // Prüfen, ob das Objekt null ist
      if (value === null || value === undefined) return false;

      // letzter Rekursionsschritt: Attribute des Objekts werden auf Übereinstimmung gecheckt
      if (typeof value !== "object" && typeof value !== "boolean") {
        return String(value).toLowerCase().includes(query);
      }

      // Wenn das Attribut des Objekts ein Array ist, müssen die einzelnen Elemente überprüft werden
      // Insofern ein Element übereinstimmt, wird true zurückgegeben.
      if (Array.isArray(value)) {
        return value.some(item => search(item, depth + 1));
      }

      // Wenn obj ein Objekt ist, wird die Funktion rekursiv mit den Attributen des Objekts aufgerufen
      return Object.values(value).some(item => search(item, depth + 1));
    }

    return search(obj, 0);
  }
</script>

<style scoped lang="css">
  .selected {
    background-color: var(--seleted-item-color);
    border-left: solid 4px black !important;
    margin-left: 5px;
  }

  .list-wrapper {
    flex-grow: 1;
    max-height: var(--max-height);
    min-height: 0;
    overflow-y: auto !important;
    padding-bottom: 5px;
    padding-top: 5px;
  }

  .list-box {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    margin-inline: 5px;
    margin-top: 0;
    min-height: 0;
    padding: 5px;
  }

  .list-item {
    border-top-width: 1px !important;
    overflow: hidden;
    text-overflow: ellipsis;
    user-select: none;
    white-space: nowrap;
  }

  .component-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: min(500px, 50vw);
    min-height: 0;
  }
</style>
