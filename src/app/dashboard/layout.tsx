"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Leaf,
  LayoutDashboard,
  ClipboardCheck,
  Salad,
  ShoppingCart,
  Activity,
  Weight,
  Video,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/assessment", icon: ClipboardCheck, label: "RD Assessment" },
  { href: "/dashboard/nutrients", icon: Activity, label: "Nutrient Targets" },
  { href: "/dashboard/recipes", icon: Salad, label: "Recipes" },
  { href: "/dashboard/grocery", icon: ShoppingCart, label: "Grocery Lists" },
  { href: "/dashboard/tracking", icon: Weight, label: "Symptom Tracking" },
  { href: "/dashboard/education", icon: Video, label: "Education" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">
              Blend<span className="text-brand-600">Wise</span>
            </span>
          </Link>
          <button
            className="lg:hidden p-1"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "text-brand-600" : "text-gray-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
          <button
            className="lg:hidden p-1"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>Dashboard</span>
            {pathname !== "/dashboard" && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium capitalize">
                  {pathname.split("/").pop()?.replace(/-/g, " ")}
                </span>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
