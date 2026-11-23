import type { AdminPlace } from '../types';

/** Categories an admin can give a curated place, with their display labels. */
export const CATEGORY_OPTIONS: { value: AdminPlace['category']; label: string }[] = [
  { value: 'tourist_attraction', label: '🏛️ Attraction' },
  { value: 'restaurant',         label: '🍽️ Restaurant' },
  { value: 'lodging',            label: '🏨 Hotel' },
  { value: 'museum',             label: '🖼️ Museum' },
];
