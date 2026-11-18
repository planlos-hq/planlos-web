<template>
  <div class="form-floating">
    <button
      id="time-constraints"
      type="button"
      class="form-control text-start d-flex align-items-center justify-content-between gap-2"
      :title="summary.map(s => s.label).join('\n')"
      @click="show = true"
    >
      <span v-if="loading">…</span>
      <span v-else-if="summary.length === 0" class="text-body-secondary">
        {{ t("timeConstraints.none") }}
      </span>
      <span v-else class="summary">
        <span v-for="s in summary" :key="s.key" class="summary-item">
          <span class="dot" :style="{ backgroundColor: kindOf(s.soft).hex }"></span>
          {{ s.label }}
        </span>
      </span>
      <calendar-x :size="18" class="text-body-secondary flex-shrink-0" />
    </button>
    <label for="time-constraints">{{ t("timeConstraints.title") }}</label>

    <b-modal v-model="show" :title="t('timeConstraints.title')" size="lg" no-footer lazy>
      <div class="d-flex gap-3">
        <!-- wie die Veranstaltungsliste in der Seitenleiste: Karten in den Kalender ziehen -->
        <div class="palette d-flex flex-column gap-1">
          <b-list-group class="d-flex flex-column gap-1">
            <b-list-group-item
              v-for="kind in kinds"
              :key="kind.key"
              class="palette-item rounded-3"
              :style="{ borderLeftColor: kind.hex }"
              draggable="true"
              :title="t('timeConstraints.dragHint')"
              @dragstart="onPaletteDragStart($event, kind.soft)"
            >
              <p class="m-0">{{ t(`timeConstraints.${kind.key}`) }}</p>
              <p class="m-0 small text-body-secondary">
                {{ t(`timeConstraints.${kind.key}Hint`) }}
              </p>
            </b-list-group-item>
          </b-list-group>
        </div>

        <div class="mini-calendar flex-grow-1" :class="{ 'opacity-50 pe-none': loading }">
          <vue-cal
            :key="vueCalLocale"
            v-bind="calendarConfig"
            :locale="vueCalLocale"
            :twelve-hour="twelveHour"
            :events="calendarEvents"
            :hide-weekdays="viewStore.hiddenWeekdays"
            :special-hours="specialHours"
            @event-drop="onEventDrop"
            @event-resize="isValidResize"
            @event-resize-end="onEventResize"
          >
            <template #weekday-heading="{ date }">
              <span :title="t(`weekdays.${dayKey(date)}.long`)">
                {{ t(`weekdays.${dayKey(date)}.short`) }}
              </span>
            </template>
            <template #event="{ event }">
              <b-popover
                hover
                :delay="{ show: 500, hide: 50 }"
                lazy
                unmount-lazy
                teleport-to="body"
                placement="right"
                body-class="p-1"
                no-animation
              >
                <template #target>
                  <div class="block-content" @click.stop="openOverview(event.key)">
                    {{ formatDate(event.start) }} - {{ formatDate(event.end) }}
                  </div>
                </template>
                <div class="d-flex flex-column">
                  <p class="m-0 p-0 small-text">{{ t(`weekdays.${dayKey(event.start)}.long`) }}</p>
                  <p class="m-0 p-0 small-text">
                    {{ formatDate(event.start) }} - {{ formatDate(event.end) }}
                  </p>
                  <div class="d-flex flex-row gap-2 align-items-center">
                    <color-box :hex="kindOf(event.soft).hex" :button="false" :size="15" />
                    <p class="m-0 p-0 small-text">
                      {{ t(`timeConstraints.${kindOf(event.soft).key}`) }}
                    </p>
                  </div>
                </div>
              </b-popover>
            </template>
          </vue-cal>
        </div>
      </div>
    </b-modal>

    <b-modal
      v-model="overviewOpen"
      :title="selected ? blockTitle(selected) : ''"
      centered
      no-footer
      size="md"
      no-animation
    >
      <b-list-group v-if="selected">
        <b-list-group-item class="d-flex align-items-center justify-content-center">
          <b-button variant="outline-danger" @click="removeSelected">
            {{ t("timeConstraints.remove") }}
          </b-button>
        </b-list-group-item>
        <b-list-group-item>
          <h5>{{ t("timeConstraints.kind") }}</h5>
          <b-list-group horizontal class="d-flex flex-row justify-content-center gap-2">
            <b-list-group-item
              v-for="kind in kinds"
              :key="kind.key"
              class="d-flex rounded kind-option p-0 m-0 position-relative"
            >
              <color-box
                :hex="kind.hex"
                :button="false"
                :text="t(`timeConstraints.${kind.key}`)"
                class="w-100 border-0 p-0 m-0 kind-box"
                @click="selected.soft = kind.soft"
              />
              <div
                v-if="selected.soft === kind.soft"
                class="position-absolute selected-mark b-2 d-flex"
              >
                <calendar-check :size="17" />
              </div>
            </b-list-group-item>
          </b-list-group>
        </b-list-group-item>
        <b-list-group-item class="d-flex flex-row justify-content-between">
          <p class="m-0">{{ t("timeConstraints.day") }}</p>
          <p class="m-0">{{ t(`weekdays.${weekdayKey(selected.weekday)}.long`) }}</p>
        </b-list-group-item>
        <b-list-group-item :key="timeInputKey" class="d-flex flex-row gap-2 align-items-center">
          <p class="m-0 me-2 text-nowrap">{{ t("timeConstraints.time") }}</p>
          <p class="m-0 text-nowrap">{{ t("eventOverview.timeFrom") }}</p>
          <time-input
            class="time-input"
            :model-value="toTimeValue(selected.from)"
            @change="value => setTime('from', value)"
          />
          <p class="m-0 text-nowrap">{{ t("eventOverview.timeTo") }}</p>
          <time-input
            class="time-input"
            :model-value="toTimeValue(selected.to)"
            @change="value => setTime('to', value)"
          />
        </b-list-group-item>
      </b-list-group>
    </b-modal>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from "vue";
  import { useI18n } from "vue-i18n";
  import { BButton, BListGroup, BListGroupItem, BModal, BPopover } from "bootstrap-vue-next";
  import { CalendarCheck, CalendarX } from "lucide-vue-next";
  import { VueCal } from "vue-cal";
  import "vue-cal/style";
  import ColorBox from "./ColorBox.vue";
  import TimeInput from "./TimeInput.vue";
  import {
    createLecturerTimeConstraintApi,
    deleteLecturerTimeConstraintApi,
    listLecturerTimeConstraintsApi,
  } from "@/api/lecturerTimeConstraint";
  import { useNotification } from "@/composables/useNotification";
  import { toTimeValue, useTimeFormat } from "@/composables/useTimeFormat";
  import { weekdays } from "@/composables/useViewFilters";
  import type { LecturerTimeConstraint } from "@/models/LecturerTimeConstraint";
  import { useViewStore } from "@/stores/viewStore";
  import { classSlots, specialHours, timetableConfig } from "@/timetableConfig";

  /** Gesperrter Zeitraum im Kalender; constraintId fehlt bei noch nicht gespeicherten */
  type Block = Omit<LecturerTimeConstraint, "id" | "lecturer"> & {
    key: number;
    constraintId?: number;
  };

  // vue-cal liefert nur die Felder, die hier gebraucht werden
  type CalendarEvent = { start: Date; end: Date; key: number; soft: boolean };

  const props = defineProps<{
    /** ID der Lehrperson; fehlt beim Anlegen, dann startet der Kalender leer */
    lecturerId?: number;
  }>();

  const { t, locale } = useI18n();
  const { handleError } = useNotification();
  const viewStore = useViewStore();
  const vueCalLocale = computed(() => (locale.value === "en" ? "en-us" : locale.value));

  /** Arten der Sperre mit Farbe; key ist zugleich der i18n-Key */
  const kinds = [
    { key: "hard", soft: false, hex: "#991b1b" },
    { key: "soft", soft: true, hex: "#ffbc48" },
  ] as const;
  const kindOf = (soft: boolean) => kinds[soft ? 1 : 0];

  const calendarConfig = {
    ...timetableConfig,
    style: "",
    timeStep: 60,
    timeCellHeight: 26,
    editableEvents: { create: false, drag: true, resize: true, delete: false },
  };

  const slots = classSlots();
  // Montag der Woche, die der Kalender zeigt (wie im Planungskalender)
  const monday = new Date(`${timetableConfig.viewDate}T00:00:00`);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  const show = ref(false);
  const loading = ref(props.lecturerId !== undefined);
  /** Einschränkungen wie in der Datenbank */
  const saved = ref<LecturerTimeConstraint[]>([]);
  const blocks = ref<Block[]>([]);
  let nextKey = 1;
  /** Zeitpunkt des letzten Größenziehens, damit der Klick danach keine Übersicht öffnet */
  let lastResize = 0;

  /** Zeitraum, dessen Übersicht offen ist */
  const selectedKey = ref<number | null>(null);
  const selected = computed(() => blocks.value.find(b => b.key === selectedKey.value));
  /** Erzwingt nach jeder Eingabe die Anzeige der übernommenen Uhrzeit */
  const timeInputKey = ref(0);
  const overviewOpen = computed({
    get: () => selected.value !== undefined,
    set: open => {
      if (!open) selectedKey.value = null;
    },
  });

  const toDate = (weekday: number, minutes: number) =>
    new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + ((weekday + 6) % 7),
      0,
      minutes
    );
  /** Minuten seit Mitternacht von "day"; 00:00 am Folgetag ergibt 1440 statt 0 */
  const toMinutes = (date: Date, day: Date = date) =>
    Math.round((date.getTime() - new Date(day).setHours(0, 0, 0, 0)) / 60000);
  /** Grenzen wie im Planungskalender: 08:00 bis 24:00, mindestens 15 Minuten */
  const dayStart = timetableConfig.timeFrom;
  const dayEnd = timetableConfig.timeTo;
  const minDuration = 15;
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
  const snap = (minutes: number) => Math.round(minutes / 15) * 15;
  // Anzeige im Format der Sprache (de: 13:30, en: 1:30 PM), Mitternacht als 00:00 bzw. 12:00 AM
  const { twelveHour, formatDate, formatMinutes } = useTimeFormat();
  /** i18n-Key des Wochentags (0 = Sonntag wie Date.getDay()) */
  const weekdayKey = (weekday: number) => weekdays[(weekday + 6) % 7]?.key ?? "monday";
  const dayKey = (date: Date) => weekdayKey(date.getDay());
  const blockTitle = (b: Block) =>
    `${t(`weekdays.${weekdayKey(b.weekday)}.long`)} ${formatMinutes(b.from)} - ${formatMinutes(b.to)}`;

  /** Zeiträume für das Feld im Dialog, nach Tag (Montag zuerst) und Uhrzeit sortiert */
  const summary = computed(() =>
    [...blocks.value]
      .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7) || a.from - b.from)
      .map(b => ({
        key: b.key,
        soft: b.soft,
        label: `${t(`weekdays.${weekdayKey(b.weekday)}.short`)} ${formatMinutes(b.from)}-${formatMinutes(b.to)}`,
      }))
  );

  const calendarEvents = computed(() =>
    blocks.value.map(b => ({
      start: toDate(b.weekday, b.from),
      end: toDate(b.weekday, Math.min(b.to, dayEnd)),
      class: kindOf(b.soft).key,
      key: b.key,
      soft: b.soft,
    }))
  );

  /**
   * Startet das Ziehen aus der Palette; vue-cal liefert beim Ablegen ein externes Event.
   *
   * @param e - Drag-Event
   * @param soft - true: möglichst nicht, false: nicht verfügbar
   */
  function onPaletteDragStart(e: DragEvent, soft: boolean) {
    e.dataTransfer?.setData("text/plain", "");
    e.dataTransfer?.setData("event", JSON.stringify({ soft, duration: 90 }));
    // Beginn an der Mausposition, nicht um den Griffpunkt versetzt
    e.dataTransfer?.setData("cursor-grab-at", "0");
  }

  /**
   * Abgelegt auf einem Zeitraum: dessen Art ändern. Sonst den Veranstaltungsblock an
   * dieser Stelle sperren (in einer Pause den nächstgelegenen).
   *
   * @param day - Tag der Zelle
   * @param minutes - Ablegezeitpunkt in Minuten (von vue-cal auf 15 Minuten gerundet)
   * @param soft - Art der Sperre
   */
  function dropBlock(day: Date, minutes: number, soft: boolean) {
    const weekday = day.getDay();
    const existing = blocks.value.find(
      b => b.weekday === weekday && b.from <= minutes && minutes < b.to
    );
    if (existing) {
      existing.soft = soft;
      return;
    }
    const slot =
      slots.find(s => s.from <= minutes && minutes <= s.to) ?? slots.find(s => minutes < s.from);
    if (!slot) return;
    blocks.value.push({ key: nextKey++, weekday, from: slot.from, to: slot.to, soft });
  }

  /** Verschieben: Dauer bleibt, der Zeitraum wird in den Tag geschoben */
  function moveBlock(event: CalendarEvent, day: Date) {
    const block = blocks.value.find(b => b.key === event.key);
    if (!block) return;
    const duration = block.to - block.from;
    block.weekday = day.getDay();
    block.from = clamp(snap(toMinutes(event.start, day)), dayStart, dayEnd - duration);
    block.to = block.from + duration;
  }

  /** Länge ziehen: nur das Ende ändert sich, höchstens bis 24:00 */
  function resizeBlock(event: CalendarEvent) {
    const block = blocks.value.find(b => b.key === event.key);
    if (!block) return;
    block.to = clamp(snap(toMinutes(event.end, event.start)), block.from + minDuration, dayEnd);
  }

  /** Während des Ziehens: nicht kürzer als 15 Minuten (wie im Planungskalender) */
  const isValidResize = ({ event }: { event: CalendarEvent }) =>
    toMinutes(event.end, event.start) - toMinutes(event.start) >= minDuration;

  /**
   * Übernimmt eine Uhrzeit aus der Übersicht. "00:00" als Ende heißt Mitternacht,
   * vertauschte Zeiten werden getauscht, alles bleibt in den Grenzen des Kalenders.
   *
   * @param field - Beginn oder Ende
   * @param value - Uhrzeit "HH:MM" aus dem Eingabefeld (leer, wenn ungültig)
   */
  function setTime(field: "from" | "to", value: string) {
    const block = selected.value;
    timeInputKey.value++;
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    if (!block || !match) return;
    let minutes = Number(match[1]) * 60 + Number(match[2]);
    if (field === "to" && minutes === 0) minutes = dayEnd;
    let from = field === "from" ? minutes : block.from;
    let to = field === "to" ? minutes : block.to;
    if (to < from) [from, to] = [to, from];
    block.from = clamp(from, dayStart, dayEnd - minDuration);
    block.to = clamp(to, block.from + minDuration, dayEnd);
  }

  /** Ablegen aus der Palette oder Verschieben: eigene Daten anpassen, vue-cal zeichnet neu */
  // Tag aus der Zelle: vue-cal rechnet den Beginn vom Griffpunkt aus, der kann über Mitternacht rutschen
  function onEventDrop({
    event,
    external,
    cell,
  }: {
    event: CalendarEvent;
    external: boolean;
    cell: { start: Date };
  }): false {
    if (external) dropBlock(cell.start, toMinutes(event.start, cell.start), event.soft);
    else moveBlock(event, cell.start);
    return false;
  }

  function onEventResize({ event }: { event: CalendarEvent }) {
    lastResize = Date.now();
    resizeBlock(event);
  }

  /** Klick auf einen Zeitraum öffnet dessen Übersicht (wie bei Terminen im Planungskalender) */
  function openOverview(key: number) {
    if (Date.now() - lastResize < 300) return;
    selectedKey.value = key;
  }

  function removeSelected() {
    blocks.value = blocks.value.filter(b => b.key !== selectedKey.value);
    selectedKey.value = null;
  }

  const isUnchanged = (b: Block, c: LecturerTimeConstraint) =>
    b.weekday === c.weekday && b.from === c.from && b.to === c.to && b.soft === c.soft;

  /**
   * Speichert die Änderungen. Unveränderte Zeiträume bleiben bestehen, damit ignorierte
   * Verstöße daran erhalten bleiben.
   *
   * @param lecturerId - ID der Lehrperson (beim Anlegen erst nach dem Speichern bekannt)
   */
  async function save(lecturerId: number) {
    if (loading.value) return;
    const kept = new Set(
      blocks.value
        .filter(b => {
          const original = saved.value.find(c => c.id === b.constraintId);
          return original !== undefined && isUnchanged(b, original);
        })
        .map(b => b.constraintId)
    );

    try {
      // erst anlegen, dann löschen: bei einem Fehler gehen keine Zeiten verloren
      for (const b of blocks.value.filter(b => !kept.has(b.constraintId))) {
        await createLecturerTimeConstraintApi({
          lecturer: lecturerId,
          weekday: b.weekday,
          from: b.from,
          to: b.to,
          soft: b.soft,
        });
      }
      for (const c of saved.value.filter(c => !kept.has(c.id))) {
        await deleteLecturerTimeConstraintApi(c.id);
      }
    } catch (error) {
      handleError(error as Error, t("timeConstraints.saveFailed"));
    }
  }

  onMounted(async () => {
    if (props.lecturerId === undefined) return;
    try {
      saved.value = await listLecturerTimeConstraintsApi(props.lecturerId);
      blocks.value = saved.value.map(c => ({
        key: nextKey++,
        constraintId: c.id,
        weekday: c.weekday,
        from: c.from,
        to: c.to,
        soft: c.soft,
      }));
      loading.value = false;
    } catch (error) {
      handleError(error as Error, t("timeConstraints.loadFailed"));
    }
  });

  defineExpose({ save });
