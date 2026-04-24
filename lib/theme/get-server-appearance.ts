import { cookies } from "next/headers";

export type AppTheme = "light" | "dark";
export type AppDensity = "comfortable" | "compact";

export async function getServerAppearance(): Promise<{
  theme: AppTheme;
  density: AppDensity;
}> {
  const cookieStore = await cookies();

  const themeCookie = cookieStore.get("theme")?.value;
  const densityCookie = cookieStore.get("density")?.value;

  return {
    theme: themeCookie === "dark" ? "dark" : "light",
    density: densityCookie === "compact" ? "compact" : "comfortable",
  };
}