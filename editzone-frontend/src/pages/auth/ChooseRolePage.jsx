import { useNavigate } from "react-router-dom";
import { User, Clapperboard } from "lucide-react";
import LandingNavbar from "../../components/navbar/LandingNavbar";
import { Logo } from "../../components/common/UI";

export default function ChooseRolePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-dark">
      <LandingNavbar />
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="flex justify-center mb-6"><Logo size={70} /></div>
        <h1 className="font-display text-3xl font-bold mb-3">Join EditZone as...</h1>
        <p className="text-gray-400 mb-12">Choose the role that fits you. You can only pick one per account.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => navigate("/register?role=user")}
            className="glass cinematic-card rounded-2xl p-9 min-h-[260px] text-left group"
          >
            <div className="w-14 h-14 rounded-xl bg-brand-gradient flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <User size={26} className="text-white" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2">I'm a Client</h3>
            <p className="text-sm text-gray-400">
              I want to hire professional editors for my videos, TikToks, or content projects.
            </p>
          </button>

          <button
            onClick={() => navigate("/register?role=editor")}
            className="glass cinematic-card rounded-2xl p-9 min-h-[260px] text-left group"
          >
            <div className="w-14 h-14 rounded-xl bg-brand-gradient flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Clapperboard size={26} className="text-white" />
            </div>
            <h3 className="font-display font-bold text-xl mb-2">I'm an Editor</h3>
            <p className="text-sm text-gray-400">
              I want to offer my video editing skills and get hired for paid projects.
            </p>
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-10">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-brand-cyan hover:underline">
            Log in
          </button>
        </p>
      </section>
    </div>
  );
}
