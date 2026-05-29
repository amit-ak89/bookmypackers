import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Prowider Mini Lead Distribution",
  description: "Lead distribution system with fair round-robin allocation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
            <span className="font-bold text-blue-600 text-lg">
              Prowider Leads
            </span>
            <Link
              href="/request-service"
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              Request Service
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/test-tools"
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              Test Tools
            </Link>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
