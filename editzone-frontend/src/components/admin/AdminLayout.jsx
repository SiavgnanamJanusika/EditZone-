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
      <main className="flex-1 px-6 md:px-10 py-8 overflow-x-auto">{children}</main>
    </div>
  );
}
