<template>
  <div class="component-container p-2 pt-3 gap-3">
    <b-modal
      v-model="confirmDialog"
      @ok="updateOrCreate"
      centered
      ok-title="Speichern"
      ok-variant="primary"
      cancel-variant="danger"
      cancel-title="Abbrechen"
    >
      <h5 v-show="!creatable">Sollen die Änderungen übernommen werden?</h5>
      <h5 v-show="creatable">{{ header }} hinzufügen?</h5>
    </b-modal>
    <b-modal
      v-model="cancelDialog"
      @ok="cancelEdit"
      centered
      ok-title="Verwerfen"
      ok-variant="danger"
      cancel-title="Abbrechen"
    >
      <h5>Sollen die Änderungen verworfen werden?</h5>
    </b-modal>
    <b-modal
      v-model="deleteDialog"
      @ok="deleteResource"
      centered
      ok-title="Löschen"
      ok-variant="danger"
      cancel-title="Abbrechen"
    >
      <h5>{{ header }} wirklich löschen?</h5>
    </b-modal>
    <h5 class="m-0 text-center" v-show="!creatable">{{ header }} anpassen</h5>
    <h5 class="m-0 text-center" v-show="creatable">{{ header }} hinzufügen</h5>
    <b-form @submit.prevent="confirmDialog = true" class="w-100 form">
      <div class="inputs">
        <b-form-group class="d-flex flex-column gap-2">
          <slot name="inputs"></slot>
        </b-form-group>
      </div>

      <div class="buttons w-100 mt-2" v-show="isOneResourceSelected">
        <div class="edit-buttons">
          <b-button @click="enterEditMode" v-if="!editable">Bearbeiten</b-button>
          <b-button @click="cancelDialog = true" v-if="editable && !creatable" variant="danger"
            >Abbrechen</b-button
          >
          <b-button v-show="editable" variant="primary" type="submit"> Speichern </b-button>
        </div>
        <div v-show="!creatable">
          <b-button
            variant="outline-danger"
            v-show="showDeleteButton ?? true"
            @click="deleteDialog = true"
            >Löschen</b-button
          >
        </div>
      </div>
    </b-form>
  </div>
</template>

<script setup lang="ts">
  import { BButton, BModal, BForm, BFormGroup } from "bootstrap-vue-next";
  import { ref, watch } from "vue";

  const {
    header,
    editMode,
    createMode,
    showDeleteButton = true,
  } = defineProps<{
    /**Titel der Detailübersicht */
    header: string;
    /**Gibt an, welche Buttons angezeigt werden sollen. Im Editiermodus oder nicht. */
    editMode: boolean;
    /**Aktiv, wenn eine neue Ressource erstellt werden soll.*/
    createMode: boolean;
    /**Dient dazu, dass wenn keine Resource ausgewählt ist, dass die Buttons versteckt werden und keine Änderungen erfolgen können. */
    isOneResourceSelected?: boolean;
    /**Gibt an, ob der Löschen-Button sichtbar sein soll. Standardmäßig auf true. */
    showDeleteButton?: boolean;
  }>();

  const emit = defineEmits<{
    /**Ausgelöst, wenn Änderungen beim Editieren übernommen werden sollen */
    save: [void];
    /**Ausgelöst, wenn Änderungen nicht übernommen werden sollen */
    cancel: [void];
    /**Ausgelöst, wenn Informationen editierbar sein sollen */
    editMode: [void];
    /**Ausgelöst, wenn eine neue Ressource angelegt werden soll */
    create: [void];
    /**Ausgelöst, wenn eine Resource gelöscht werden soll */
    delete: [void];
  }>();

  const editable = ref(editMode);
  const creatable = ref(createMode);

  watch(
    () => editMode,
    newVal => {
      editable.value = newVal;
    }
  );
  watch(
    () => createMode,
    newVal => {
      creatable.value = newVal;
    }
  );

  const confirmDialog = ref(false);
  const cancelDialog = ref(false);
  const deleteDialog = ref(false);

  function enterEditMode() {
    emit("editMode");
    editable.value = true;
  }

  function cancelEdit() {
    emit("cancel");
    editable.value = false;
  }

  function saveEdit() {
    emit("save");
    editable.value = false;
  }
  function create() {
    emit("create");
    editable.value = false;
    creatable.value = false;
  }

  function updateOrCreate() {
    if (!creatable.value) {
      saveEdit();
    } else {
      create();
    }
  }

  function deleteResource() {
    emit("delete");
    editable.value = false;
  }
</script>

<style scoped>
  .component-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    padding-bottom: 0 !important;
  }

  .form {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 0;
  }

  .inputs {
    flex-grow: 1;
    min-height: 0;
    overflow-y: auto;
    padding-left: 5px;
    padding-right: 10px;
    padding-top: 5px;
  }

  .buttons {
    align-items: center;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    justify-content: space-evenly;
    margin-top: auto;
    padding-bottom: 2rem;
    padding-top: 1rem;
  }

  .edit-buttons {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    margin-bottom: 10px;
    width: 100%;
  }
</style>
