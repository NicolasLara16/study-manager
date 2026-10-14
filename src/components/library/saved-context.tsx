"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "study-manager-saved-materials";

interface SavedContextValue {
  savedIds: Set<string>;
  isSaved: (id: string) => boolean;
  /** Alterna o estado e retorna o novo estado (true = salvo) */
  toggleSave: (id: string) => boolean;
}

const SavedContext = createContext<SavedContextValue>({
  savedIds: new Set(),
  isSaved: () => false,
  toggleSave: () => false,
});

export function SavedMaterialsProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* localStorage indisponível — modo demonstração em memória */
    }
  }, []);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  const toggleSave = useCallback(
    (id: string) => {
      const next = new Set(savedIds);
      const nowSaved = !next.has(id);
      if (nowSaved) next.add(id);
      else next.delete(id);
      setSavedIds(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        /* ignora indisponibilidade */
      }
      return nowSaved;
    },
    [savedIds]
  );

  return (
    <SavedContext.Provider value={{ savedIds, isSaved, toggleSave }}>
      {children}
    </SavedContext.Provider>
  );
}

export function useSavedMaterials() {
  return useContext(SavedContext);
}
