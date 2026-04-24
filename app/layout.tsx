import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerAppearance } from "@/lib/theme/get-server-appearance";
import { Inter, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "EduGestão - Sistema de Gestão Escolar",
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
  const settings = await prisma.escolaSettings.findFirst();

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
        {children}
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}