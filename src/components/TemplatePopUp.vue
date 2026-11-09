<template>
  <b-modal
    v-model="show"
    title="Vorlagen verwalten"
    size="xl"
    no-footer
    no-animation
    centered
    lazy
    unmount-lazy
    @hide="handleModalHide"
    @hidden="handleModalHidden"
  >
    <div class="template-overlay">
      <div class="overlay-column overlay-left">
        <template-list-panel
          :templates="templateStore.templateList"
          :active-template-id="activeTemplateId"
          :add-active="isCreateMode"
          :disabled="overlay.isBusy.value"
          @add="overlay.requestCreate"
          @select="overlay.onTemplateClick"
          @delete="overlay.requestDelete"
        />
      </div>

      <div class="overlay-column overlay-right">
        <template-form-panel
          v-if="isCreateMode || isEditMode"
          ref="formPanel"
          :mode="formMode"
          :name="draftName"
          :course-ids="draftCourseIds"
          :can-save="overlay.canSave.value"
          :save-hint="overlay.saveBlockReason.value"
          :is-saving="overlay.isSaving.value"
          :disabled="overlay.isBusy.value"
          @update:name="overlay.setName"
          @toggle-course="overlay.toggleCourse"
          @reset-selection="overlay.resetCourseSelection"
          @save="overlay.save"
        />

        <div
          v-else
          class="d-flex flex-column flex-fill align-items-center justify-content-center gap-3"
        >
          <h4 class="m-0">Eine Vorlage hinzufügen?</h4>
          <b-button
            variant="primary"
            :disabled="overlay.isBusy.value"
            @click="overlay.requestCreate()"
          >
            <plus :size="20" />
            Hinzufügen
          </b-button>
        </div>
      </div>
    </div>

    <b-modal
      v-model="isConfirmOpen"
      :title="confirmRequest?.title ?? ''"
      centered
      no-animation
      no-close-on-backdrop
      lazy
      unmount-lazy
      :ok-title="confirmRequest?.okLabel"
      ok-variant="danger"
      :cancel-title="confirmRequest?.cancelLabel"
      @ok="overlay.confirmPendingTransition"
      @cancel="overlay.dismissPendingTransition"
    >
      <p v-for="line in confirmRequest?.lines ?? []" :key="line" class="mb-1">{{ line }}</p>
    </b-modal>

    <delete-dialog v-model="isDeleteOpen" @confirm="overlay.confirmDelete">
      <p v-for="line in overlay.deleteLines.value" :key="line" class="mb-1">{{ line }}</p>
    </delete-dialog>
  </b-modal>
</template>

