export type AppTheme = "light" | "dark";
export type AppDensity = "comfortable" | "compact";

export function applyAppearance(theme: AppTheme, density: AppDensity) {
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.setAttribute("data-density", density);
  root.style.colorScheme = theme;
}