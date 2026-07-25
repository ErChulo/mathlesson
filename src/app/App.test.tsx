import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { App } from './App';
import { storageKeys } from './persistence';

describe('App shell', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-motion');
  });

  it('renders the shell without mounting deferred learner and export code', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Framework Demo shell' })).toBeInTheDocument();
    expect(screen.getByText(/Phase 2 mounts only approved adapter slices here/i)).toBeInTheDocument();
    expect(screen.getByText(/v4.9.22 baseline preserved/i)).toBeInTheDocument();
  });

  it('mounts the KaTeX adapter in the renderer placeholder panel', async () => {
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Renderers' }));

    expect(await screen.findByRole('heading', { name: 'Renderer container boundary' })).toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector('[data-source-id="phase-2-katex-demo-display"] .katex-display')).toBeInTheDocument();
    });
  });

  it('persists theme and layout using baseline-compatible keys', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /Theme: dark/i }));
    fireEvent.click(screen.getByRole('button', { name: /Sidebar: expanded/i }));
    fireEvent.click(screen.getByRole('button', { name: /Wide content/i }));

    expect(window.localStorage.getItem(storageKeys.theme)).toBe('"light"');
    expect(window.localStorage.getItem(storageKeys.layout)).toBe(JSON.stringify({ sidebar: 'collapsed', wide: true }));
  });

  it('switches lessons and stores active panel per lesson', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Lesson'), { target: { value: 'audit' } });

    expect(screen.getByRole('heading', { name: 'Phase 0 audit placeholder' })).toBeInTheDocument();
    expect(window.localStorage.getItem(storageKeys.lesson)).toBe('"audit"');
    expect(window.localStorage.getItem(storageKeys.section('audit'))).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Phase Plan' }));
    expect(window.localStorage.getItem(storageKeys.section('audit'))).toBe('"phase-plan"');
  });

  it('persists advanced nav disclosure as the legacy raw value', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Advanced panels' }));

    expect(window.localStorage.getItem(storageKeys.advancedNavOpen)).toBe('1');
    expect(screen.getByRole('button', { name: 'Calculator' })).toBeInTheDocument();
  });
});
