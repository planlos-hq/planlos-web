<template>
  <b-modal :title="event.title" centered no-footer @hide="onHide(timeSlot)" size="md" no-animation>
    <b-list-group>
      <b-list-group-item class="d-flex align-items-center justify-content-center">
        <b-button variant="outline-danger" @click="removeEvent">aus Kalender entfernen</b-button>
      </b-list-group-item>
      <b-list-group-item>
        <h5 class="d-flex flex-row justify-content-between align-items-center">
          Veranstaltung einfärben
          <reset-button :size="16" @click="resetColor" />
        </h5>

        <b-list-group horizontal class="d-flex flex-row flex-wrap justify-content-center gap-2">
          <b-list-group-item
            class="d-flex flex-row align-items-stretch rounded color-option gap-0 p-0 m-0 position-relative"
            v-for="color in colorStore.colorList"
            :key="color.id"
          >
            <color-box
              :hex="color.hex"
              :button="false"
              :text="color.name"
              class="w-100 border-0 p-0 m-0 color-box"
              @click="chooseColor(color)"
            />
            <div v-if="color.hex === activeColor" class="position-absolute selected b-2 d-flex">
              <calendar-check :size="17" />
            </div>
            <div
              @click="editColor(color)"
              class="px-1 edit-box h-100 d-flex align-items-center justify-content-center"
            >
              <pencil :size="16" />
            </div>
          </b-list-group-item>
        </b-list-group>
        <b-list-group-item
          button
          class="rounded mt-2 d-flex flex-row justify-content-center"
          @click="showAddColorDialog = true"
        >
          <plus />
        </b-list-group-item>
      </b-list-group-item>
      <b-list-group-item class="d-flex flex-row justify-content-between">
        <p class="m-0">Veranstaltungsname:</p>
        <p class="m-0">{{ event.title }}</p>
      </b-list-group-item>
      <b-list-group-item class="d-flex flex-row justify-content-between">
        <p class="m-0">Kürzel:</p>
        <p class="m-0">{{ course?.abbreviation || "---" }}</p>
      </b-list-group-item>

      <b-list-group-item>
        <dropdown-with-search
          button-text="Räume zuweisen"
          :disabled="false"
          :items="roomStore.roomList"
          :is-item-selected="item => timeSlotResourceForm.isItemSelected(item, timeSlot?.rooms)"
          @toggle="async id => await toggleRoom(id)"
        >
          <template #listElement="{ item }">{{ item.number }} {{ item.name }}</template>
        </dropdown-with-search>
        <p
          v-for="room in timeSlot?.rooms"
          :key="room.id"
          class="m-0 d-flex flex-row justify-content-between align-items-center"
        >
          - {{ room.number }} {{ room.name }}
          <delete-button :size="24" @click="toggleRoom(room.id)" class="p-1" />
        </p>
        <p class="m-0" v-show="timeSlot?.rooms.length === 0">-----</p>
      </b-list-group-item>

      <b-list-group-item>
        <dropdown-with-search
          button-text="Lehrpersonen zuweisen"
          :disabled="false"
          :items="lecturerStore.relevantLecturers"
          :is-item-selected="item => courseResourceForm.isItemSelected(item, course?.lecturers)"
          @toggle="async id => await toggleLecturer(id)"
        >
          <template #listElement="{ item }">{{ item.firstName }} {{ item.lastName }}</template>
        </dropdown-with-search>
        <p
          v-for="lecturer in course?.lecturers"
          :key="lecturer.id"
          class="m-0 d-flex flex-row justify-content-between align-items-center"
        >
          - {{ lecturer.firstName }} {{ lecturer.lastName }}
          <delete-button :size="24" @click="toggleLecturer(lecturer.id)" class="p-1" />
        </p>
        <p class="m-0" v-show="course?.lecturers.length === 0">-----</p>
      </b-list-group-item>
      <b-list-group-item class="d-flex flex-row justify-content-between">
        <p class="m-0">Credits:</p>
        <p class="m-0">{{ course?.creditPoints || "---" }}</p>
      </b-list-group-item>
      <b-list-group-item class="d-flex flex-row justify-content-between">
        <p class="m-0">SWS:</p>
        <p class="m-0">{{ course?.sws || "---" }}</p>
      </b-list-group-item>
      <b-list-group-item class="d-flex flex-row justify-content-evenly gap-3 align-items-center">
        <p class="m-0 me-3 align-self-start">Zeit:</p>
        <p class="m-0">von:</p>
        <b-input type="time" v-model="startTime" />
        <p class="m-0">bis:</p>
        <b-input type="time" v-model="endTime" />
      </b-list-group-item>
    </b-list-group>
    <add-color-dialog v-model="showAddColorDialog" />
    <edit-color-dialog
      v-model="showEditDialog"
      v-if="selectedColor"
      :old-color="selectedColor"
      @deleted="showEditDialog = false"
    />
  </b-modal>
</template>

