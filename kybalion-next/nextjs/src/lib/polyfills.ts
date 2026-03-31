/**
 * Performance API Polyfill & Guard
 *
 * The runtime fix is injected in layout.tsx with a beforeInteractive script.
 * This module stays intentionally small and type-safe so the project builds
 * cleanly and app code can still access a safe wrapper when needed.
 */

type PerfMark = (name: string) => void;
type PerfClearMarks = (name?: string) => void;
type PerfMeasure = (name: string, startMark?: string, endMark?: string) => void;
type PerfClearMeasures = (name?: string) => void;
type PerfEntriesByName = (name: string, type?: string) => PerformanceEntry[];
type PerfEntriesByType = (type: string) => PerformanceEntry[];

interface SafePerformanceAPI {
  mark: PerfMark;
  clearMarks: PerfClearMarks;
  measure: PerfMeasure;
  clearMeasures: PerfClearMeasures;
  getEntriesByName: PerfEntriesByName;
  getEntriesByType: PerfEntriesByType;
}

type MutablePerformance = Performance & {
  mark?: PerfMark;
  clearMarks?: PerfClearMarks;
  measure?: PerfMeasure;
  clearMeasures?: PerfClearMeasures;
  getEntriesByName?: PerfEntriesByName;
  getEntriesByType?: PerfEntriesByType;
};

const noopMark: PerfMark = () => {};
const noopClearMarks: PerfClearMarks = () => {};
const noopMeasure: PerfMeasure = () => {};
const noopClearMeasures: PerfClearMeasures = () => {};
const noopEntriesByName: PerfEntriesByName = () => [];
const noopEntriesByType: PerfEntriesByType = () => [];

function createNoOpPerformance(): SafePerformanceAPI {
  return {
    mark: noopMark,
    clearMarks: noopClearMarks,
    measure: noopMeasure,
    clearMeasures: noopClearMeasures,
    getEntriesByName: noopEntriesByName,
    getEntriesByType: noopEntriesByType,
  };
}

function defineMethod(
  target: MutablePerformance,
  key: keyof MutablePerformance,
  fallback: (...args: never[]) => unknown,
): void {
  if (typeof target[key] === 'function') {
    return;
  }

  try {
    Object.defineProperty(target, key, {
      configurable: true,
      writable: true,
      value: fallback,
    });
  } catch {
    // Ignore assignment failures on locked-down browser objects.
  }
}

export function initPerformancePolyfills(): void {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  const perf = window.performance as MutablePerformance;

  defineMethod(perf, 'mark', noopMark);
  defineMethod(perf, 'clearMarks', noopClearMarks);
  defineMethod(perf, 'measure', noopMeasure);
  defineMethod(perf, 'clearMeasures', noopClearMeasures);
  defineMethod(perf, 'getEntriesByName', noopEntriesByName);
  defineMethod(perf, 'getEntriesByType', noopEntriesByType);
}

export function getPerformanceAPI(): SafePerformanceAPI {
  if (typeof window === 'undefined' || !window.performance) {
    return createNoOpPerformance();
  }

  initPerformancePolyfills();
  const perf = window.performance as MutablePerformance;

  return {
    mark: perf.mark ?? noopMark,
    clearMarks: perf.clearMarks ?? noopClearMarks,
    measure: perf.measure ?? noopMeasure,
    clearMeasures: perf.clearMeasures ?? noopClearMeasures,
    getEntriesByName: perf.getEntriesByName ?? noopEntriesByName,
    getEntriesByType: perf.getEntriesByType ?? noopEntriesByType,
  };
}

export function usePerformancePolyfill(): void {
  initPerformancePolyfills();
}
