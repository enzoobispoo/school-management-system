import { cookies } from "next/headers";

export async function getServerTheme() {
  const cookieStore = await cookies();

  const theme = cookieStore.get("theme")?.value;
  const density = cookieStore.get("density")?.value;

  return {
    theme: theme === "dark" ? "dark" : "light",
    density: density === "compact" ? "compact" : "comfortable",
  };
}