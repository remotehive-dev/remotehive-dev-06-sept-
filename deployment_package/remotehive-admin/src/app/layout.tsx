import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
// import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { cn } from "@/lib/utils";
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
  title: "RemoteHive Admin Panel",
  description: "Administrative dashboard for RemoteHive job platform",
  keywords: ['admin', 'dashboard', 'remote work', 'job board', 'management'],
  authors: [{ name: 'RemoteHive Team' }],
  robots: 'noindex, nofollow', // Admin panel should not be indexed
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable}`,
          'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
          'dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',
          'antialiased overflow-x-hidden'
        )}
      >
        <div className="light">
          <AuthProvider>
            <ToastProvider>
              <div className="relative min-h-screen">
                {/* Background decorative elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/20 to-blue-600/20 rounded-full blur-3xl" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-full blur-3xl" />
                </div>
                
                {/* Main content */}
                <div className="relative z-10">
                  {children}
                </div>
              </div>
            </ToastProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
