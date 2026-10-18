import type { UpdateOperation } from "./types.updates";
import { useRoomStore } from "@/stores/roomStore";
import type { RoomApiData } from "@/api/types";
import { mapApiRoom } from "@/api/util";
import { useViewStore } from "@/stores/viewStore";
import { Tab } from "@/enums/enums";

export function handleRoom(operation: UpdateOperation, data: RoomApiData | number) {
  let r;
  const roomStore = useRoomStore();
  const viewStore = useViewStore();
  switch (operation) {
    case "create":
      r = data as RoomApiData;
      roomStore.roomMap.set(r.id, mapApiRoom(r));
      break;
    case "update":
      r = data as RoomApiData;
      const oldRoom = roomStore.roomMap.get(r.id);
      if (!oldRoom) {
        return;
      }
      Object.assign(oldRoom, mapApiRoom(r));
      break;
    case "delete":
      r = data as number;
      roomStore.roomMap.delete(r);
      viewStore.forget(Tab.ROOM, r);
      break;
  }
}
