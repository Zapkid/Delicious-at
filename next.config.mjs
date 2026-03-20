import path from "path";
import { fileURLToPath } from "url";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "192.168.50.242",
    "tastey.loca.lt",
    // ngrok (free tier uses *.ngrok-free.app; legacy *.ngrok.io)
    "*.ngrok-free.app",
    "*.ngrok.io",
  ],
  // Avoid Turbopack inferring the wrong workspace root when cwd is not the repo root (e.g. src/app).
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);