</script>

<style scoped>
  .mini-calendar {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    height: 450px;
    overflow: hidden;
  }

  /* stylelint-disable-next-line selector-class-pattern -- Klassen von vue-cal */
  .mini-calendar :deep(.vuecal__event) {
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.7rem;
  }

  /* stylelint-disable-next-line selector-class-pattern -- Klassen von vue-cal */
  .mini-calendar :deep(.vuecal__event.hard) {
    background-color: #991b1b;
    color: white;
  }

  /* stylelint-disable-next-line selector-class-pattern -- Klassen von vue-cal */
  .mini-calendar :deep(.vuecal__event.soft) {
    background-color: #ffbc48;
    color: black;
  }

  .block-content {
    height: 100%;
    padding: 1px 3px;
  }

  .palette {
    flex: 0 0 170px;
  }

  /* wie die Karten der Veranstaltungsliste; Farbe nur als Hinweis am linken Rand */
  .palette-item {
    border-left-style: solid !important;
    border-left-width: 5px !important;
    border-top-width: 1px !important;
    cursor: grab;
    user-select: none;
  }

  .palette-item:hover {
    background-color: var(--hover-color);
  }

  .summary {
    display: flex;
    gap: 12px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .summary-item {
    align-items: center;
    display: inline-flex;
    gap: 5px;
  }

  .dot {
    border-radius: 50%;
    display: inline-block;
    height: 10px;
    width: 10px;
  }

  .small-text {
    font-size: small;
  }

  /* wie die Farbauswahl in der Termin-Übersicht */
  .kind-option {
    flex: 0 0 calc((100% - 0.5rem) / 2);
    transition: transform 0.2s ease-in-out;
  }

  .kind-option:hover {
    transform: scale(1.02);
  }

  .kind-option:active {
    transform: scale(0.95);
  }

  .kind-box {
    border-radius: 5px !important;
    cursor: pointer;
    display: block;
    min-width: 0;
  }

  /* Uhrzeitfelder teilen sich den Platz, statt über den Rand zu ragen (wie in der Termin-Übersicht) */
  .time-input {
    flex: 1 1 0;
    min-width: 0;
  }

  .selected-mark {
    background-color: rgb(255 255 255);
    border: solid 1px;
    border-radius: 5px;
    color: black;
    padding: 0 1px 1px;
    transform: translate(-20%, -30%);
  }
</style>
