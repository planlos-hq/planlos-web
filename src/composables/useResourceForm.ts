import { ref, watch } from "vue";

/**
 * Generisches Composable, das Formularfelder ausfüllt, Änderungen erkennt und Änderungen in einen Piniastore speichert.
 *
 * @param selectedResource - Aktuell ausgewählte Resource
 * @param attributes - Funktion, die alle Attribute einer Resource übergibt. Muss für Reaktivität eine Funktion sein. Array allein reicht nicht.
 * @param updateItem - Funktion, die angibt, wie eine Resource geupdatet werden soll.
 * @param createItem - Funktion, die spezifisch für die Erstellung einer Resource ist.
 * @param selectItem - Funktion, die spezifisch zur Auswahl einer Resource ist.
 * @param deleteItem - Funktion, die spezifisch eine Resource löscht.
 */
export function useResourceForm<T extends { id: number }>(
  selectedResource: () => T | null | undefined,
  attributes: () => (keyof Omit<T, "id">)[],
  updateItem: (id: number, updates: Partial<Omit<T, "id">>) => void,
  createItem: (item: Omit<T, "id">) => void,
  selectItem: (id: number | null) => void,
  deleteItem: (id: number) => void
) {
  /**
   * Wertzuweisung
   */
  const formData = ref<Partial<Omit<T, "id">>>({});

  /**
   * Daten sollen sich in Inputfeldern ändern, wenn eine andere Ressource ausgewählt wurde.
   * Daten werden kopiert, damit ursprüngliche Werte der Felder wiederhergestellt werden können.
   */
  watch(
    [() => selectedResource(), () => attributes()],
    ([newItem, newFields]) => {
      const freshData: Partial<Omit<T, "id">> = {};

      if (Array.isArray(newFields)) {
        newFields.forEach(field => {
          freshData[field] = copyValue(newItem?.[field]);
        });
      }
      formData.value = freshData;
    },
    { immediate: true, deep: true }
  );

  /**
   * Wurden Änderungen an der Ressource getätigt, werden diese im Store gespeichert.
   */
  function update() {
    const selectedItem = selectedResource();
    if (!selectedItem) return;

    const updates: Partial<Omit<T, "id">> = {};

    attributes().forEach(field => {
      if (formData.value[field] !== selectedItem[field]) {
        updates[field] = formData.value[field];
      }
    });

    if (Object.keys(updates).length > 0) {
      updateItem(selectedItem.id, updates);
    }
  }

  /**
   * Fügt eine neue Ressource hinzu.
   */
  function create() {
    const newItem = { ...formData.value } as Omit<T, "id">;

    createItem(newItem);

    formData.value = {};
  }

  /**
   * Setzt Werte zurück, falls Änderungen nicht übernommen werden sollen.
   */
  function cancel() {
    const selectedItem = selectedResource();
    attributes().forEach(field => {
      formData.value[field] = copyValue(selectedItem?.[field]);
    });
  }

  /**
   * Erstellt eine Kopie eines Wertes.
   *
   * - Arrays werden zu neuen Arrays kopiert
   * - Objekte werden zu neuen Objekten kopiert
   * - Primitive Werte (string, number, boolean, null, undefined) werden direkt zurückgegeben
   *
   * @param value - Der Wert, der kopiert werden soll
   * @returns Eine neue Kopie des Wertes (flach)
   */
  function copyValue<T>(value: T): T {
    if (Array.isArray(value)) {
      //für jedes Element im Array ein neues Objekt erstellen
      return value.map(v => {
        if (typeof v === "object" && v !== null) {
          return { ...v };
        }
        return v;
      }) as T;
    }
    if (typeof value === "object" && value !== null) {
      return { ...value };
    }
    return value;
  }

  /**
   * Prüft, ob ein Item bereits in einer Liste enthalten ist.
   * Verwendung in Kombination mit Komponente 'DropdownWithSearch.vue'.
   *
   * @param item - Das zu prüfende Objekt, muss ein id-Feld haben
   * @param list - Die Liste, in der geprüft werden soll (kann undefined sein)
   * @returns true, wenn ein Item mit derselben id in der Liste existiert, sonst false
   */
  function isItemSelected<T extends { id: number }>(item: T, list: T[] | undefined) {
    const actualList = list ?? [];
    const exists = actualList.some(listItem => listItem.id === item.id);
    return exists;
  }

  /**
   * Wählt ein Item bei einem mehrfach Select aus.
   * Verwendung in Kombination mit Komponente 'DropdownWithSearch.vue'.
   *
   * @param itemId - ID des zu toggelnden Items
   * @param listName - Name der Liste in formData ("lecturers", "rooms", "studyGroups")
   * @param getItem - Funktion, um das Item anhand der ID aus dem Store zu holen
   * @returns - boolean, ob ein Item hinzugefügt wurde. True = neu gewählt / False = aus Auswahl entfernt
   */
  function toggleItem<T extends { id: number }>(
    itemId: number,
    listName: keyof typeof formData.value,
    getItem: (id: number) => T | undefined
  ) {
    const list = (formData.value[listName] ?? []) as T[];
    const index = list.findIndex(i => i.id === itemId);

    let added = false;
    let newList: T[];
    if (index === -1) {
      const item = getItem(itemId);
      if (item) {
        newList = [...list, { ...item }];
        added = true;
      } else {
        newList = [...list];
      }
    } else {
      newList = list.filter(i => i.id !== itemId);
      added = false;
    }

    formData.value[listName] = newList;
    return added;
  }

  /**
   * Dient dazu, die ausgewählte Resource zu löschen.
   */

  function deleteResource() {
    const selectedItem = selectedResource();
    if (!selectedItem) {
      return;
    }

    deleteItem(selectedItem.id);
    selectItem(null);
  }

  return {
    formData,
    update,
    cancel,
    isItemSelected,
    toggleItem,
    create,
    deleteResource,
  };
}