<script setup lang="ts">
  import { BModal, BListGroup, BListGroupItem, BButton, BInput } from "bootstrap-vue-next";
  import { useColorStore } from "@/stores/colorStore";
  import type { Color } from "@/models/Color";
  import type { VueCalEvent } from "@/models/VueCalEvent";
  import { computed, ref, watch } from "vue";
  import { useCourseStore } from "@/stores/courseStore";
  import type { TimeSlot } from "@/models/TimeSlot";
  import { useTimeSlotStore } from "@/stores/timeSlotStore";
  import DropdownWithSearch from "./DropdownWithSearch.vue";
  import { useRoomStore } from "@/stores/roomStore";
  import { useResourceForm } from "@/composables/useResourceForm";
  import { Pencil, Plus, CalendarCheck } from "lucide-vue-next";
  import AddColorDialog from "./AddColorDialog.vue";
  import EditColorDialog from "./EditColorDialog.vue";
  import { useLecturerStore } from "@/stores/lecturerStore";
  import ColorBox from "./ColorBox.vue";
  import ResetButton from "./IconButtons/ResetButton.vue";
  import {
    assignLecturerToCourseApi,
    removeColorFromCourseApi,
    removeLecturerFromCourseApi,
  } from "@/api/course";
  import { useNotification } from "@/composables/useNotification";
  import DeleteButton from "./IconButtons/DeleteButton.vue";
  import { assignRoomToTimeSlotApi, removeRoomFromTimeSlotApi } from "@/api/timeslot";
  import { timetableConfig } from "@/timetableConfig.ts";

  const colorStore = useColorStore();
  const courseStore = useCourseStore();
  const timeSlotStore = useTimeSlotStore();
  const roomStore = useRoomStore();
  const lecturerStore = useLecturerStore();

  const showAddColorDialog = ref(false);
  const showEditDialog = ref(false);

  //welche Farbe editiert oder gelöscht werden soll
  const selectedColor = ref<Color | undefined | null>(null);

  const props = defineProps<{
    /** VueCal-Event zu dem Details gewünscht sind*/
    event: VueCalEvent;
  }>();

  const course = computed(() => courseStore.courseMap.get(props.event.courseId));
  const timeSlot = computed(() => timeSlotStore.timeSlotMap.get(props.event.timeSlotId));
  const startTime = ref(formatTime(props.event.start));
  const endTime = ref(formatTime(props.event.end));
  const activeColor = computed(() => course.value?.color?.hex);

  watch(
    () => timeSlot.value?.start,
    newStart => {
      if (newStart) startTime.value = formatTime(newStart);
    },
    { deep: true, immediate: true }
  );

  watch(
    () => timeSlot.value?.end,
    newEnd => {
      if (newEnd) endTime.value = formatTime(newEnd);
    },
    { deep: true, immediate: true }
  );

  const timeSlotResourceForm = useResourceForm(
    () => {
      if (!course.value) return undefined;
      return timeSlotStore.readTimeSlot(props.event.timeSlotId);
    },
    () => ["start", "rooms", "end"],
    () => {
      /* Die 4 Funktionen werden nicht benötigt, da keine Veränderung der Daten geschieht. Es dient lediglich dem Datenzugriff und ob auf ein Item zugewiesen wurde oder nicht.*/
    },
    () => {
      /* empty */
    },
    () => {
      /* empty */
    },
    () => {
      /* empty */
    }
  );

  const courseResourceForm = useResourceForm(
    () => course.value,
    () => ["lecturers"],
    () => {
      /* Die 4 Funktionen werden nicht benötigt, da keine Veränderung der Daten geschieht. Es dient lediglich dem Datenzugriff und ob auf ein Item zugewiesen wurde oder nicht.*/
    },
    () => {
      /* empty */
    },
    () => {
      /* empty */
    },
    () => {
      /* empty */
    }
  );

  const emit = defineEmits<{
    /**beim Ändern der Farbe */
    color: [Color];
    /**wenn Event aus Kalender entfernt werden soll */
    removeEvent: [void];
  }>();

  /**
   * Wählt eine Farbe aus und sendet sie an den Parent.
   * @param color - Die ausgewählte Farbe
   */
  function chooseColor(color: Color) {
    emit("color", color);
  }

  /**
   * Sendet an Parent, dass das aktuelle Event aus dem Kalender entfernt werden soll.
   */
  function removeEvent() {
    emit("removeEvent");
  }

  /**
   * Formatiert ein Datum zu Stunden und Minuten im deutschen Format.
   * @param date - Das zu formatierende Datum
   * @returns formatiertes Zeit-String, z.B. "14:30"
   */
  function formatTime(date: Date) {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Wird zum Öffnen des Bearbeitenfensters aufgerufen.
   * @param color - alte Farbe, die bearbeitet werden soll
   */
  function editColor(color: Color) {
    selectedColor.value = color;
    showEditDialog.value = true;
  }

  /**
   * Wird aufgerufen, wenn ein Raum zum TimeSlot hinzugefügt wird. Aktualisiert die Zuweisung in der DB.
   * @param roomId - Id des geklickten Raums
   */
  async function toggleRoom(roomId: number) {
    timeSlotResourceForm.toggleItem(roomId, "rooms", roomStore.readRoom);
    const room = roomStore.roomMap.get(roomId);
    if (!room || !timeSlot.value) {
      return;
    }
    if (!timeSlotResourceForm.isItemSelected(room, timeSlotResourceForm.formData.value.rooms)) {
      await removeRoomFromTimeSlotApi(timeSlot.value.id, roomId);
    } else {
      await assignRoomToTimeSlotApi(timeSlot.value.id, roomId);
    }
  }

  /**
   * Wird aufgerufen, wenn ein Dozent in der Mehrfachauswahl angeklickt wird. Aktualisiert die Zuweisung in der DB.
   * @param lecturerId - Id des Dozenten
   */
  async function toggleLecturer(lecturerId: number) {
    courseResourceForm.toggleItem(lecturerId, "lecturers", lecturerStore.readLecturer);
    const lecturer = lecturerStore.lecturerMap.get(lecturerId);
    if (!course.value || !lecturer) {
      return;
    }
    if (!courseResourceForm.isItemSelected(lecturer, courseResourceForm.formData.value.lecturers)) {
      await removeLecturerFromCourseApi(course.value.id, lecturerId);
    } else {
      await assignLecturerToCourseApi(course.value.id, lecturerId);
    }
  }

  /**
   * Formatiert eine Zeit zu einem festen Tag, der im Event gesetzt ist. Geht nur um die Uhrzeit.
   * @param time - Zeit im Format '13:40'
   */
  function formatStringTimeToDate(time: string) {
    //Fals ein Fehler in der Zeit ist, ist es ein leerer String
    if (!time) {
      startTime.value = formatTime(props.event.start);
      endTime.value = formatTime(props.event.end);
      return;
    }
    const newDate = new Date(props.event.start);
    const [hours, minutes] = time.split(":");
    newDate.setHours(Number(hours));
    newDate.setMinutes(Number(minutes));
    return newDate;
  }
  /**
   *Wird beim Schließen des PopUps aufgerufen. Speichert neue Raum- und Dozentenzuweisung.
   * @param timeSlot - aktueller Timeslot im Kalender
   */
  function onHide(timeSlot: TimeSlot | undefined) {
    if (!timeSlot) return;
    if (!course.value) return;

    const newEndIsMidnight = endTime.value.includes("00:00");

    //String '13:40' aus Inputfeldern zu einem Date-Objekt formatieren
    let newStartDate = formatStringTimeToDate(startTime.value);
    let newEndDate = formatStringTimeToDate(endTime.value);

    if (!newEndDate) return;
    if (!newStartDate) return;

    const startTimeInMinutes = newStartDate.getHours() * 60 + newStartDate.getMinutes();
    if (timetableConfig.timeFrom > startTimeInMinutes) {
      newStartDate = props.event.start;
      startTime.value = formatTime(newStartDate);
    }

    //Tauscht start und ende, falls die Endzeit vor der Startzeit liegt / wenn es von z.B. 21:00 bis 00:00 Uhr geht soll nicht getauscht werden
    if (newEndDate < newStartDate && !newEndIsMidnight) {
      const h = newStartDate;
      newStartDate = newEndDate;
      newEndDate = h;
    }

    //VueCal braucht die 00:00 am nächsten Tag
    if (newEndIsMidnight) {
      newEndDate.setDate(newEndDate.getDate() + 1);
    }

    //Update soll nur ausgeführt werden, falls die Daten unterschiedlich sind.
    if (
      newStartDate.getTime() === props.event.start.getTime() &&
      newEndDate.getTime() === props.event.end.getTime()
    ) {
      return;
    }

    timeSlotStore.updateTimeSlot(timeSlot.id, { start: newStartDate, end: newEndDate });
  }

  async function resetColor() {
    if (!course.value) {
      return;
    }
    if (!course.value.color) {
      return;
    }
    const { handleError, showSuccess } = useNotification();
    try {
      await removeColorFromCourseApi(course.value.id, course.value.color.id);
      showSuccess("Farbe erfolgreich zurückgesetzt.");
    } catch (e) {
      handleError(e as Error, "Fehler beim Zurücksetzen der Farbe");
    }
  }
</script>

<style scoped>
  .color-box {
    border-radius: 5px !important;
    display: block;
    min-width: 0;
  }

  /* 3 Farben pro Zeile, abzüglich der zwei gap-2 Abstände (je 0.5rem) */
  .color-option {
    flex: 0 0 calc((100% - 2 * 0.5rem) / 3);
    min-width: 70px;
    transition: transform 0.2s ease-in-out;
  }

  .color-option:hover {
    transform: scale(1.02);
  }

  .color-option:active {
    transform: scale(0.95);
  }

  .edit-box {
    flex-shrink: 0;
    transition: background-color 0.2s ease-in-out;
  }

  .edit-box:hover {
    background-color: rgb(128 128 128 / 18.2%);
    border-radius: 5px;
    cursor: pointer;
  }

  .selected {
    background-color: rgb(255 255 255);
    border: solid 1px;
    border-radius: 5px;
    color: black;
    padding: 0 1px 1px;
    transform: translate(-20%, -30%);
  }
</style>
