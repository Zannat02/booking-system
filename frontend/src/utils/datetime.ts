const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;


export const toDhakaIso = (value: string): string => `${value}:00+06:00`;


export const toDhakaInputValue = (iso: string): string =>
  new Date(new Date(iso).getTime() + DHAKA_OFFSET_MS).toISOString().slice(0, 16);