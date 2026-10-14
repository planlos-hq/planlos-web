<template>
  <b-modal
    title="Neue Farbe hinzufügen"
    centered
    @ok="validate"
    ok-title="Hinzufügen"
    ok-variant="primary"
    cancel-title="Abbrechen"
    lazy
    no-animation
  >
    <div class="d-flex flex-column gap-4">
      <color-palette @select-color="c => (colorChooser = c)" />
      <b-form @submit.stop.prevent>
        <div class="d-flex gap-3">
          <div class="d-flex flex-column flex-grow-1">
            <b-form-input type="color" class="flex-grow-1" v-model="colorChooser" />
          </div>
          <div class="d-flex flex-column flex-grow-1">
            <b-form-floating-label label="Bedeutung" label-for="meaning" class="flex-grow-1">
              <b-form-input
                id="meaning"
                type="text"
                placeholder="Bedeutung"
                v-model="meaning"
                :state="meaningValidation"
                required
              />
            </b-form-floating-label>
          </div>
        </div>
        <!--Eine Bedeutung ist gültig, sobald ein Zeichen drin ist-->
        <b-form-invalid-feedback :state="meaningValidation" class="text-center">
          Bitte geben Sie eine gültige Bedeutung ein!
        </b-form-invalid-feedback>
      </b-form>
    </div>
  </b-modal>
</template>

<script setup lang="ts">
  import {
    BModal,
    BFormInput,
    BFormFloatingLabel,
    BForm,
    BFormInvalidFeedback,
  } from "bootstrap-vue-next";
  import { computed, ref } from "vue";
  import { useColorStore } from "@/stores/colorStore";
  import ColorPalette from "./ColorPalette.vue";

  const colorChooser = ref<string>("#000000");
  const meaning = ref<string>("");
  const colorStore = useColorStore();

  /**
   * Gibt true zurück, wenn das Feld nicht leer ist.
   */
  const meaningValidation = computed(() => {
    return meaning.value.trim().length > 0;
  });

  /**
   * Validiert die Eingabe, bevor das Modal geschlossen wird.
   * Verhindert das Schließen, wenn die Eingabe ungültig ist.
   *
   * @param event - Das Event, das beim Schließen des Modals ausgelöst wird.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function validate(event: any) {
    if (!meaningValidation.value) {
      event.preventDefault();
      return;
    }
    addColor();
  }

  /**
   * Fügt eine neue Farbe im Color Store hinzu.
   * Setzt anschließend die Eingabefelder zurück.
   */
  function addColor() {
    colorStore.createColor(meaning.value.trim(), colorChooser.value);
    meaning.value = "";
    colorChooser.value = "#000000";
  }
</script>

<style>
  .color-tile {
    cursor: pointer;
    height: 40px;
    width: 40px;
  }
</style>
