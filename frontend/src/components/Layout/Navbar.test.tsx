import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

vi.mock('../../context/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'alice', email: 'alice@example.com', is_admin: false, is_active: true },
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('Navbar accessibility', () => {
  it('exposes the account menu button by name and its expanded state', () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);

    const button = screen.getByRole('button', { name: 'Account menu for alice' });
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).not.toHaveAttribute('aria-expanded');

    act(() => button.click());
    expect(button).toHaveAttribute('aria-expanded', 'true');
    // aria-controls points at the menu's container, which holds the role="menu" list.
    expect(button).toHaveAttribute('aria-controls', 'account-menu');
    expect(document.getElementById('account-menu')).toContainElement(screen.getByRole('menu'));
  });
});
