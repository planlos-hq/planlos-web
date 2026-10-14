import type { Room } from "./Room";

export type TimeSlot = {
  id: number;
  start: Date;
  end: Date;
  rooms: Room[];
};
