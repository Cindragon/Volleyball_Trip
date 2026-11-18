import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChangePasswordPage from './ChangePasswordPage';

// `calls` records arguments; `respond` decides the outcome per test. A plain
// function (not vi.fn) returns the promise, so a rejection the page handles is
// never seen by the spy machinery as unhandled.
const api = vi.hoisted(() => ({
  calls: [] as unknown[],
  respond: (() => Promise.resolve()) as () => Promise<unknown>,
}));
vi.mock('../services/api', () => ({
  authApi: { changePassword: (body: unknown) => { api.calls.push(body); return api.respond(); } },
}));

function fill(current: string, next: string, confirm: string) {
  fireEvent.change(screen.getByLabelText(/Current password/i), { target: { value: current } });
  fireEvent.change(screen.getByLabelText(/^New password/i), { target: { value: next } });
  fireEvent.change(screen.getByLabelText(/Confirm new password/i), { target: { value: confirm } });
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
}

beforeEach(() => { api.calls = []; api.respond = () => Promise.resolve(); });

describe('ChangePasswordPage', () => {
  it('blocks passwords shorter than 8 characters without calling the API', async () => {
    render(<ChangePasswordPage />);
    fill('old-password', 'short', 'short');
    expect(await screen.findByText(/at least 8 characters\./i)).toBeInTheDocument();
    expect(api.calls).toHaveLength(0);
  });

  it('blocks mismatched confirmation', async () => {
    render(<ChangePasswordPage />);
    fill('old-password', 'brand-new-pass', 'brand-new-typo');
    expect(await screen.findByText('The new passwords do not match.')).toBeInTheDocument();
    expect(api.calls).toHaveLength(0);
  });

  it('submits and confirms success', async () => {
    render(<ChangePasswordPage />);
    fill('old-password', 'brand-new-pass', 'brand-new-pass');

    expect(await screen.findByText(/Password updated/)).toBeInTheDocument();
    expect(api.calls).toEqual([{ current_password: 'old-password', new_password: 'brand-new-pass' }]);
    await waitFor(() => expect(screen.getByLabelText(/Current password/i)).toHaveValue(''));
  });

  it('shows the API error for a wrong current password', async () => {
    // Shaped like an axios error (what getErrorMessage checks for).
    const forbidden = { isAxiosError: true, response: { status: 403, data: { error: 'Current password is incorrect' } } };
    api.respond = () => Promise.reject(forbidden);
    render(<ChangePasswordPage />);
    fill('wrong-password', 'brand-new-pass', 'brand-new-pass');
    expect(await screen.findByText('Current password is incorrect')).toBeInTheDocument();
  });
});
