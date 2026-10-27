<template>
  <div
    class="overflow-y-auto gap-1"
    :style="{ maxHeight: props.maxHeight ? props.maxHeight + 'px' : 'auto' }"
  >
    <div
      v-for="field in fields"
      :key="field[0]?.toString()"
      class="d-flex flex-column justify-content-between rounded-3 mb-1"
    >
      <p class="p-0 m-0 key">{{ field[0] }}:</p>
      <div class="p-0 m-0 value selectable" v-if="Array.isArray(field[1])">
        <p v-for="item in field[1]" :key="item.toString()" class="p-0 m-0">
          {{ item }}
        </p>
      </div>
      <p class="p-0 m-0 value selectable" v-if="!Array.isArray(field[1])">
        {{ field[1] ? field[1] : "----" }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { Course } from "@/models/Course";
  import type { DegreeProgram } from "@/models/DegreeProgram";
  import type { Lecturer } from "@/models/Lecturer";
  import type { Room } from "@/models/Room";
  import type { StudyGroup } from "@/models/StudyGroup";
  import { computed } from "vue";
  import {
    isCourse,
    isDegreeProgram,
    isLecturer,
    isRoom,
    isStudyGroup,
  } from "@/models/CheckFunctions";
  import { mapLecturerKindToString, SemesterSeason } from "@/enums/enums";

  const props = defineProps<{
    /** Resource, von der die Informationen angeziegt werden sollen. */
    resource: Course | StudyGroup | Room | Lecturer | DegreeProgram | undefined;
    /** Maximale Höhe, bevor die Liste scrollbar wird. */
    maxHeight?: number;
  }>();

  const fields = computed(() => {
    if (props.resource) {
      if (isCourse(props.resource)) {
        return [
          ["Nummer", props.resource.number],
          ["Name", props.resource.name],
          ["Abkürzung", props.resource.abbreviation],
          ["SWS", props.resource.sws],
          ["Credits", props.resource.creditPoints],
          ["Lehrpersonen", props.resource.lecturers.map(l => l.firstName + " " + l.lastName)],
          [
            "Semestergruppen",
            props.resource.studyGroups.map(
              s =>
                `${s.degreeProgram.abbreviation}${s.semesterYear % 100}_${s.semesterSeason.charAt(0).toUpperCase()}`
            ),
          ],
        ];
      }
      if (isLecturer(props.resource)) {
        return [
          ["Name", props.resource.firstName + " " + props.resource.lastName],
          ["Abkürzung", props.resource.abbreviation],
          ["zur Planung aktiv", mapBooleanToString(props.resource.isRelevant)],
          ["Typ", mapLecturerKindToString(props.resource.kind)],
          ["Notizen", props.resource.notes],
        ];
      }
      if (isStudyGroup(props.resource)) {
        return [
          ["Studiengang", props.resource.degreeProgram.abbreviation],
          ["Jahr", props.resource.semesterYear],
          [
            "Semester",
            props.resource.semesterSeason === SemesterSeason.SUMMER ? "Sommer" : "Winter",
          ],
          ["Studenten", props.resource.studentCount],
        ];
      }
      if (isDegreeProgram(props.resource)) {
        return [
          ["Name", props.resource.name],
          ["Abkürzung", props.resource.abbreviation],
        ];
      }
      if (isRoom(props.resource)) {
        return [
          ["Nummer", props.resource.number],
          ["Name", props.resource.name],
          ["Sitzplätze", props.resource.seats],
        ];
      }

      return [];
    } else {
      return [];
    }
  });

  function mapBooleanToString(bool: boolean) {
    return bool ? "Ja" : "Nein";
  }
</script>

<style scoped>
  .key {
    font-size: x-small;
  }

  .value {
    font-size: small;
  }
</style>
