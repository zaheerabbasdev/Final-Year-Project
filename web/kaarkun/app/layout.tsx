import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "Kaarkun - Job Marketplace & Service On Demand",
  description: "Connect with certified professionals and local service providers for plumbing, electrical, cleaning, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased`}
    >
      <head>
        {/* Prevent dark mode flash on initial load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (stored === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="h-full bg-[#f8f9fc] dark:bg-[#0a0a0f] text-zinc-900 dark:text-zinc-50">
        <ThemeProvider>
          <CurrencyProvider>
            <AuthProvider>
              <div className="flex h-screen w-full overflow-hidden transition-colors duration-300">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                  <Navbar />
                  <main className="flex-1 overflow-y-auto w-full">
                    {children}
                  </main>
                </div>
              </div>
            </AuthProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
