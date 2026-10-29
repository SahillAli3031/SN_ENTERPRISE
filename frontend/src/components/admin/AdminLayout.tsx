import { Images, Inbox, LayoutDashboard, LogOut, MessageSquareText } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { siteConfig } from "../../config/site";
import { cn } from "../../lib/cn";
import { useAuthStore } from "../../store/authStore";
import { BrandMark } from "../layout/BrandMark";

const navItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/reviews", label: "Reviews", icon: MessageSquareText, end: false },
  { to: "/admin/gallery", label: "Gallery", icon: Images, end: false },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox, end: false },
] as const;

/** Admin shell — replaces the public Navbar/Footer for everything under /admin. */
export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <header className="bg-forest text-ivory">
        <div className="page-container flex min-h-20 flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
          <BrandMark tone="light" />
          <div className="flex items-center gap-4">
            <span className="hidden max-w-[16rem] truncate text-xs text-ivory/70 sm:inline">
              {user?.email ?? "Signed in"}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-ivory/35 px-4 py-2 text-[0.7rem] font-semibold tracking-[0.16em] text-ivory uppercase transition-colors hover:border-terracotta hover:bg-terracotta hover:text-white"
            >
              <LogOut size={14} aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
        <nav aria-label="Admin" className="border-t border-ivory/15">
          <div className="page-container flex gap-2 overflow-x-auto no-scrollbar">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-terracotta text-terracotta"
                      : "border-transparent text-ivory/70 hover:text-ivory",
                  )
                }
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <div className="page-container py-8 sm:py-10">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-line bg-ivory-deep/50">
        <div className="page-container py-5 text-xs text-warm-gray">
          {siteConfig.fullName} administration
        </div>
      </footer>
    </div>
  );
}
