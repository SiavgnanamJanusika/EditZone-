import { Link, useNavigate } from "react-router-dom";
import { Logo, OutlineButton, PrimaryButton } from "../common/UI";
import { useAuth } from "../../context/AuthContext";

export default function LandingNavbar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="nav-shell sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 min-h-[82px] flex items-center justify-between gap-5">
        <Link to="/" className="shrink-0 transition-transform hover:scale-105">
          <Logo size={54} withText />
        </Link>
        <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-300 rounded-full border border-white/[0.06] bg-white/[0.03] p-1.5">
          <Link to="/" className="nav-pill">Home</Link>
          <Link to="/about" className="nav-pill">About</Link>
          <Link to="/why-us" className="nav-pill">Why Us</Link>
          <Link to="/credits" className="nav-pill">Credits</Link>
        </div>
        {user ? (
          <PrimaryButton onClick={() => navigate(user.role === "editor" ? "/editor/dashboard" : "/editors")}>
            Dashboard
          </PrimaryButton>
        ) : (
          <div className="flex items-center gap-2">
            <OutlineButton onClick={() => navigate("/login")} className="hidden sm:block rounded-full px-6">Sign In</OutlineButton>
            <PrimaryButton onClick={() => navigate("/choose-role")} className="rounded-full px-6">Register</PrimaryButton>
          </div>
        )}
      </div>
    </nav>
  );
}
