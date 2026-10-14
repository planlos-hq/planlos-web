export type SortOption<T> = {
  label: string;
  comparator: (a: T, b: T) => number;
};
