"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, LogOut, Menu, User, X, Receipt, BookOpen, FileText } from "lucide-react";

import { cn } from "@/lib/utils";

interface SidebarProps {
  email: string;
  businessName: string | null;
  fullName: string | null;
  signOutAction: () => void;
}

export function Sidebar({ email, businessName, fullName, signOutAction }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Transacciones",
      href: "/transacciones",
      icon: Receipt,
    },
    {
      name: "Reportes F29",
      href: "/reportes",
      icon: FileText,
    },
    {
      name: "Glosario",
      href: "/glosario",
      icon: BookOpen,
    },
    {
      name: "Mi Perfil",
      href: "/perfil",
      icon: User,
    },
  ];

  const displayName = businessName || fullName || "Mi Negocio";

  const getInitials = () => {
    if (fullName && fullName.trim()) {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (businessName && businessName.trim()) {
      const parts = businessName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      const localPart = email.split("@")[0].trim();
      const parts = localPart.split(/[\._-]+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return localPart.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const userInitials = getInitials();

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col justify-between p-5">
      {/* Top Section */}
      <div className="space-y-6">
        {/* Brand/Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2" onClick={() => setIsOpen(false)}>
          <span className="flex h-15 w-15 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 shadow-md hover:scale-105 transition-transform duration-200 overflow-hidden">
            <Image
              src="/logo.png"
              alt="ContaFácil Logo"
              width={100}
              height={100}
              className="h-full w-full object-contain"
            />
          </span>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white">
              ContaFácil
            </span>
            <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">
              SaaS de Gestión
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-zinc-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Section / Footer */}
      <div className="border-t border-zinc-800 pt-5 space-y-4">
        <div className="flex items-center gap-3 px-2">
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-sm font-semibold text-emerald-500 border border-zinc-700">
            {userInitials}
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>
            <p className="truncate text-xs text-zinc-400">
              {email}
            </p>
          </div>
        </div>

        {/* Sign Out Action */}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-red-950/30 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <Image
              src="/logo.png"
              alt="ContaFácil Logo"
              width={50}
              height={50}
              className="h-full w-full object-contain"
            />
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            ContaFácil
          </span>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Desktop Sidebar (Persistent Left) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-zinc-800 bg-zinc-950 text-zinc-100 lg:flex lg:flex-col">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Sidebar Overlay/Drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", isOpen ? "block" : "hidden")}>
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
        {/* Slide-out Panel */}
        <div className="fixed inset-y-0 left-0 z-10 flex w-72 flex-col bg-zinc-950 text-zinc-100 border-r border-zinc-800 shadow-2xl animate-in slide-in-from-left duration-200">
          <div className="flex justify-end p-4">
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderSidebarContent()}
          </div>
        </div>
      </div>
    </>
  );
}
