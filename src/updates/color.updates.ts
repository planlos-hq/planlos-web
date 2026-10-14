import type { UpdateOperation } from "./types.updates";
import type { Color } from "@/models/Color";
import { useColorStore } from "@/stores/colorStore";

export function handleColor(operation: UpdateOperation, data: Color | number) {
  let c;
  const colorStore = useColorStore();
  switch (operation) {
    case "create":
      c = data as Color;
      colorStore.colorMap.set(c.id, c);
      break;
    case "update":
      c = data as Color;
      const oldColor = colorStore.colorMap.get(c.id);
      if (!oldColor) {
        return;
      }
      Object.assign(oldColor, c);
      break;
    case "delete":
      c = data as number;
      colorStore.colorMap.delete(c);
      break;
  }
}
