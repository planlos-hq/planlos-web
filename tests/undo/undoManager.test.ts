import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/ApiError";
import type { BatchRequest, BatchResponse } from "@/api/batch";
import { UndoManager, type UndoResource } from "@/undo/undoManager";

const resources: Record<string, UndoResource> = {
  courseTimeSlot: {
    identity: "id",
    fields: ["course", "weekday", "at", "duration"],
    createOnly: ["one_off_date"],
  },
  timeSlotRoomAssignment: { identity: "data" },
  ignoredResourceConflict: { identity: "data" },
};

const slot = {
  id: 5,
  course: 1,
  weekday: 1,
  at: "08:00:00",
  duration: "01:30:00",
  one_off_date: null,
};

function response(...results: BatchResponse["results"]): BatchResponse {
  return { results };
}

function mockSend() {
  return vi.fn<(r: BatchRequest) => Promise<BatchResponse>>();
}

const move = (at: string) => [
  { kind: "update" as const, resource: "courseTimeSlot", id: 5, set: { at } },
];

describe("UndoManager", () => {
  it("baut aus dem Serverzustand vorher/nachher die Umkehr-Operation mit expect", async () => {
    const send = mockSend();
    const m = new UndoManager(send, resources);

    send.mockResolvedValueOnce(response({ before: slot, after: { ...slot, at: "10:00:00" } }));
    await m.perform("Termin verschieben", move("10:00"));
    expect(m.undoLabel).toBe("Termin verschieben");

    send.mockResolvedValueOnce(response({ before: { ...slot, at: "10:00:00" }, after: slot }));
    await m.undo();
    expect(send.mock.calls[1]![0].ops).toEqual([
      {
        kind: "update",
        resource: "courseTimeSlot",
        id: 5,
        set: { at: "08:00:00" },
        expect: { at: "10:00:00" },
      },
    ]);
  });

  it("Rückgängig von Löschen stellt Termin + Räume unter der alten ID wieder her", async () => {
    const send = mockSend();
    const m = new UndoManager(send, resources);

    send.mockResolvedValueOnce(
      response({ before: { time_slot: 5, room: 7 }, after: null }, { before: slot, after: null })
    );
    await m.perform("Termin löschen", [
      { kind: "delete", resource: "timeSlotRoomAssignment", data: { time_slot: 5, room: 7 } },
      { kind: "delete", resource: "courseTimeSlot", id: 5 },
    ]);

    send.mockResolvedValueOnce(
      response({ before: null, after: slot }, { before: null, after: { time_slot: 5, room: 7 } })
    );
    await m.undo();
    // erst der Termin (mit alter ID), dann die Räume
    expect(send.mock.calls[1]![0].ops).toEqual([
      {
        kind: "create",
        resource: "courseTimeSlot",
        id: 5,
        data: { course: 1, weekday: 1, at: "08:00:00", duration: "01:30:00", one_off_date: null },
      },
      { kind: "create", resource: "timeSlotRoomAssignment", data: { time_slot: 5, room: 7 } },
    ]);

    // Wiederholen löscht wieder dieselbe ID
    send.mockResolvedValueOnce(
      response({ before: { time_slot: 5, room: 7 }, after: null }, { before: slot, after: null })
    );
    await m.redo();
    expect(send.mock.calls[2]![0].ops[1]).toMatchObject({ kind: "delete", id: 5 });
  });

  it("verwirft den Eintrag bei 409 (fremde Änderung) und meldet den Grund", async () => {
    const send = mockSend();
    const m = new UndoManager(send, resources);
    send.mockResolvedValueOnce(response({ before: slot, after: { ...slot, at: "10:00:00" } }));
    await m.perform("Termin verschieben", move("10:00"));

    send.mockRejectedValueOnce(new ApiError(409, "geändert"));
    expect(await m.undo()).toEqual({ ok: false, label: "Termin verschieben", reason: "geändert" });
    expect(m.undoLabel).toBeUndefined();
    expect(m.redoLabel).toBeUndefined();
  });

  it("behält den Eintrag bei Netzwerkfehler, damit erneut versucht werden kann", async () => {
    const send = mockSend();
    const m = new UndoManager(send, resources);
    send.mockResolvedValueOnce(response({ before: slot, after: { ...slot, at: "10:00:00" } }));
    await m.perform("Termin verschieben", move("10:00"));

    send.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(m.undo()).rejects.toThrow(TypeError);
    expect(m.undoLabel).toBe("Termin verschieben");
  });

  it("eine neue Aktion leert Wiederholen", async () => {
    const send = mockSend();
    send.mockResolvedValue(response({ before: slot, after: slot }));
    const m = new UndoManager(send, resources);

    await m.perform("A", move("10:00"));
    await m.undo();
    expect(m.redoLabel).toBe("A");
    await m.perform("B", move("11:00"));
    expect(m.redoLabel).toBeUndefined();
  });
});

