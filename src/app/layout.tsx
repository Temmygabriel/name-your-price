import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Name Your Price",
  description: "Think you know what things cost? Prove it. AI is the judge.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
