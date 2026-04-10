import React from "react";
import Navbar from "./Navbar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-xs text-gray-400">
        ExpenseMate &mdash; Hostel Expense Manager
      </footer>
    </div>
  );
}
