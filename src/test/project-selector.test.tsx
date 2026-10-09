import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsSection } from '@/components/canport/ProjectsSection';
import { projectsData } from '@/data/portfolioData';

const slider = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  let index = 0;
  const select = (next: number) => { index = next; listeners.forEach(fn => fn()); };
  return {
    reset: () => { index = 0; listeners.clear(); },
    selectedScrollSnap: () => index,
    scrollNext: vi.fn(() => select((index + 1) % 4)),
    scrollPrev: vi.fn(() => select((index + 3) % 4)),
    scrollTo: vi.fn((next: number) => select(next)),
    on: (event: string, callback: () => void) => { if (event === 'select') listeners.add(callback); },
    off: (event: string, callback: () => void) => { if (event === 'select') listeners.delete(callback); },
  };
});
vi.mock('embla-carousel-react', () => ({ default: () => [() => {}, slider] }));

describe('Project selector navigation', () => {
  let desktop = true;
  beforeEach(() => {
    slider.reset();
    vi.clearAllMocks();
    desktop = true;
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: query.includes('min-width: 640px') ? desktop
        : query.includes('max-width: 639px') ? !desktop : false,
      media: query, onchange: null, addListener() {}, removeListener() {},
      addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true,
    }));
    Object.defineProperty(HTMLElement.prototype, 'scrollBy', { configurable: true, value: vi.fn() });
  });
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('advances exactly one index and synchronizes 1 → 2 → 3 → 4 → 1 immediately', () => {
    const view = render(<ProjectsSection />);
    for (const expected of [1, 2, 3, 0]) {
      fireEvent.click(view.getByRole('button', { name: 'Projet suivant' }));
      expect(slider.selectedScrollSnap()).toBe(expected);
      const project = projectsData[expected];
      if (!project) throw new Error('Missing expected project');
      expect(view.getByRole('heading', { level: 3, name: project.title })).toBeInTheDocument();
    }
    expect(slider.scrollNext).toHaveBeenCalledTimes(4);
    expect(slider.scrollTo).not.toHaveBeenCalled();
  });

  it('reverses exactly one index and loops 1 → 4 → 3 → 2 → 1', () => {
    const view = render(<ProjectsSection />);
    for (const expected of [3, 2, 1, 0]) {
      fireEvent.click(view.getByRole('button', { name: 'Projet précédent' }));
      expect(slider.selectedScrollSnap()).toBe(expected);
      const project = projectsData[expected];
      if (!project) throw new Error('Missing expected project');
      expect(view.getByRole('heading', { level: 3, name: project.title })).toBeInTheDocument();
    }
    expect(slider.scrollPrev).toHaveBeenCalledTimes(4);
  });

  it('synchronizes direct project selection with the gallery index', () => {
    const view = render(<ProjectsSection />);
    const tab = view.container.querySelector('[data-copy="1"][data-project-id="suivi-taches"]');
    if (!tab) throw new Error('Missing project tab');
    fireEvent.click(tab);
    expect(slider.scrollTo).toHaveBeenCalledWith(1, false);
    expect(slider.selectedScrollSnap()).toBe(1);
  });

  it('preserves mobile centering without invoking desktop navigation below 640px', () => {
    desktop = false;
    const view = render(<ProjectsSection />);
    const tab = view.container.querySelector('[data-copy="1"][data-project-id="suivi-taches"]');
    if (!tab) throw new Error('Missing project tab');
    fireEvent.click(tab);
    expect(slider.scrollTo).not.toHaveBeenCalled();
    expect(slider.scrollNext).not.toHaveBeenCalled();
    expect(HTMLElement.prototype.scrollBy).toHaveBeenCalled();
  });
});
