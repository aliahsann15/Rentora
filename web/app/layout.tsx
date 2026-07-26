import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rentora",
  description: "Property operations for landlords, tenants, and vendors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="preload" href="/bg.png" as="image" />
      </head>
      <body className="min-h-full">
        {/* <Header /> */}
        <main>
          {children}
        </main>

      </body>
    </html>
  );
}
