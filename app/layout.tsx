import type { Metadata } from "next";
import "./globals.css";
import "./retro-theme.css";
import "./social-overrides.css";
import SocialLinks from "./social-links";
import ThemeToggle from "./theme-toggle";

const siteUrl = "https://convertx.techcraftsolution.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ConvertX — Free Online Image & PDF Converter",
    template: "%s | ConvertX",
  },
  description:
    "Convert PNG, JPG, WEBP and PDF files online for free. ConvertX processes files directly in your browser with no account and no file upload required.",
  applicationName: "ConvertX",
  generator: "Next.js",
  keywords: [
    "PNG to JPG converter",
    "JPG to PNG converter",
    "WEBP to JPG converter",
    "JPG to WEBP converter",
    "image compressor",
    "image resizer",
    "image to PDF",
    "PDF to JPG",
    "PDF to PNG",
    "merge PDF",
    "split PDF",
    "free online file converter",
  ],
  authors: [{ name: "ConvertX" }],
  creator: "ConvertX",
  publisher: "ConvertX",
  category: "Utilities",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "ConvertX",
    title: "ConvertX — Free Online Image & PDF Converter",
    description:
      "Free PNG, JPG, WEBP and PDF conversion in your browser. Fast, private and no account required.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ConvertX — Free Online Image & PDF Converter" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ConvertX — Free Online Image & PDF Converter",
    description:
      "Convert images and PDFs for free directly in your browser.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SocialLinks />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
