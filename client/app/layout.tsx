import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignIn,
  SignInButton,
  SignUp,
  SignUpButton,
  SignedIn,
  SignedOut,
  
 } from '@clerk/nextjs'

import { ThemeProvider } from "@/components/theme-provider"

import { SidebarProvider,SidebarTrigger } from "@/components/ui/sidebar"
import {AppSidebar} from "@/components/app-sidebar"

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatWithPDF",
  description: "Learning Made Simple.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <ClerkProvider>
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SidebarProvider>
         
        <section className="min-h-screen min-w-screen flex  ">  
          <div className=" items-center justify-center flex flex-col w-full h-screen">
           <SignedOut>
              <SignUp/>
           </SignedOut>
          </div>
           <SignedIn>
               {children}
               <AppSidebar/>
           </SignedIn>
        </section>
     </SidebarProvider>
     </ThemeProvider>
    </body>
    </html>
   </ClerkProvider>
  );
}
// use it later <SidebarTrigger/>