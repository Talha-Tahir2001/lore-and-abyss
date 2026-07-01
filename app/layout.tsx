import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { Metadata } from "next";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: "Lore & Abyss",
  description: "Lore & Abyss: An AI-powered narrative RPG engine",
  icons: {
    // icon: "/lore-and-abyss-icon.jpg",
    // icon: "/lore-and-abyss-main-icon.png",
    icon: "/lore-and-abyss-main-icon-2.png",
    // icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💀</text></svg>',
  },
  keywords: ["rpg", "narrative", "ai", "engine", "game", "ttrpg", "roleplay", "interactive story", "storytelling", "lore", "adventure"],
  authors: [{ name: "Talha" }],
  creator: "Talha",
  openGraph: {
    title: "Lore & Abyss",
    description: "An AI-powered narrative RPG engine",
    url: "https://lore-and-abyss.vercel.app",
    siteName: "Lore & Abyss",
    locale: "en_US",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontSans.variable, "font-mono", jetbrainsMono.variable)}
    >
      <body>
        <ClerkProvider>
          <ThemeProvider>
            <Navbar />
            {children}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
