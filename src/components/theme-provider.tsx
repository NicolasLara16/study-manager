"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeChoice = "light" | "dark" | "system";
export type AppliedTheme = "light" | "dark";

const STORAGE_KEY = "study-manager-theme";

interface ThemeContextValue {
  /** Tema efetivamente aplicado (resolvido) */
  theme: AppliedTheme;
  /** Escolha do usuário (inclui "system") */
  choice: ThemeChoice;
  setChoice: (choice: ThemeChoice) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  choice: "system",
  setChoice: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>("system");
  const [theme, setTheme] = useState<AppliedTheme>("light");
  const [mounted, setMounted] = useState(false);

  const resolve = useCallback((c: ThemeChoice): AppliedTheme => {
    if (c !== "system") return c;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setChoiceState(stored);
      setTheme(resolve(stored));
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
    }
    setMounted(true);
  }, [resolve]);

  /* Aplica a classe e persiste */
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, choice);
  }, [theme, choice, mounted]);

  /* "Sistema" acompanha o SO em tempo real */
  useEffect(() => {
    if (!mounted || choice !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [choice, mounted]);

  const setChoice = useCallback(
    (c: ThemeChoice) => {
      setChoiceState(c);
      setTheme(resolve(c));
    },
    [resolve]
  );

  const toggleTheme = useCallback(() => {
    setChoiceState((prev) => {
      const next = resolve(prev) === "dark" ? "light" : "dark";
      setTheme(next);
      return next;
    });
  }, [resolve]);

  return (
    <ThemeContext.Provider value={{ theme, choice, setChoice, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
