import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerAppearance } from "@/lib/theme/get-server-appearance";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { NavigationProgress } from "@/components/shared/navigation-progress";
import { SessionProvider } from "@/components/providers/session-provider";
import { PageTransition } from "@/components/shared/page-transition";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "EduGestão",
    template: "%s — EduGestão",
  },
  description: "Plataforma moderna e completa para gestão escolar",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { theme, density } = await getServerAppearance();
  // For SUPER_ADMIN or unauthenticated, use system defaults
  const settings = await prisma.escolaSettings.findFirst().catch(() => null);

  const primary = settings?.corPrimaria || "#111111";

  return (
    <html
      lang="pt-BR"
      className={theme === "dark" ? "dark" : ""}
      data-density={density}
      style={{
        colorScheme: theme,
        ["--brand-primary" as string]: primary,
        ["--brand-primary-foreground" as string]: "#ffffff",
      }}
      suppressHydrationWarning
    >
      <body className={`${inter.variable} font-sans antialiased`}>
        <NavigationProgress />
        <SessionProvider>
          <PageTransition>{children}</PageTransition>
        </SessionProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}