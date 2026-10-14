<template>
  <b-form-floating-label
    :label="placeholder"
    label-for="input"
    class="flex-grow-1"
    v-if="type === 'text' || type === 'number'"
  >
    <b-form-input
      id="input"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :model-value="inputValue"
      :disabled="disabled"
      @update:model-value="selectCorrectType"
    />
  </b-form-floating-label>

  <div v-if="type === 'select-with-edit'" class="d-flex flex-row mb-0 align-items-center gap-2">
    <b-form-floating-label :label="placeholder" label-for="select-with-edit" class="flex-grow-1">
      <b-form-select
        id="select-with-edit"
        :placeholder="placeholder"
        :model-value="modelValue"
        :disabled="disabled"
        :options="selectOptions"
        :required="required"
        @update:model-value="value => $emit('update:modelValue', value as string)"
      >
      </b-form-select>
    </b-form-floating-label>
    <b-button @click="$emit('edit')" variant="primary"><pencil /></b-button>
    <b-button @click="$emit('save')" v-if="showSaveButton" variant="primary"><save /></b-button>
  </div>

  <b-form-floating-label
    :label="placeholder"
    label-for="select"
    class="flex-grow-1"
    v-if="type === 'select'"
  >
    <b-form-select
      id="select"
      :placeholder="placeholder"
      :model-value="modelValue"
      :disabled="disabled"
      :options="selectOptions"
      :required="required"
      @update:model-value="value => $emit('update:modelValue', value as string)"
    >
    </b-form-select>
  </b-form-floating-label>

  <b-form-floating-label
    :label="placeholder"
    label-for="notes"
    class="flex-grow-1"
    v-if="type === 'text-area'"
  >
    <b-form-textarea
      id="notes"
      :placeholder="placeholder"
      rows="5"
      max-rows="10"
      :model-value="inputValue"
      :style="{ resize: 'vertical', height: '10rem' }"
      :disabled="disabled"
      @update:model-value="value => $emit('update:modelValue', value as string)"
    />
  </b-form-floating-label>

  <b-form-checkbox
    v-if="type === 'checkbox'"
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="value => $emit('update:modelValue', value as boolean)"
  >
    {{ placeholder }}
  </b-form-checkbox>

  <div v-if="type === 'search-select'">
    <dropdown-with-search
      :button-text="placeholder"
      :items="searchItems"
      :disabled="disabled"
      :is-item-selected="isItemSelected!"
      @toggle="id => $emit('toggle', id)"
      class="mb-1"
    >
      <template #listElement="{ item }">
        <slot name="listItem" :item="item">
          {{ item }}
        </slot>
      </template>
    </dropdown-with-search>

    <!--button und disabled dienen für einheitliches Aussehen zwischen Anzeige und Editiermodus-->
    <b-list-group>
      <b-list-group-item
        v-for="selectedItem in selectedItems"
        :key="selectedItem.id"
        :button="disabled"
        class="d-flex flex-row justify-content-between align-items-center"
      >
        <slot name="listItem" :item="selectedItem"> {{ selectedItem }} </slot>
        <delete-button :size="24" @click="$emit('toggle', selectedItem.id)" class="p-1" />
      </b-list-group-item>
    </b-list-group>
  </div>

  <h5 class="mt-3 ms-1" v-if="type === 'heading'" :style="{ fontSize: '1rem' }">
    {{ placeholder }}
  </h5>
</template>

