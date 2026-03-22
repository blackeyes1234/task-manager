export const THEME_STORAGE_KEY = "task-manager-theme";

export type ThemePreference = "light" | "dark";

/**
 * Inline script for root layout: applies `dark` on `<html>` before paint.
 * Uses stored preference when set; otherwise follows `prefers-color-scheme`.
 */
export function getThemeInitScript(): string {
  const key = JSON.stringify(THEME_STORAGE_KEY);
  return `!function(){try{var k=${key},s=localStorage.getItem(k),r=document.documentElement;if(s==="dark")r.classList.add("dark");else if(s==="light")r.classList.remove("dark");else if(window.matchMedia("(prefers-color-scheme: dark)").matches)r.classList.add("dark");else r.classList.remove("dark")}catch(e){}}();`;
}
