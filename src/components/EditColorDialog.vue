<template>
  <b-modal
    title="Farbe anpassen"
    centered
    @ok="validate"
    ok-title="Bestätigen"
    cancel-title="Abbrechen"
    lazy
    unmount-lazy
    no-animation
  >
    <b-form @submit.stop.prevent>
      <b-list-group>
        <b-list-group-item class="d-flex justify-content-between align-items-center">
          <p class="m-0 p-0">Aktueller Eintrag:</p>
          <delete-button :size="24" class="p-1" @click="deleteColor" />
        </b-list-group-item>
        <b-list-group-item class="d-flex gap-3">
          <div class="d-flex flex-column flex-grow-1">
            <b-form-input type="color" class="flex-grow-1" v-model="colorChooser" disabled />
          </div>

          <div class="d-flex flex-column flex-grow-1">
            <b-form-floating-label label="Bedeutung" label-for="meaning" class="flex-grow-1">
              <b-form-input
                id="meaning"
                type="text"
                placeholder="Bedeutung"
                v-model="meaning"
                disabled
              />
            </b-form-floating-label>
          </div>
        </b-list-group-item>
        <b-list-group-item>Geänderter Eintrag:</b-list-group-item>
        <b-list-group-item class="d-flex gap-3 flex-column p-0 pt-3">
          <color-palette @select-color="c => (newColorChooser = c)" />
          <div class="d-flex flex-row pb-2 px-3">
            <div class="d-flex flex-column flex-grow-1">
              <b-form-input type="color" class="flex-grow-1" v-model="newColorChooser" />
            </div>

            <div class="d-flex flex-column flex-grow-1">
              <b-form-floating-label label="Bedeutung" label-for="meaning" class="flex-grow-1">
                <b-form-input
                  id="meaning"
                  type="text"
                  placeholder="Bedeutung"
                  v-model="newMeaning"
                  :state="meaningValidation"
                  required
                />
              </b-form-floating-label>
            </div>
          </div>
        </b-list-group-item>
        <b-form-invalid-feedback :state="meaningValidation" class="text-center">
          Bitte geben Sie eine gültige Bedeutung ein!
        </b-form-invalid-feedback>
      </b-list-group>
    </b-form>
    <delete-dialog v-model="showDeleteDialog" @confirm="confirmDelete">
      <color-box :hex="oldColor.hex" :button="false" />
      <p>{{ oldColor.name }}</p>
    </delete-dialog>
  </b-modal>
</template>

<script setup lang="ts">
  import {
    BModal,
    BFormInput,
    BFormFloatingLabel,
    BForm,
    BFormInvalidFeedback,
    BListGroup,
    BListGroupItem,
  } from "bootstrap-vue-next";
  import { computed, ref, watch } from "vue";
  import { useColorStore } from "@/stores/colorStore";
  import type { Color } from "@/models/Color";
  import ColorPalette from "./ColorPalette.vue";
  import DeleteButton from "./IconButtons/DeleteButton.vue";
  import DeleteDialog from "./DeleteDialog.vue";
  import ColorBox from "./ColorBox.vue";

  const props = defineProps<{
    /**aktuelle Farbe, die verändert werden kann */
    oldColor: Color;
  }>();

  const emit = defineEmits<{
    /**Farbe wurde gelöscht */
    deleted: [void];
  }>();

  const oldColor = ref<Color>(props.oldColor);
  const colorChooser = ref<string>(oldColor.value.hex);
  const meaning = ref<string>(oldColor.value.name);
  const newColorChooser = ref<string>(colorChooser.value);
  const newMeaning = ref<string>(meaning.value);
  const colorStore = useColorStore();
  const showDeleteDialog = ref(false);

  watch(
    () => props.oldColor,
    newVal => {
      oldColor.value = newVal;
      colorChooser.value = newVal.hex;
      meaning.value = newVal.name;
      newColorChooser.value = newVal.hex;
      newMeaning.value = newVal.name;
    },
    { deep: true }
  );

  /**Eingabe ist nur gültig, wenn mindestens ein Zeichen eingegeben wurde */
  const meaningValidation = computed(() => {
    return newMeaning.value.trim().length > 0;
  });

  /**
   * Validiert die Eingabe, bevor Änderungen übernommen werden.
   * Verhindert die Ausführung, wenn das Eingabefeld leer ist.
   *
   * @param event - Event, das beim Schließen des Modals ausgelöst wird
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function validate(event: any) {
    if (!meaningValidation.value) {
      event.preventDefault();
      return;
    }
    editColor();
  }

  /**
   * Übernimmt Änderungen an der Farbe im Color Store.
   * Nur geänderte Felder werden aktualisiert.
   */
  function editColor() {
    const updates: Partial<Omit<Color, "id">> = {};

    if (meaning.value !== newMeaning.value) {
      updates.name = newMeaning.value;
      meaning.value = newMeaning.value;
    }
    if (colorChooser.value !== newColorChooser.value) {
      updates.hex = newColorChooser.value;
      colorChooser.value = newColorChooser.value;
    }
    if (Object.keys(updates).length > 0) {
      colorStore.updateColor(oldColor.value.id, updates);
    }
  }

  /**
   * Wird zum Öffnen des Bestätigungsfensters aufgerufen
   * @param color -Farbe, die gelöscht werden soll
   */
  function deleteColor() {
    showDeleteDialog.value = true;
  }

  /**
   * Löscht den Eintrag und informiert Parent, dass eine Farbe gelöscht wurde
   */
  function confirmDelete() {
    colorStore.deleteColor(oldColor.value.id);
    emit("deleted");
  }
</script>
