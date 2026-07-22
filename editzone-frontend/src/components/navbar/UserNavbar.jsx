import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, History } from "lucide-react";
import { Logo } from "../common/UI";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useState } from "react";

export default function UserNavbar({ search, setSearch, category, setCategory }) {
  const { user, logout } = useAuth();
  const { notifications } = useSocket() || {};
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  const categories = ["All", "Image Editor", "TikTok Editor", "Video Editor"];

  return (
    <nav className="nav-shell sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 py-3 min-h-[82px] flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center justify-between">
          <Link to="/editors"><Logo size={52} /></Link>
          <div className="flex items-center gap-3 md:hidden">
            <button onClick={() => setShowNotifs((s) => !s)} className="relative text-brand-cyan">
              <Bell size={20} />
              {notifications?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>
        </div>

        {setSearch && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search editors by skill, location..."
            className="flex-1 min-h-11 px-5 py-2 rounded-full bg-white/[0.05] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          />
        )}

        <div className="flex items-center gap-2 overflow-x-auto">
          {setCategory && categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${
                category === c
                  ? "bg-brand-gradient text-white border-transparent"
                  : "border-brand-border text-gray-300 hover:border-brand-blue"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4 ml-auto">
          <button onClick={() => navigate("/order-history")} className="nav-pill text-gray-300 hover:text-brand-cyan flex items-center gap-1 text-sm">
            <History size={18} /> Orders
          </button>
          <div className="relative">
            <button onClick={() => setShowNotifs((s) => !s)} className="relative text-gray-300 hover:text-brand-cyan">
              <Bell size={20} />
              {notifications?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-72 glass rounded-lg p-3 max-h-80 overflow-y-auto shadow-glow">
                <p className="text-sm font-semibold text-brand-cyan mb-2">Notifications</p>
                {(!notifications || notifications.length === 0) && (
                  <p className="text-xs text-gray-500">No notifications yet</p>
                )}
                {notifications?.map((n) => (
                  <div key={n.id} className="text-xs text-gray-300 border-b border-brand-border py-2 last:border-0">
                    <p className="font-medium text-white">{n.title}</p>
                    <p className="text-gray-400">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300">{user?.username}</span>
          <button onClick={logout} className="rounded-full p-2.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400"><LogOut size={18} /></button>
        </div>
      </div>
    </nav>
  );
}