<script setup lang="ts">
  import { computed, nextTick, watch, useTemplateRef } from "vue";
  import { BButton, BModal, type BvTriggerableEvent } from "bootstrap-vue-next";
  import { Plus } from "lucide-vue-next";
  import TemplateListPanel from "./TemplateListPanel.vue";
  import TemplateFormPanel from "./TemplateFormPanel.vue";
  import DeleteDialog from "./DeleteDialog.vue";
  import { useTemplateStore } from "@/stores/templateStore";
  import { useCourseStore } from "@/stores/courseStore";
  import {
    useTemplateOverlay,
    type TemplateDraft,
    type TemplateId,
  } from "@/composables/useTemplateOverlay";
  import type { Course } from "@/models/Course";

  const show = defineModel<boolean>({ default: false });

  const emit = defineEmits<{
    onClose: [void];
  }>();

  const templateStore = useTemplateStore();
  const courseStore = useCourseStore();
  const formPanel = useTemplateRef<{ focusName: () => void }>("formPanel");

  /**
   * Wandelt IDs in Veranstaltungen aus dem Store um. Gelöschte Veranstaltungen fallen weg.
   *
   * @param courseIds - IDs der ausgewählten Veranstaltungen
   * @returns die zugehörigen Veranstaltungen
   */
  function coursesForIds(courseIds: TemplateId[]): Course[] {
    return courseIds
      .map(id => courseStore.courseMap.get(id))
      .filter(course => course !== undefined);
  }

  const overlay = useTemplateOverlay({
    templates: () => templateStore.templateList,
    createTemplate: async (draft: TemplateDraft) => {
      const created = await templateStore.createTemplate({
        name: draft.name,
        courses: coursesForIds(draft.courseIds),
      });
      return created?.id;
    },
    updateTemplate: async (id: TemplateId, draft: TemplateDraft) =>
      templateStore.updateTemplate(id, {
        name: draft.name,
        courses: coursesForIds(draft.courseIds),
      }),
    deleteTemplate: templateStore.deleteTemplate,
    selectTemplate: templateStore.selectTemplate,
    closeOverlay: () => {
      show.value = false;
    },
  });

  const isCreateMode = computed<boolean>(() => overlay.panel.value.mode === "create");
  const isEditMode = computed<boolean>(() => overlay.panel.value.mode === "edit");
  const formMode = computed<"create" | "edit">(() => (isCreateMode.value ? "create" : "edit"));

  const activeTemplateId = computed<TemplateId | null>(() =>
    overlay.panel.value.mode === "edit" ? overlay.panel.value.templateId : null
  );

  const draftName = computed<string>(() => overlay.draft.value?.name ?? "");
  const draftCourseIds = computed<TemplateId[]>(() => overlay.draft.value?.courseIds ?? []);

  const confirmRequest = overlay.confirmRequest;
  const isConfirmOpen = computed<boolean>({
    get: () => confirmRequest.value !== null,
    set: value => {
      if (!value) overlay.dismissPendingTransition();
    },
  });

  const isDeleteOpen = computed<boolean>({
    get: () => overlay.deleteTargetId.value !== null,
    set: value => {
      if (!value) overlay.cancelDelete();
    },
  });

  const isNestedDialogOpen = computed<boolean>(() => isConfirmOpen.value || isDeleteOpen.value);

  const gestureTriggers: ReadonlySet<string> = new Set(["close", "esc", "backdrop"]);

  watch(
    () => show.value,
    isOpen => {
      if (isOpen) overlay.reset();
    }
  );

  // Fokus ins Namensfeld setzen, sobald das Erstellformular öffnet.
  watch(
    () => overlay.focusNameToken.value,
    async () => {
      await nextTick();
      formPanel.value?.focusName();
    }
  );

  /**
   * Verhindert das Schließen, wenn ein Dialog offen ist, gerade gespeichert oder gelöscht wird.
   * Bei ungespeicherten Änderungen wird vorher nachgefragt.
   *
   * @param event - auslösendes Ereignis des Modals
   */
  function handleModalHide(event: BvTriggerableEvent): void {
    if (isNestedDialogOpen.value && gestureTriggers.has(event.trigger ?? "")) {
      event.preventDefault();
      return;
    }

    if (overlay.isBusy.value) {
      event.preventDefault();
      return;
    }

    if (overlay.isDirty.value) {
      event.preventDefault();
      overlay.requestClose();
    }
  }

  /**
   * Setzt das Overlay zurück und meldet das Schließen nach außen.
   */
  function handleModalHidden(): void {
    overlay.reset();
    emit("onClose");
  }
</script>

<style scoped lang="css">
  .template-overlay {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: min(620px, 70vh);
  }

  .overlay-column {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }

  .overlay-left {
    border-right: 1px solid var(--border-color);
    padding-right: 1rem;
  }

  .overlay-right {
    flex: 1;
  }

  @media (width >= 992px) {
    .template-overlay {
      flex-direction: row;
    }

    .overlay-left {
      width: 30%;
    }
  }

  @media (width < 992px) {
    .template-overlay {
      height: auto;
    }

    .overlay-left {
      border-right: 0;
      max-height: 320px;
      padding-right: 0;
    }
  }
</style>
