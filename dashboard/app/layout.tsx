import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { CommandBar } from "@/components/command-bar";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShieldOps — AI Security Operations Center",
  description: "Multi-agent AI SOC powered by Archestra MCP Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${plusJakarta.variable} ${geistMono.variable} antialiased`}
        style={{ background: "#050505", color: "#fafaf9" }}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 ml-56 flex flex-col min-h-screen">
            <CommandBar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
