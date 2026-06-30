"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/patient",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Mis citas",
    href: "/patient/my-appointments",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    label: "Mi expediente",
    href: "/patient/my-record",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    ),
  },
  {
    label: "Mi perfil",
    href: "/patient/my-profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: "Notificaciones",
    href: "/patient/notifications",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

const bottomItems = [
  {
    label: "Centro de ayuda",
    href: "/patient/help",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const isActive = (href: string) => {
    if (href === "/patient") return pathname === "/patient";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-[#F1F4FA]">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col justify-between bg-[#F4F5F8] border-r border-[#E2E6F0] py-6 px-4">
        {/* Top — logo + nav */}
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 px-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0">
              <path
                d="M12 3C9 3 6.5 4.5 6 7c-.4 2 .3 4 .8 6 .4 1.7.7 4.3 1.7 6.2.4.8 1.6.8 2-.1.5-1.2.8-3 1.5-3 .7 0 1 1.8 1.5 3 .4.9 1.6.9 2 .1 1-1.9 1.3-4.5 1.7-6.2.5-2 1.2-4 .8-6-.5-2.5-3-4-6-4Z"
                fill="#283A97"
              />
              <path
                d="M9 8c.8-.8 2-1 3-.2.8-.8 2.2-.6 3 .2.8.9.6 2.3-.4 3.2L12 13.5l-2.6-2.3c-1-.9-1.2-2.3-.4-3.2Z"
                fill="#00C2F3"
              />
            </svg>
            <div>
              <p className="text-sm font-semibold leading-none text-[#283A97]">Clident</p>
              <p className="text-[10px] uppercase tracking-widest text-[#7C86B8]">Clínica Dental</p>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive(item.href)
                    ? "border-l-4 border-[#283A97] bg-white text-[#283A97] font-semibold shadow-sm"
                    : "text-[#6B7280] hover:bg-white hover:text-[#283A97]"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom — help + logout */}
        <div className="flex flex-col gap-1">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive(item.href)
                  ? "border-l-4 border-[#283A97] bg-white text-[#283A97] font-semibold shadow-sm"
                  : "text-[#6B7280] hover:bg-white hover:text-[#283A97]"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#6B7280] transition-colors hover:bg-white hover:text-[#E45C3C]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}