import type { StudyGroupTemplateApiData, TemplateCourseAssignment } from "@/api/types";
import { mapApiTemplate } from "@/api/util";
import { useTemplateStore } from "@/stores/templateStore";
import type { UpdateOperation } from "./types.updates";
import { useCourseStore } from "@/stores/courseStore";

export function handleStudyGroupTemplate(
  operation: UpdateOperation,
  data: StudyGroupTemplateApiData | number
) {
  const templateStore = useTemplateStore();
  let apiTemplate: StudyGroupTemplateApiData | number;
  switch (operation) {
    case "create":
      apiTemplate = data as StudyGroupTemplateApiData;
      const exists = templateStore.templateMap.get(apiTemplate.id);
      if (exists) {
        return;
      }
      templateStore.templateMap.set(apiTemplate.id, mapApiTemplate(apiTemplate, []));
      break;
    case "update":
      apiTemplate = data as StudyGroupTemplateApiData;
      const oldTemplate = templateStore.templateMap.get(apiTemplate.id);

      if (!oldTemplate) return;
      if (apiTemplate.name === undefined) return;

      oldTemplate.name = apiTemplate.name;

      break;
    case "delete":
      apiTemplate = data as number;
      templateStore.templateMap.delete(apiTemplate);
      break;
  }
}

//Zuweisung einer Veranstaltung zu einem Template
export function handleStudyGroupTemplateCourse(
  operation: UpdateOperation,
  data: TemplateCourseAssignment
) {
  const templateStore = useTemplateStore();
  const courseStore = useCourseStore();

  const template = templateStore.templateMap.get(data.template);
  const course = courseStore.courseMap.get(data.course);

  if (!template || !course) {
    return;
  }
  const index = template.courses.findIndex(c => c.id === course.id);

  switch (operation) {
    case "create":
      if (index !== -1) {
        return;
      }
      template.courses.push(course);
      break;
    case "delete":
      if (index === -1) {
        return;
      }
      template.courses.splice(index, 1);
      break;
  }
}