<script setup lang="ts" generic="T extends { id: number }">
  import {
    BFormInput,
    BFormFloatingLabel,
    BFormSelect,
    BFormCheckbox,
    BFormTextarea,
    BListGroup,
    BListGroupItem,
    BButton,
  } from "bootstrap-vue-next";
  import { computed, isRef, type ComputedRef } from "vue";
  import DropdownWithSearch from "./DropdownWithSearch.vue";
  import type { Lecturer } from "@/models/Lecturer";
  import type { Room } from "@/models/Room";
  import type { StudyGroup } from "@/models/StudyGroup";
  import type { DegreeProgram } from "@/models/DegreeProgram";
  import type { LecturerKind, SemesterSeason } from "@/enums/enums";
  import DeleteButton from "./IconButtons/DeleteButton.vue";
  import type { StudyGroupTemplate } from "@/models/StudyGroupTemplate.ts";
  import { Pencil, Save } from "lucide-vue-next";

  export type FormInputType =
    | "text"
    | "text-area"
    | "number"
    | "checkbox"
    | "select"
    | "search-select"
    | "select-with-edit"
    | "heading";

  export type Ressource =
    | Room
    | Lecturer
    | StudyGroup
    | SemesterSeason
    | DegreeProgram
    | LecturerKind
    | StudyGroupTemplate;

  export type SelectOption = {
    value: Ressource;
    text: string;
  };

  type FormModelValue<U> = string | number | boolean | U[] | Ressource | null | undefined;
  const props = defineProps<{
    /**Gibt an, ob Eingabefelder editierbar sind */
    disabled: boolean;
    /**Bezeichnung des Inputs */
    placeholder: string;
    /**dient der Auswahl der jeweiligen Komponente */
    type: FormInputType;
    /**Übergabe eines v-models */
    modelValue: FormModelValue<T>;
    /**legt fest, ob Input ausgefüllt sein muss, bevor bestätigt werden kann */
    required: boolean;
    /**relevant für 'select'-types und stellt die einzelnen Optionen zur Auswahl */
    options?: ComputedRef<SelectOption[]> | ComputedRef<T[]> | T[];
    /**prüft, ob ein bestimmtes Element ausgewählt wurde. Wird bei der Multiauswahl verwendet. */
    isItemSelected?: (item: T) => boolean;
    /**soll der Save-Button beim select-with-edit angezeigt werden*/
    showSaveButton?: boolean;
  }>();
  /**
   * wird verwendet, da modelValue bei 'text' und 'text-area' kein boolean sein darf
   * begrenzt Typen auf 'string' und 'number' statt 'string | number | boolean | undefined | null;''
   */
  const inputValue = computed(() => props.modelValue as string | number);

  /**
   * Bereitet Optionen für das Bootstrap select vor.
   */
  const selectOptions = computed(() => {
    if (!props.options) {
      return [];
    }
    if (isRef(props.options)) {
      return props.options.value as SelectOption[];
    }
    return [];
  });

  /**
   * Bereitet Optionen für die Multiauswahl vor.
   */
  const searchItems = computed(() => {
    if (!props.options) {
      return [];
    }
    if (isRef(props.options)) {
      return props.options.value as T[];
    }
    return [];
  });

  /**
   * Erzeugt ein Array für die Anzeige in der Multiauswahl.
   */
  const selectedItems = computed(() => {
    if (Array.isArray(props.modelValue)) {
      return props.modelValue as T[];
    }

    return [];
  });

  const emit = defineEmits<{
    /**wird aufgerufen, wenn sich eine Eingabe ändert und übergibt den neuen Wert, damit v-model im Parent aktualisiert werden kann */
    "update:modelValue": [value: FormModelValue<T>];
    /**wird aufgerufen, wenn ein neues Element ausgewählt wurde */
    toggle: [id: number];
    /**wird aufgerufen, wenn der Button zum Bearbeiten gedrückt wird (nur select-with-edit)*/
    edit: [void];
    /**wird aufgerufen, wenn der Button zum Speichern gedrückt wird (nur select-with-edit) */
    save: [void];
  }>();

  /**
   *
   * @param value - Dient dazu, aus einer Zahl "23" eine Zahl 23 zu machen. Die Inputfelder geben standardmäßig einen String zurück.
   */

  function selectCorrectType(value: string | number | null | undefined) {
    let finalValue: FormModelValue<T> = value;

    if (props.type === "number" && typeof value === "string") {
      if (value === "") {
        finalValue = null;
      } else {
        const parsed = Number(value);
        finalValue = isNaN(parsed) ? value : parsed;
      }
    }

    emit("update:modelValue", finalValue);
  }
</script>
