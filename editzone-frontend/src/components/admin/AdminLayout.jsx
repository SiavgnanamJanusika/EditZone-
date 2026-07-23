import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Clapperboard, CreditCard, FolderKanban, LogOut } from "lucide-react";
import { Logo } from "../common/UI";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/editors", label: "Editors", icon: Clapperboard },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
];

export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-dark flex">
      <aside className="w-60 shrink-0 glass hidden md:flex flex-col p-5">
        <div className="mb-8" onClick={() => navigate("/admin")}><Logo size={40} withText /></div>
        <nav className="flex-1 space-y-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-brand-panel2 text-brand-cyan" : "text-gray-400 hover:text-white"
                }`
              }
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400">
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <main className="min-w-0 flex-1 overflow-x-auto px-4 py-5 sm:px-6 md:px-10 md:py-8">
        <nav className="mb-6 flex gap-2 overflow-x-auto pb-2 md:hidden">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${isActive ? "border-brand-blue bg-brand-panel2 text-brand-cyan" : "border-brand-border text-gray-400"}`}><Icon size={15} /> {label}</NavLink>
          ))}
          <button onClick={logout} className="flex shrink-0 items-center gap-2 rounded-full border border-red-500/20 px-3 py-2 text-xs text-red-300"><LogOut size={15} /> Logout</button>
        </nav>
        {children}
      </main>
    </div>
  );
}
