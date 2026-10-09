import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsSection } from '@/components/canport/ProjectsSection';
import { projectsData } from '@/data/portfolioData';

describe('Desktop project selector', () => {
  let desktop = true;
  let moves: number[];
  beforeEach(() => {
    vi.useFakeTimers();
    moves = [];
    desktop = true;
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      setTimeout(() => callback(Date.now()), 16));
    vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('min-width: 640px') ? desktop
        : query.includes('max-width: 639px') ? !desktop : false,
      media: query, onchange: null, addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true,
    }));
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const copy = this.dataset['copy'];
      const index = projectsData.findIndex(p => p.id === this.dataset['projectId']);
      const left = copy === undefined ? 0 : (Number(copy) * 4 + index) * 300 - (this.parentElement?.scrollLeft ?? 0);
      return { left, right: left + 300, top: 0, bottom: 48, width: 300, height: 48, x: left, y: 0, toJSON() {} };
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value(options: ScrollToOptions) {
      this.scrollLeft = options.left ?? 0;
      moves.push(this.scrollLeft);
    } });
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', { configurable: true, value: vi.fn() });
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
  const finish = () => act(() => { vi.advanceTimersByTime(400); });

  it('moves one whole project and loops 1 → 2 → 3 → 4 → 1 via copy 2', () => {
    const view = render(<ProjectsSection />);
    expect(moves.at(-1)).toBe(1200);
    for (const expected of [1500, 1800, 2100]) {
      fireEvent.click(view.getByRole('button', { name: 'Projet suivant' }));
      finish();
      expect(moves.at(-1)).toBe(expected);
    }
    moves = [];
    fireEvent.click(view.getByRole('button', { name: 'Projet suivant' }));
    finish();
    expect(moves.at(-2)).toBe(2400);
    expect(moves.at(-1)).toBe(1200);
    expect(moves.some(left => left > 2100 && left < 2400)).toBe(true);
  });

  it('loops 1 → 4 → 3 → 2 → 1 via copy 0', () => {
    const view = render(<ProjectsSection />);
    moves = [];
    fireEvent.click(view.getByRole('button', { name: 'Projet précédent' }));
    finish();
    expect(moves.at(-2)).toBe(900);
    expect(moves.at(-1)).toBe(2100);
    expect(moves.some(left => left > 900 && left < 1200)).toBe(true);
    for (const expected of [1800, 1500, 1200]) {
      fireEvent.click(view.getByRole('button', { name: 'Projet précédent' }));
      finish();
      expect(moves.at(-1)).toBe(expected);
    }
  });

  it('aligns a directly selected project with the left edge of the central copy', () => {
    const view = render(<ProjectsSection />);
    const tab = view.container.querySelector('[data-copy="1"][data-project-id="suivi-taches"]');
    if (!tab) throw new Error('Missing project tab');
    fireEvent.click(tab);
    finish();
    expect(moves.at(-1)).toBe(1500);
  });

  it('does not run desktop scrolling below 640px', () => {
    desktop = false;
    const view = render(<ProjectsSection />);
    fireEvent.click(view.getByRole('button', { name: 'Projet suivant' }));
    finish();
    expect(moves).toEqual([]);
    expect(HTMLElement.prototype.scrollBy).toHaveBeenCalled();
  });
});