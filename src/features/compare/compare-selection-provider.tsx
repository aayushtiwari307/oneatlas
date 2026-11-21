"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  COMPARE_STORAGE_KEY,
  normalizeCompareSelection,
  removeCompareSelection,
  toggleCompareSelection,
  type CompareSelection,
} from "./compare-selection";

type CompareSelectionContextValue = {
  selections: CompareSelection[];
  ready: boolean;
  toggle: (model: CompareSelection) => void;
  remove: (slug: string) => void;
  clear: () => void;
  replace: (models: readonly CompareSelection[]) => void;
};

const CompareSelectionContext = createContext<CompareSelectionContextValue | null>(null);
const EMPTY_SNAPSHOT = "[]";
const SELECTION_CHANGE_EVENT = "oneatlas:compare-selection-change";
let memorySnapshot = EMPTY_SNAPSHOT;

function getSelectionSnapshot(): string {
  try {
    const stored = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    if (stored !== null) {
      memorySnapshot = stored;
      return stored;
    }
  } catch {
    // Continue with the in-memory copy when storage is blocked or unavailable.
  }
  return memorySnapshot;
}

function getServerSelectionSnapshot(): string {
  return EMPTY_SNAPSHOT;
}

function subscribeToSelectionChanges(onChange: () => void): () => void {
  function handleStorage(event: StorageEvent) {
    if (event.key !== COMPARE_STORAGE_KEY && event.key !== null) return;
    memorySnapshot = event.newValue ?? EMPTY_SNAPSHOT;
    onChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SELECTION_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SELECTION_CHANGE_EVENT, onChange);
  };
}

function parseSelectionSnapshot(snapshot: string): CompareSelection[] {
  try {
    return normalizeCompareSelection(JSON.parse(snapshot) as unknown);
  } catch {
    return [];
  }
}

function persistSelection(models: readonly CompareSelection[]): void {
  memorySnapshot = JSON.stringify(normalizeCompareSelection(models));
  try {
    window.localStorage.setItem(COMPARE_STORAGE_KEY, memorySnapshot);
  } catch {
    // Storage can be unavailable in private browsing; the in-memory selection still works.
  }
  window.dispatchEvent(new Event(SELECTION_CHANGE_EVENT));
}

export function CompareSelectionProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeToSelectionChanges,
    getSelectionSnapshot,
    getServerSelectionSnapshot,
  );
  const selections = useMemo(() => parseSelectionSnapshot(snapshot), [snapshot]);

  const toggle = useCallback((model: CompareSelection) => {
    persistSelection(toggleCompareSelection(parseSelectionSnapshot(getSelectionSnapshot()), model));
  }, []);
  const remove = useCallback((slug: string) => {
    persistSelection(removeCompareSelection(parseSelectionSnapshot(getSelectionSnapshot()), slug));
  }, []);
  const clear = useCallback(() => persistSelection([]), []);
  const replace = useCallback((models: readonly CompareSelection[]) => {
    persistSelection(normalizeCompareSelection(models));
  }, []);

  const value = useMemo(
    () => ({ selections, ready: true, toggle, remove, clear, replace }),
    [selections, toggle, remove, clear, replace],
  );

  return <CompareSelectionContext.Provider value={value}>{children}</CompareSelectionContext.Provider>;
}

export function useCompareSelection(): CompareSelectionContextValue {
  const context = useContext(CompareSelectionContext);
  if (!context) {
    throw new Error("useCompareSelection must be used inside CompareSelectionProvider");
  }
  return context;
}
