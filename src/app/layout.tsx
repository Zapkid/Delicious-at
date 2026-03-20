import type { Metadata, Viewport } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "טעים ב | Ta'im Be",
  description:
    "Homemade food marketplace in southern Israel — fresh, local, homemade",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
