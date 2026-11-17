<template>
  <div class="template-list-panel d-flex flex-column gap-3 h-100">
    <b-input-group size="md" class="search-group">
      <b-form-input
        v-model="searchText"
        type="search"
        :placeholder="t('common.searchPlaceholder')"
        :aria-label="t('templatePopUp.list.searchLabel')"
      />

      <template #append>
        <add-button
          class="add-button"
          :size="18"
          :title="t('templatePopUp.list.add')"
          :aria-label="t('templatePopUp.list.add')"
          :aria-pressed="addActive"
          :disabled="disabled"
          @click="emit('add')"
        />
      </template>
    </b-input-group>

    <div class="list-wrapper flex-fill overflow-y-auto">
      <p v-if="templates.length === 0" class="my-3 text-center text-body-secondary">
        {{ t("templatePopUp.list.empty") }}
      </p>
      <p v-else-if="visibleTemplates.length === 0" class="my-3 text-center text-body-secondary">
        {{ t("templatePopUp.list.noMatch") }}
      </p>
      <ul v-else class="list-unstyled m-0 d-flex flex-column gap-1">
        <li
          v-for="template in visibleTemplates"
          :key="template.id"
          class="template-row d-flex align-items-center rounded pe-2"
          :class="{ selected: template.id === activeTemplateId }"
        >
          <button
            type="button"
            class="template-name"
            :title="template.name"
            :aria-pressed="template.id === activeTemplateId"
            :disabled="disabled"
            @click="emit('select', template.id)"
          >
            {{ template.name }}
          </button>
          <delete-button
            class="delete-action"
            :class="{ 'delete-action-disabled': disabled }"
            :size="18"
            role="button"
            :tabindex="disabled ? -1 : 0"
            :title="t('templatePopUp.list.delete', { name: template.name })"
            :aria-label="t('templatePopUp.list.delete', { name: template.name })"
            :aria-disabled="disabled"
            @click="onDelete(template.id)"
            @keydown.enter.prevent="onDelete(template.id)"
            @keydown.space.prevent="onDelete(template.id)"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from "vue";
  import { BFormInput, BInputGroup } from "bootstrap-vue-next";
  import { filterTemplates, type TemplateId } from "@/composables/useTemplateOverlay";
  import type { StudyGroupTemplate } from "@/models/StudyGroupTemplate";
  import AddButton from "../IconButtons/AddButton.vue";
  import DeleteButton from "../IconButtons/DeleteButton.vue";
  import { useI18n } from "vue-i18n";

  const { t } = useI18n();

  const props = defineProps<{
    templates: StudyGroupTemplate[];
    activeTemplateId: TemplateId | null;
    addActive: boolean;
    disabled: boolean;
  }>();

  const emit = defineEmits<{
    /** Der +-Button wurde gedrückt */
    add: [void];
    /** Eine Vorlage wurde angeklickt */
    select: [id: TemplateId];
    /** Das Mülleimer-Icon einer Vorlage wurde angeklickt */
    delete: [id: TemplateId];
  }>();

  const searchText = ref<string>("");

  function onDelete(id: TemplateId): void {
    if (props.disabled) return;
    emit("delete", id);
  }

  const visibleTemplates = computed(() => filterTemplates(props.templates, searchText.value));
</script>

<style scoped lang="css">
  .template-list-panel {
    min-height: 0;
  }

  .template-row {
    border: 1px solid var(--border-color);
  }

  .template-row .delete-action {
    height: 30px;
    width: 30px;
  }

  .delete-action-disabled {
    pointer-events: none;
  }

  .template-row.selected {
    background-color: var(--seleted-item-color);
    border-left: solid 4px black;
  }

  .template-name {
    background-color: transparent;
    border: 0;
    color: inherit;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    padding: 0.5rem 0.75rem;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .template-name:hover:not(:disabled) {
    background-color: var(--hover-color);
  }

  .template-row.selected .template-name {
    font-weight: 500;
  }
</style>
