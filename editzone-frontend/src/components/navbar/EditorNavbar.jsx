import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, UserCircle } from "lucide-react";
import { Logo } from "../common/UI";
import { useAuth } from "../../context/AuthContext";

export default function EditorNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const linkClass = (path) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
      location.pathname === path ? "bg-brand-panel2 text-brand-cyan" : "text-gray-300 hover:text-brand-cyan"
    }`;

  return (
    <nav className="nav-shell sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 min-h-[82px] flex items-center justify-between gap-3">
        <Link to="/editor/dashboard"><Logo size={52} /></Link>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/editor/dashboard")} className={linkClass("/editor/dashboard")}>
            <LayoutDashboard size={18} /> <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button onClick={() => navigate("/editor/profile")} className={linkClass("/editor/profile")}>
            <UserCircle size={18} /> <span className="hidden sm:inline">Profile</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 hidden md:inline">{user?.username}</span>
          <button onClick={logout} className="rounded-full px-3 py-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 flex items-center gap-1 text-sm">
            <LogOut size={18} /> <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
