import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/firebase/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlendWise Nutrition - Homemade Blenderized Tube Feeding Made Safe",
  description:
    "BlendWise empowers tube-fed individuals to safely prepare homemade blenderized tube feedings with expert RD guidance, automated meal planning, and grocery delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
