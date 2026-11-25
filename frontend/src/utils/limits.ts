/** Text limits enforced by the API (backend/src/utils/limits.ts). */
export const MAX_LENGTH = {
  username: 40,
  email: 254,
  itineraryTitle: 120,
  notes: 2000,
  stopName: 200,
  address: 300,
  city: 100,
  teamName: 120,
  shortName: 40,
  league: 60,
  country: 60,
  arenaName: 200,
  url: 2048,
} as const;

/** `slotProps` for an MUI TextField that caps input at `max` characters. */
export const maxLengthProps = (max: number) => ({ htmlInput: { maxLength: max } });
