import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ItineraryDetailPage from './ItineraryDetailPage';
import { makeItinerary, makeStop } from '../test/fixtures';

const api = vi.hoisted(() => ({
  get: (() => Promise.resolve({ data: {} })) as (id: number) => Promise<unknown>,
  deleted: [] as unknown[][],
}));
vi.mock('../services/api', () => ({
  itinerariesApi: {
    get: (id: number) => api.get(id),
    deleteStop: (...args: unknown[]) => { api.deleted.push(args); return Promise.resolve(); },
  },
  placesApi: { nearby: () => Promise.resolve({ data: { results: [] } }) },
}));
// Google Maps needs a browser and a key; the map has its own small surface.
vi.mock('../components/Itinerary/TripMap', () => ({
  default: ({ stops }: { stops: unknown[] }) => <div data-testid="trip-map">{stops.length} pins</div>,
}));

const stops = [
  makeStop({ id: 1, name: 'Mole Antonelliana', day: 1 }),
  makeStop({ id: 2, name: 'Museo Egizio', day: 1, category: 'museum' }),
  makeStop({ id: 3, name: 'Eataly Lingotto', day: 2, category: 'restaurant' }),
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/itineraries/7']}>
      <Routes>
        <Route path="/itineraries/:id" element={<ItineraryDetailPage />} />
        <Route path="/itineraries" element={<p>My trips list</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  api.deleted = [];
  api.get = () => Promise.resolve({ data: { itinerary: makeItinerary({ stops }) } });
});

describe('ItineraryDetailPage', () => {
  it('shows the trip with day 1 stops and every pin on the map', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Turin weekend' })).toBeInTheDocument();
    expect(screen.getByText('Mole Antonelliana')).toBeInTheDocument();
    expect(screen.getByText('Museo Egizio')).toBeInTheDocument();
    expect(screen.queryByText('Eataly Lingotto')).not.toBeInTheDocument();
    expect(screen.getByTestId('trip-map')).toHaveTextContent('3 pins');
  });

  it('switches to the day 2 stops', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('tab', { name: /Day 2/ }));
    expect(screen.getByText('Eataly Lingotto')).toBeInTheDocument();
    expect(screen.queryByText('Mole Antonelliana')).not.toBeInTheDocument();
  });

  it('removes a deleted stop from the list, the counts and the map', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Remove stop Museo Egizio' }));

    await waitFor(() => expect(screen.queryByText('Museo Egizio')).not.toBeInTheDocument());
    expect(api.deleted).toEqual([[7, 2]]);
    expect(screen.getByRole('tab', { name: /Day 1/ })).toHaveTextContent('(1)');
    expect(screen.getByText(/2 total stops/)).toBeInTheDocument();
    expect(screen.getByTestId('trip-map')).toHaveTextContent('2 pins');
  });

  it('opens the add-stop dialog', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Turin weekend' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Add stop' })[0]);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Nearby Pala Gianni Asti')).toBeInTheDocument();
  });

  it('goes back to the trip list when the trip cannot be loaded', async () => {
    api.get = () => Promise.reject(new Error('404'));
    renderPage();
    expect(await screen.findByText('My trips list')).toBeInTheDocument();
  });
});
