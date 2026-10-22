// Mehrbenutzer-Szenarien gegen einen echten planlos-server (mit NO_AUTH).
// Läuft nur, wenn PLANLOS_API_URL gesetzt ist, z. B.:
//   PLANLOS_API_URL=http://localhost:8004/api/v1 npx vitest run tests/undo
import { beforeAll, describe, expect, it } from "vitest";
import { ApiError } from "@/api/ApiError";
import type { BatchOp, BatchRequest, BatchResponse } from "@/api/batch";
import { UndoManager, type UndoResource } from "@/undo/undoManager";

const url = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env
  .PLANLOS_API_URL;

const resources: Record<string, UndoResource> = {
  courseTimeSlot: {
    identity: "id",
    fields: ["course", "weekday", "at", "duration"],
    createOnly: ["one_off_date"],
  },
  timeSlotRoomAssignment: { identity: "data" },
  courseColor: { identity: "id", fields: ["name", "hex"] },
  courseColorAssignment: { identity: "data" },
  ignoredResourceConflict: { identity: "data" },
  ignoredLecturerConstraintViolation: { identity: "data" },
};

async function send(request: BatchRequest): Promise<BatchResponse> {
  const response = await fetch(`${url}/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const body = await response.json();
  if (!response.ok) throw new ApiError(response.status, body.error);
  return body;
}

async function post(path: string, body: unknown) {
  const response = await fetch(`${url}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  expect(response.ok).toBe(true);
  return response.json();
}

async function getSlot(id: number) {
  const response = await fetch(`${url}/course-time-slot/${id}`);
  return response.ok ? response.json() : undefined;
}

async function roomsOf(id: number): Promise<number[]> {
  const response = await fetch(`${url}/course-time-slot/${id}/rooms`);
  return ((await response.json()) as { id: number }[]).map(r => r.id).sort();
}

const newId = (r: BatchResponse) => r.results[0]!.after!.id as number;

/** Ein Browser-Tab mit eigenem Verlauf, wie timeSlotStore es benutzt */
function user() {
  const m = new UndoManager(send, resources);
  const update = (label: string, id: number, set: Record<string, string>) =>
    m.perform(label, [{ kind: "update", resource: "courseTimeSlot", id, set }]);
  return {
    m,
    create: async (course: number, at: string) =>
      newId(
        await m.perform("Termin anlegen", [
          {
            kind: "create",
            resource: "courseTimeSlot",
            data: { course, weekday: 1, at, duration: "01:30" },
          },
        ])
      ),
    move: (id: number, at: string) => update("Termin verschieben", id, { at }),
    setDuration: (id: number, duration: string) => update("Dauer ändern", id, { duration }),
    assignRoom: (id: number, room: number) =>
      m.perform("Raum zuweisen", [
        { kind: "create", resource: "timeSlotRoomAssignment", data: { time_slot: id, room } },
      ]),
    delete: async (id: number) =>
      m.perform("Termin löschen", [
        ...(await roomsOf(id)).map(
          (room): BatchOp => ({
            kind: "delete",
            resource: "timeSlotRoomAssignment",
            data: { time_slot: id, room },
          })
        ),
        { kind: "delete", resource: "courseTimeSlot", id },
      ]),
  };
}

describe.skipIf(url === undefined)("Undo/Redo mit mehreren Nutzern (echter Server)", () => {
  let course: number;
  let room1: number;
  let room2: number;

  beforeAll(async () => {
    const suffix = Date.now();
    course = (
      await post("/course", {
        number: `U${suffix}`,
        name: "Undo-Test",
        abbreviation: `UT${suffix}`,
      })
    ).id;
    room1 = (await post("/room", { number: `R1-${suffix}` })).id;
    room2 = (await post("/room", { number: `R2-${suffix}` })).id;
  });

  it("macht nur eigene Aktionen rückgängig", async () => {
    const alice = user();
    const bob = user();
    const a = await alice.create(course, "08:00");
    const b = await bob.create(course, "10:00");
    await alice.move(a, "12:00");
    await bob.move(b, "14:00");

    expect((await alice.m.undo())?.ok).toBe(true);
    expect((await getSlot(a)).at).toBe("08:00:00");
    expect((await getSlot(b)).at).toBe("14:00:00"); // Bobs Änderung bleibt
  });

  it("verweigert Rückgängig, wenn jemand dasselbe Feld inzwischen geändert hat", async () => {
    const alice = user();
    const bob = user();
    const id = await alice.create(course, "08:00");
    await alice.move(id, "12:00");
    await bob.move(id, "16:00");

    expect(await alice.m.undo()).toMatchObject({ ok: false });
    expect((await getSlot(id)).at).toBe("16:00:00");
  });

  it("erlaubt Rückgängig, wenn jemand nur ein anderes Feld geändert hat", async () => {
    const alice = user();
    const bob = user();
    const id = await alice.create(course, "08:00");
    await alice.move(id, "12:00");
    await bob.setDuration(id, "03:00");

    expect((await alice.m.undo())?.ok).toBe(true);
    expect(await getSlot(id)).toMatchObject({ at: "08:00:00", duration: "03:00:00" });
  });

  it("Löschen rückgängig: Termin + Räume unter derselben ID zurück, alles wiederholbar", async () => {
    const alice = user();
    const id = await alice.create(course, "08:00");
    await alice.move(id, "12:00");
    await alice.assignRoom(id, room1);
    await alice.assignRoom(id, room2);
    await alice.delete(id);
    expect(await getSlot(id)).toBeUndefined();

    await alice.m.undo(); // Löschen
    expect((await getSlot(id)).at).toBe("12:00:00"); // gleiche ID
    expect(await roomsOf(id)).toEqual([room1, room2].sort());

    await alice.m.undo(); // Raum 2
    await alice.m.undo(); // Raum 1
    expect(await roomsOf(id)).toEqual([]);
    expect((await alice.m.undo())?.ok).toBe(true); // Verschieben
    expect((await getSlot(id)).at).toBe("08:00:00");
    expect((await alice.m.undo())?.ok).toBe(true); // Anlegen
    expect(await getSlot(id)).toBeUndefined();

    for (let i = 0; i < 5; i++) expect((await alice.m.redo())?.ok).toBe(true);
    expect(await getSlot(id)).toBeUndefined(); // wieder gelöscht
  });

  it("Bobs Verlauf bleibt gültig, nachdem Alice den Termin gelöscht und wiederhergestellt hat", async () => {
    const alice = user();
    const bob = user();
    const id = await alice.create(course, "08:00");
    await bob.move(id, "15:00");
    await alice.delete(id);
    await alice.m.undo(); // Termin kommt mit derselben ID (und Bobs 15:00) zurück

    // Mit wechselnden IDs wäre das ein 404; mit stabilen IDs klappt Bobs Rückgängig
    expect((await bob.m.undo())?.ok).toBe(true);
    expect((await getSlot(id)).at).toBe("08:00:00");
  });

  it("von jemand anderem gelöschter Termin: Rückgängig scheitert sauber", async () => {
    const alice = user();
    const bob = user();
    const id = await alice.create(course, "08:00");
    await alice.move(id, "12:00");
    await bob.delete(id);

    expect(await alice.m.undo()).toMatchObject({ ok: false });
  });

  it("ein Eintrag ist atomar: scheitert ein Teil, bleibt alles unverändert", async () => {
    const alice = user();
    const bob = user();
    const id = await alice.create(course, "08:00");
    await alice.assignRoom(id, room1);
    await alice.delete(id);
    await alice.m.undo(); // Termin + Raum wieder da
    await bob.setDuration(id, "02:00");

    // Wiederholen = Raum löschen + Termin löschen (erwartet Dauer 01:30) -> muss komplett scheitern
    expect(await alice.m.redo()).toMatchObject({ ok: false });
    expect(await getSlot(id)).toBeDefined();
    expect(await roomsOf(id)).toEqual([room1]);
  });

  it("schnelles mehrfaches Strg+Z wird nacheinander ausgeführt", async () => {
    const alice = user();
    const id = await alice.create(course, "08:00");
    await alice.move(id, "09:00");
    await alice.move(id, "10:00");
    await alice.move(id, "11:00");
    const results = await Promise.all([alice.m.undo(), alice.m.undo(), alice.m.undo()]);
    expect(results.map(r => r?.ok)).toEqual([true, true, true]);
    expect((await getSlot(id)).at).toBe("08:00:00");
  });
});

describe.skipIf(url === undefined)("Farben und Beschriftungen (echter Server)", () => {
  let course: number;

  beforeAll(async () => {
    const suffix = Date.now();
    course = (
      await post("/course", {
        number: `F${suffix}`,
        name: "Farb-Test",
        abbreviation: `FT${suffix}`,
      })
    ).id;
  });

  async function getColor(id: number) {
    const response = await fetch(`${url}/course-color/${id}`);
    return response.ok ? response.json() : undefined;
  }

  async function colorOf(courseId: number): Promise<number | undefined> {
    const all: { course: number; color: number }[] = await (
      await fetch(`${url}/course/colors`)
    ).json();
    return all.find(a => a.course === courseId)?.color;
  }

  /** Ein Tab, wie colorStore / courseStore.setCourseColor es macht */
  function colorUser() {
    const m = new UndoManager(send, resources);
    return {
      m,
      createColor: async (name: string, hex: string) =>
        newId(
          await m.perform("Farbe anlegen", [
            { kind: "create", resource: "courseColor", data: { name, hex } },
          ])
        ),
      editColor: (id: number, set: Record<string, string>) =>
        m.perform("Farbe bearbeiten", [{ kind: "update", resource: "courseColor", id, set }]),
      deleteColor: (id: number) =>
        m.perform("Farbe löschen", [{ kind: "delete", resource: "courseColor", id }]),
      paint: async (courseId: number, color: number | undefined) => {
        const current = await colorOf(courseId);
        if (current === color) return;
        await m.perform(color !== undefined ? "Farbe zuweisen" : "Farbe zurücksetzen", [
          ...(current !== undefined
            ? [
                {
                  kind: "delete" as const,
                  resource: "courseColorAssignment",
                  data: { course: courseId, color: current },
                },
              ]
            : []),
          ...(color !== undefined
            ? [
                {
                  kind: "create" as const,
                  resource: "courseColorAssignment",
                  data: { course: courseId, color },
                },
              ]
            : []),
        ]);
      },
    };
  }

  it("Einfärben: Strg+Z stellt die vorige Farbe wieder her", async () => {
    const alice = colorUser();
    const blue = await alice.createColor("Blau", "#0000FF");
    const red = await alice.createColor("Rot", "#FF0000");
    await alice.paint(course, blue);
    await alice.paint(course, red);

    await alice.m.undo();
    expect(await colorOf(course)).toBe(blue);
    await alice.m.undo();
    expect(await colorOf(course)).toBeUndefined();
    await alice.m.redo();
    await alice.m.redo();
    expect(await colorOf(course)).toBe(red);
  });

  it("Beschriftung ändern rückgängig, während jemand anderes den Farbwert ändert", async () => {
    const alice = colorUser();
    const bob = colorUser();
    const c = await alice.createColor("Grün", "#00FF00");
    await alice.editColor(c, { name: "Pflichtfach" });
    await bob.editColor(c, { hex: "#008000" });

    expect((await alice.m.undo())?.ok).toBe(true);
    expect(await getColor(c)).toMatchObject({ name: "Grün", hex: "#008000" });
  });

  it("verweigert, wenn jemand anderes dieselbe Beschriftung geändert hat", async () => {
    const alice = colorUser();
    const bob = colorUser();
    const c = await alice.createColor("Gelb", "#FFFF00");
    await alice.editColor(c, { name: "Wahlfach" });
    await bob.editColor(c, { name: "Seminar" });

    expect(await alice.m.undo()).toMatchObject({ ok: false });
    expect((await getColor(c)).name).toBe("Seminar");
  });

  it("verweigert Zurücksetzen, wenn jemand anderes die Veranstaltung umgefärbt hat", async () => {
    const alice = colorUser();
    const bob = colorUser();
    const a = await alice.createColor("A", "#111111");
    const b = await bob.createColor("B", "#222222");
    await alice.paint(course, undefined); // Ausgangslage: keine Farbe
    await alice.paint(course, a);
    await bob.paint(course, b);

    expect(await alice.m.undo()).toMatchObject({ ok: false });
    expect(await colorOf(course)).toBe(b);
  });

  it("gelöschte Farbe kommt mit derselben ID zurück; ältere Einträge funktionieren weiter", async () => {
    const alice = colorUser();
    const c = await alice.createColor("Lila", "#800080");
    await alice.paint(course, c);
    await alice.paint(course, undefined);
    await alice.deleteColor(c);
    expect(await getColor(c)).toBeUndefined();

    await alice.m.undo(); // Farbe wieder da, gleiche ID
    expect(await getColor(c)).toMatchObject({ id: c, name: "Lila", hex: "#800080" });
    await alice.m.undo(); // Zurücksetzen rückgängig -> Veranstaltung hat wieder Lila
    expect(await colorOf(course)).toBe(c);
  });
});

describe.skipIf(url === undefined)("Ignorierte Konflikte beim Löschen (echter Server)", () => {
  it("Termin löschen + Rückgängig stellt den ignorierten Raumkonflikt wieder her", async () => {
    const suffix = Date.now();
    const course = (
      await post("/course", {
        number: `I${suffix}`,
        name: "Ignore-Test",
        abbreviation: `IT${suffix}`,
      })
    ).id;
    const room = (await post("/room", { number: `RI-${suffix}` })).id;
    const alice = user();
    const a = await alice.create(course, "08:00");
    const b = await alice.create(course, "08:00");
    await alice.assignRoom(a, room);
    await alice.assignRoom(b, room);
    // Konflikt (gleicher Raum, gleiche Zeit) als "ignoriert" markieren
    const ignore = await fetch(`${url}/resource-constraint-violations/ignore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slot_a_id: a,
        slot_b_id: b,
        resource_type: "room",
        resource_id: room,
      }),
    });
    expect(ignore.ok).toBe(true);

    const ignoredFor = async (slot: number) =>
      (
        (await (await fetch(`${url}/resource-constraint-violations/ignored`)).json()) as {
          slot_a: number;
          slot_b: number;
        }[]
      ).filter(i => i.slot_a === slot || i.slot_b === slot);

    await alice.delete(a);
    expect(await ignoredFor(b)).toEqual([]);

    await alice.m.undo();
    // gleiche IDs -> genau das ursprüngliche Paar ist wieder da
    expect(await ignoredFor(b)).toMatchObject([{ slot_a: a, slot_b: b, resource_type: "room" }]);

    await alice.m.redo();
    expect(await ignoredFor(b)).toEqual([]);
    await alice.m.undo();
    expect(await ignoredFor(b)).toMatchObject([{ slot_a: a, slot_b: b }]);
  });
});
