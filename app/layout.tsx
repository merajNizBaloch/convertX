import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PNG to JPG Converter — Free & Private",
  description: "Convert PNG images to JPG directly in your browser. Fast, free, and private.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
