import { describe, it, expect } from 'vitest';
import { categoryForPlaceType, PLACE_TYPES } from './stopCategory';
import { tripMapCenter } from './tripMap';
import { CATEGORY_ICONS } from '../types';

describe('categoryForPlaceType', () => {
  it.each([
    ['tourist_attraction', 'attraction'],
    ['restaurant', 'restaurant'],
    ['lodging', 'lodging'],
    ['museum', 'museum'],
    ['cafe', 'other'],
    ['something_new', 'other'],
  ])('maps %s to %s', (type, category) => {
    expect(categoryForPlaceType(type)).toBe(category);
  });

  it('only produces categories that have an icon', () => {
    for (const t of PLACE_TYPES) expect(CATEGORY_ICONS[t.category]).toBeTruthy();
  });
});

describe('tripMapCenter', () => {
  const arena = { lat: 45, lng: 7 };

  it('centres on the arena when there are no stops', () => {
    expect(tripMapCenter(arena, [])).toEqual(arena);
  });

  it('centres on the average of the stops', () => {
    expect(tripMapCenter(arena, [{ lat: 10, lng: 20 }, { lat: 20, lng: 40 }])).toEqual({ lat: 15, lng: 30 });
  });
});
