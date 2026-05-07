import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Evita que o Turbopack use `~/package-lock.json` como raiz quando há outro lockfile em $HOME. */
const turbopackRoot = __dirname;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: turbopackRoot,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 400,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/prisma/migrations/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
