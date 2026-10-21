import type { Metadata, Viewport } from "next";
import { Manrope, Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Stokka",
    default: "Stokka — Business Management",
  },
  description:
    "The all-in-one business management platform for modern businesses. POS, inventory, customers, expenses, and analytics in one place.",
  manifest: "/manifest.json",
  icons: {
    icon: "/stokka-icon.svg",
    apple: "/stokka-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stokka",
  },
};

export const viewport: Viewport = {
  themeColor: "#F2542D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${body.variable} ${display.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
