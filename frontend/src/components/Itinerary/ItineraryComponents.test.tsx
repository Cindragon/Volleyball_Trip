import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StopCard from './StopCard';
import EditItineraryDialog from './EditItineraryDialog';
import AddStopDialog from './AddStopDialog';
import { MAX_LENGTH } from '../../utils/limits';
import { apiError, makeItinerary, makeStop } from '../../test/fixtures';

// Plain functions (not vi.fn) return the promises, so a rejection the
// component handles is never reported as unhandled. `calls` records arguments.
const api = vi.hoisted(() => ({
  calls: [] as { fn: string; args: unknown[] }[],
  respond: {} as Record<string, (...args: unknown[]) => Promise<unknown>>,
}));
vi.mock('../../services/api', () => {
  const call = (fn: string) => (...args: unknown[]) => {
    api.calls.push({ fn, args });
    return (api.respond[fn] ?? (() => Promise.resolve({ data: {} })))(...args);
  };
  return {
    itinerariesApi: {
      update: call('update'),
      addStop: call('addStop'),
      updateStop: call('updateStop'),
      deleteStop: call('deleteStop'),
    },
    placesApi: { nearby: call('nearby') },
  };
});

const callsTo = (fn: string) => api.calls.filter(c => c.fn === fn).map(c => c.args);

beforeEach(() => { api.calls = []; api.respond = {}; });

describe('StopCard', () => {
  it('saves edited notes and reports the updated stop', async () => {
    const stop = makeStop({ id: 4 });
    api.respond.updateStop = () => Promise.resolve({ data: { stop: { ...stop, notes: 'Go early' } } });
    const onUpdated = vi.fn();
    render(<StopCard stop={stop} itineraryId={7} onDeleted={vi.fn()} onUpdated={onUpdated} />);

    fireEvent.click(screen.getByRole('button', { name: `Edit notes for ${stop.name}` }));
    const input = screen.getByPlaceholderText('Add notes…');
    expect(input).toHaveAttribute('maxLength', String(MAX_LENGTH.notes));
    fireEvent.change(input, { target: { value: 'Go early' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ notes: 'Go early' })));
    expect(callsTo('updateStop')).toEqual([[7, 4, { notes: 'Go early' }]]);
  });

  it('removes the stop', async () => {
    const onDeleted = vi.fn();
    render(<StopCard stop={makeStop({ id: 4 })} itineraryId={7} onDeleted={onDeleted} onUpdated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Remove stop/ }));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(4));
    expect(callsTo('deleteStop')).toEqual([[7, 4]]);
  });

  it('keeps the stop and shows the error when removal fails', async () => {
    api.respond.deleteStop = () => Promise.reject(apiError(500, 'Database unavailable'));
    const onDeleted = vi.fn();
    render(<StopCard stop={makeStop()} itineraryId={7} onDeleted={onDeleted} onUpdated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Remove stop/ }));
    expect(await screen.findByText('Database unavailable')).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});

describe('EditItineraryDialog', () => {
  it('limits field lengths and saves the changes', async () => {
    const itinerary = makeItinerary();
    api.respond.update = () => Promise.resolve({ data: { itinerary: { ...itinerary, title: 'Turin trip' } } });
    const onSaved = vi.fn();
    const onClose = vi.fn();
    render(<EditItineraryDialog itinerary={itinerary} open onClose={onClose} onSaved={onSaved} />);

    const title = screen.getByLabelText('Title');
    expect(title).toHaveAttribute('maxLength', String(MAX_LENGTH.itineraryTitle));
    expect(screen.getByLabelText('Notes')).toHaveAttribute('maxLength', String(MAX_LENGTH.notes));

    fireEvent.change(title, { target: { value: 'Turin trip' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ title: 'Turin trip' }));
    expect(callsTo('update')).toEqual([[7, { title: 'Turin trip', visit_date: '2026-12-05', notes: 'Bring the scarf' }]]);
  });

  it('stays open and shows the API error', async () => {
    api.respond.update = () => Promise.reject(apiError(400, 'title must be at most 120 characters'));
    const onClose = vi.fn();
    render(<EditItineraryDialog itinerary={makeItinerary()} open onClose={onClose} onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('title must be at most 120 characters')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('AddStopDialog', () => {
  const place = {
    place_id: 'g-1', name: 'Caffè Torino', address: 'Piazza San Carlo', lat: 45.06, lng: 7.68,
    types: ['cafe'], photo_reference: 'photo-ref-123',
  };

  it('searches near the arena and adds a place to the chosen day', async () => {
    api.respond.nearby = () => Promise.resolve({ data: { results: [place], status: 'OK' } });
    api.respond.addStop = () => Promise.resolve({ data: { stop: makeStop({ id: 9, name: place.name, day: 2 }) } });
    const onAdded = vi.fn();
    render(<AddStopDialog itinerary={makeItinerary()} open onClose={vi.fn()} onAdded={onAdded} />);

    // Switch to cafés: the dialog searches again with the new type.
    fireEvent.click(screen.getByText(/Cafés/));
    await screen.findByText(place.name);
    expect(callsTo('nearby').at(-1)).toEqual([
      { lat: 45.04, lng: 7.65, type: 'cafe', radius: 3000, city: 'Torino' },
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Day 2' }));
    fireEvent.click(screen.getByRole('button', { name: '+ Add' }));

    await waitFor(() => expect(onAdded).toHaveBeenCalledWith(expect.objectContaining({ id: 9 })));
    expect(callsTo('addStop')).toEqual([[7, expect.objectContaining({
      place_id: 'g-1', name: place.name, category: 'other', day: 2, photo_reference: 'photo-ref-123',
    })]]);
  });

  it('shows the error when the stop limit is reached', async () => {
    api.respond.nearby = () => Promise.resolve({ data: { results: [place], status: 'OK' } });
    api.respond.addStop = () => Promise.reject(apiError(409, 'An itinerary can have at most 50 stops'));
    render(<AddStopDialog itinerary={makeItinerary()} open onClose={vi.fn()} onAdded={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: '+ Add' }));
    expect(await screen.findByText('An itinerary can have at most 50 stops')).toBeInTheDocument();
  });
});
