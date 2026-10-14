export type Room = {
  id: number;
  number: string;
  name: string;
  seats: number;
  extraData?: Record<string, string>;
};
