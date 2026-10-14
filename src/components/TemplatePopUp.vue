<template>
  <b-modal no-animation centered title="Vorlagen verwalten" :size="'xl'" no-footer>
    <div class="d-flex flex-row justify-content-center gap-3">
      <div
        class="w-50 d-flex justify-content-center flex-column align-items-center flex-grow-1"
        :style="{ minHeight: '400px' }"
      >
        <b-button variant="primary" class="w-50" @click="handleAddNewTemplate">
          <plus :size="24" />
          Hinzufügen
        </b-button>
        <list-with-search
          :items="templateStore.templateList"
          :draggable="false"
          class="w-100"
          @select="id => handleSelect(id)"
          :selected-id="templateStore.selectedTemplateId"
        >
          <template #listElement="{ item }">
            {{ item.name }}
          </template>
        </list-with-search>
      </div>

      <div class="w-50 d-flex flex-column gap-5 flex-grow-1">
        <h4 class="text-center">
          {{ isNewTemplate ? "Neue Vorlage erstellen" : "Vorlage bearbeiten" }}
        </h4>
        <b-form class="d-flex flex-column gap-1 flex-grow-1" @submit.prevent="handleSave"
          ><div class="d-flex flex-column gap-3">
            <form-input
              v-for="attribute in attributes"
              :key="attribute.key"
              :disabled="false"
              :type="attribute.type"
              :placeholder="attribute.placeholder"
              :required="attribute.required"
              :options="attribute.options"
              :is-item-selected="val => isItemSelected(val, formData[attribute.key] as any)"
              @toggle="
                id => attribute.storeRead && toggleItem(id, attribute.key, attribute.storeRead)
              "
              v-model="(formData as any)[attribute.key]"
            >
              <template #listItem="{ item }">
                {{ attribute.format ? attribute.format(item) : item }}
              </template>
            </form-input>
          </div>

          <div class="d-flex w-100 justify-content-end gap-3 mt-auto">
            <b-button variant="danger" @click="showDelete = true" v-if="!isNewTemplate"
              >Löschen</b-button
            >
            <b-button variant="primary" type="submit">Speichern</b-button>
          </div>
        </b-form>
      </div>
      <delete-dialog v-model="showDelete" @confirm="deleteResource" />
    </div>
  </b-modal>
</template>

<script setup lang="ts">
  import { BModal, BForm, BButton } from "bootstrap-vue-next";
  import ListWithSearch from "./ListWithSearch.vue";
  import { useTemplateStore } from "@/stores/templateStore";
  import FormInput, { type FormInputType, type SelectOption } from "./FormInput.vue";
  import { useResourceForm } from "@/composables/useResourceForm";
  import type { StudyGroupTemplate } from "@/models/StudyGroupTemplate.ts";
  import { computed, ref, type ComputedRef } from "vue";
  import { useCourseStore } from "@/stores/courseStore.ts";
  import type { Course } from "@/models/Course.ts";
  import { Plus } from "lucide-vue-next";
  import DeleteDialog from "./DeleteDialog.vue";

  const templateStore = useTemplateStore();
  const courseStore = useCourseStore();

  const isNewTemplate = ref<boolean>(true);
  const showDelete = ref<boolean>(false);

  const emit = defineEmits<{
    onClose: [void];
  }>();

  const { formData, update, create, deleteResource, isItemSelected, toggleItem } =
    useResourceForm<StudyGroupTemplate>(
      () => templateStore.selectedTemplate,
      () => ["name", "courses"],
      (id, updates) => templateStore.updateTemplate(id, updates),
      item => templateStore.createTemplate(item),
      id => templateStore.selectTemplate(id),
      id => templateStore.deleteTemplate(id)
    );

  type Attribute = {
    key: keyof Omit<StudyGroupTemplate, "id">;
    placeholder: string;
    type: FormInputType;
    required: boolean;
    options?: ComputedRef<SelectOption[]> | ComputedRef<{ id: number }[]>;
    storeRead?: (id: number) => Course | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    format?: (item: any) => string;
    onEdit?: () => void;
  };

  const attributes: Attribute[] = [
    {
      key: "name",
      placeholder: "Name",
      type: "text",
      required: true,
    },
    {
      key: "courses",
      placeholder: "Veranstaltungen zuweisen",
      type: "search-select",
      required: false,
      options: computed(() => courseStore.courseList),
      storeRead: courseStore.readCourse,
      format: (c: Course) => `${c.number} - ${c.name} (${c.abbreviation})`,
    },
  ];

  function handleSelect(id: number) {
    templateStore.selectTemplate(id);
    isNewTemplate.value = false;
  }

  function handleAddNewTemplate() {
    isNewTemplate.value = true;
    templateStore.selectTemplate(null);
  }

  function handleSave() {
    if (isNewTemplate.value) {
      create();
    } else {
      update();
    }
    emit("onClose");
  }
</script>
