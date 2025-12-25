import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://farri.ai"),
  title: "Farri.ai",
  description:
    "An interactive demo for developers to try text-to-speech using the OpenAI API",
  authors: [{ name: "Farri.ai" }],
  openGraph: {
    title: "Farri.ai",
    description:
      "An interactive demo for developers to try text-to-speech using the OpenAI API",
    images: [
      {
        url: "/og.png",
        alt: "Farri.ai, a text-to-speech demo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
