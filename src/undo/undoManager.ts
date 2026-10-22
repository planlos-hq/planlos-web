import { ApiError } from "@/api/ApiError";
import type { BatchFields, BatchOp, BatchRequest, BatchResponse, BatchResult } from "@/api/batch";

// Rückgängig/Wiederholen pro Tab. Ein Rückgängig sendet "expect" mit: Hat jemand anderes die
// Felder inzwischen geändert, lehnt der Server mit 409 ab und der Eintrag wird verworfen.

/** Beschreibung einer Ressource, die über POST /batch geändert werden kann. */
export type UndoResource = {
  /** "id": Eintrag hat eine eigene ID, "data": Eintrag ist durch seine Felder bestimmt */
  identity: "id" | "data";
  /** Felder, die beim Wiederherstellen gesetzt bzw. beim Löschen erwartet werden ("id"-Ressourcen) */
  fields?: string[];
  /** Zusätzliche Felder nur beim Wiederherstellen */
  createOnly?: string[];
};

export type UndoEntry = { label: string; ops: BatchOp[] };

export type UndoResult = { ok: true; label: string } | { ok: false; label: string; reason: string };

export type SendBatch = (request: BatchRequest) => Promise<BatchResponse>;

export class UndoManager {
  readonly limit = 100;
  /** Wird nach jeder Änderung der Stapel aufgerufen */
  onChange: (() => void) | undefined;

  private undoStack: UndoEntry[] = [];
  private redoStack: UndoEntry[] = [];
  private queue: Promise<unknown> = Promise.resolve();

  private send: SendBatch;
  private resources: Record<string, UndoResource>;

  constructor(send: SendBatch, resources: Record<string, UndoResource>) {
    this.send = send;
    this.resources = resources;
  }

  get undoLabel(): string | undefined {
    return this.undoStack[this.undoStack.length - 1]?.label;
  }

  get redoLabel(): string | undefined {
    return this.redoStack[this.redoStack.length - 1]?.label;
  }

  /** Führt eine Nutzeraktion aus und merkt sich, wie sie rückgängig gemacht wird. */
  perform(label: string, ops: BatchOp[]): Promise<BatchResponse> {
    return this.serialize(async () => {
      const { response, inverse } = await this.apply(ops);
      if (inverse.length > 0) this.push(this.undoStack, { label, ops: inverse });
      this.redoStack = [];
      this.onChange?.();
      return response;
    });
  }

  undo(): Promise<UndoResult | null> {
    return this.serialize(() => this.replay(this.undoStack, this.redoStack));
  }

  redo(): Promise<UndoResult | null> {
    return this.serialize(() => this.replay(this.redoStack, this.undoStack));
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.onChange?.();
  }

  private async replay(from: UndoEntry[], to: UndoEntry[]): Promise<UndoResult | null> {
    const entry = from.pop();
    if (!entry) return null;
    try {
      const { inverse } = await this.apply(entry.ops);
      if (inverse.length > 0) this.push(to, { label: entry.label, ops: inverse });
      return { ok: true, label: entry.label };
    } catch (error) {
      // 409/404: inzwischen von jemand anderem geändert/gelöscht, Eintrag verwerfen
      if (error instanceof ApiError && (error.status === 409 || error.status === 404)) {
        return { ok: false, label: entry.label, reason: error.message };
      }
      from.push(entry); // z. B. Netzwerkfehler: kann erneut versucht werden
      throw error;
    } finally {
      this.onChange?.();
    }
  }

  private async apply(ops: BatchOp[]) {
    const response = await this.send({ ops });
    // Nach jeder Umkehrung die nebenbei gelöschten Einträge (cascade) wieder anlegen
    const inverse = ops
      .map((op, i) => {
        const result = response.results[i]!;
        const restoreCascade = (result.cascade ?? []).map(
          (c): BatchOp => ({ kind: "create", resource: c.resource, data: c.row })
        );
        const undo = this.invert(op, result);
        return [...(undo ? [undo] : []), ...restoreCascade];
      })
      .reverse()
      .flat();
    return { response, inverse };
  }

  /** Umkehrung einer Operation; null, wenn der Server sie übersprungen hat. */
  private invert(op: BatchOp, { before, after }: BatchResult): BatchOp | null {
    const config = this.resources[op.resource];
    if (!config) throw new Error(`Unbekannte Ressource ${op.resource}`);
    const { resource } = op;
    const fields = config.fields ?? [];

    switch (op.kind) {
      case "create":
        if (!after) return null;
        return config.identity === "id"
          ? { kind: "delete", resource, id: rowId(after), expect: pick(after, fields) }
          : { kind: "delete", resource, data: after };
      case "delete":
        if (!before) return null;
        return config.identity === "id"
          ? {
              kind: "create",
              resource,
              id: rowId(before),
              data: pick(before, [...fields, ...(config.createOnly ?? [])]),
            }
          : { kind: "create", resource, data: before };
      case "update": {
        const keys = Object.keys(op.set);
        return {
          kind: "update",
          resource,
          id: op.id,
          set: pick(before!, keys),
          expect: pick(after!, keys),
        };
      }
    }
  }

  private push(stack: UndoEntry[], entry: UndoEntry) {
    stack.push(entry);
    if (stack.length > this.limit) stack.shift();
  }

  /** Anfragen nacheinander ausführen */
  private serialize<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.queue.then(fn, fn);
    this.queue = run.catch(() => undefined);
    return run;
  }
}

function pick(row: BatchFields, keys: string[]): BatchFields {
  return Object.fromEntries(keys.map(k => [k, row[k] ?? null]));
}

function rowId(row: BatchFields): number {
  if (typeof row.id !== "number") throw new Error("Antwort des Servers enthält keine ID");
  return row.id;
}