describe("Ignorierte Konflikte", () => {
  const ignore = { slot_a: 5, slot_b: 9, resource_type: "room", resource_id: 3 };

  it("stellt beim Rückgängigmachen die mitgelöschten Markierungen nach dem Termin wieder her", async () => {
    const send = mockSend();
    const m = new UndoManager(send, resources);

    send.mockResolvedValueOnce(
      response({
        before: slot,
        after: null,
        cascade: [{ resource: "ignoredResourceConflict", row: ignore }],
      })
    );
    await m.perform("Termin löschen", [{ kind: "delete", resource: "courseTimeSlot", id: 5 }]);

    send.mockResolvedValueOnce(
      response({ before: null, after: slot }, { before: null, after: ignore })
    );
    await m.undo();
    const ops = send.mock.calls[1]![0].ops;
    expect(ops.map(o => o.resource)).toEqual(["courseTimeSlot", "ignoredResourceConflict"]);
    // gleiche IDs wie vorher, keine Umrechnung nötig
    expect(ops[1]).toEqual({ kind: "create", resource: "ignoredResourceConflict", data: ignore });
  });

  it("übersprungene Markierungen (Gegenstück gelöscht) erzeugen keine Umkehr-Operation", async () => {
    const send = mockSend();
    const m = new UndoManager(send, resources);
    send.mockResolvedValueOnce(
      response({
        before: slot,
        after: null,
        cascade: [{ resource: "ignoredResourceConflict", row: ignore }],
      })
    );
    await m.perform("Termin löschen", [{ kind: "delete", resource: "courseTimeSlot", id: 5 }]);
    // Server stellt den Termin wieder her, überspringt aber die Markierung (Termin 9 gibt es nicht mehr)
    send.mockResolvedValueOnce(
      response({ before: null, after: slot }, { before: null, after: null })
    );
    await m.undo();
    send.mockResolvedValueOnce(response({ before: slot, after: null }));
    await m.redo();
    expect(send.mock.calls[2]![0].ops.map(o => o.resource)).toEqual(["courseTimeSlot"]);
  });

  it("Wiederholen ignoriert einen Konflikt erneut, den das Rückgängigmachen aufgelöst hat", async () => {
    const send = mockSend();
    const m = new UndoManager(send, resources);
    const moved = { ...slot, at: "10:00:00" };

    // Verschieben erzeugt einen Konflikt, der danach (außerhalb des Verlaufs) ignoriert wird
    send.mockResolvedValueOnce(response({ before: slot, after: moved }));
    await m.perform("Termin verschieben", move("10:00"));

    // Zurückschieben löst den Konflikt, der Server entfernt die Markierung mit
    send.mockResolvedValueOnce(
      response({
        before: moved,
        after: slot,
        cascade: [{ resource: "ignoredResourceConflict", row: ignore }],
      })
    );
    await m.undo();

    send.mockResolvedValueOnce(
      response({ before: slot, after: moved }, { before: null, after: ignore })
    );
    await m.redo();
    expect(send.mock.calls[2]![0].ops).toEqual([
      {
        kind: "update",
        resource: "courseTimeSlot",
        id: 5,
        set: { at: "10:00:00" },
        expect: { at: "08:00:00" },
      },
      { kind: "create", resource: "ignoredResourceConflict", data: ignore },
    ]);

    // erneutes Rückgängig entfernt die Markierung wieder
    send.mockResolvedValueOnce(
      response({ before: ignore, after: null }, { before: moved, after: slot })
    );
    await m.undo();
    expect(send.mock.calls[3]![0].ops.map(o => `${o.kind} ${o.resource}`)).toEqual([
      "delete ignoredResourceConflict",
      "update courseTimeSlot",
    ]);
  });
});
