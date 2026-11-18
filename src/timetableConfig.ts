const start = 8 * 60;

const classDuration = 90; //min

const breaks = [15, 15, 30, 15, 15, 15, 15, 15];

export type BreakSlot = {
  from: number;
  to: number;
  class: string;
};

/**
 * Generiert die Pausenzeiten.
 *
 * @returns Array an Pausenzeiten
 */
function breakSlots() {
  const slots: BreakSlot[] = [];

  let time = start;
  breaks.forEach(b => {
    time = time + classDuration;
    slots.push({
      from: time,
      to: time + b,
      class: "break-slots",
    });
    time = time + b;
  });

  return slots;
}

export type ClassSlot = {
  /** Beginn in Minuten ab Mitternacht */
  from: number;
  /** Ende in Minuten ab Mitternacht */
  to: number;
};

/**
 * Generiert die Veranstaltungsblöcke zwischen den Pausen (08:00-09:30, 09:45-11:15, ...).
 *
 * @returns Array an Veranstaltungsblöcken
 */
export function classSlots() {
  const slots: ClassSlot[] = [{ from: start, to: start + classDuration }];
  breakSlots().forEach(b => slots.push({ from: b.to, to: b.to + classDuration }));
  return slots;
}

export const specialHours = {
  mon: breakSlots(),
  tue: breakSlots(),
  wed: breakSlots(),
  thu: breakSlots(),
  fri: breakSlots(),
  sat: breakSlots(),
  sun: breakSlots(),
};

export const timetableConfig = {
  style: "height: 100%",
  timeFrom: 8 * 60, // 8:00 Uhr
  timeTo: 24 * 60, // 00:00 Uhr
  timeStep: 30,
  snapToInterval: 15,
  titleBar: false,
  viewsBar: false,
  hideWeekends: false,
  viewDate: "2025-09-30",
  views: ["week"],

  editableEvents: {
    create: false,
    resize: true,
    resizeX: false,
    drag: true,
    delete: false,
  },
};
