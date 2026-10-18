import type { UpdateOperation } from "./types.updates";
import { useDegreeProgramStore } from "@/stores/degreeProgramStore";
import type { DegreeProgramApiData } from "@/api/types";
import { mapApiDegreeProgram } from "@/api/util";
import { useViewStore } from "@/stores/viewStore";
import { Tab } from "@/enums/enums";

export function handleDegreeProgram(
  operation: UpdateOperation,
  data: DegreeProgramApiData | number
) {
  let d;
  const degreeProgramStore = useDegreeProgramStore();
  const viewStore = useViewStore();
  switch (operation) {
    case "create":
      d = data as DegreeProgramApiData;
      degreeProgramStore.degreeProgramMap.set(d.id, mapApiDegreeProgram(d));
      break;
    case "update":
      d = data as DegreeProgramApiData;
      const oldResource = degreeProgramStore.degreeProgramMap.get(d.id);
      if (!oldResource) {
        return;
      }
      Object.assign(oldResource, mapApiDegreeProgram(d));
      break;
    case "delete":
      d = data as number;
      degreeProgramStore.degreeProgramMap.delete(d);
      viewStore.forget(Tab.DEGREEPROGRAM, d);
      break;
  }
}
