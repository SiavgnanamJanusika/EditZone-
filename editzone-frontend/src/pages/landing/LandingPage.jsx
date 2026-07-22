import { useNavigate } from "react-router-dom";
import { ShieldCheck, Zap, Wallet, Star } from "lucide-react";
import LandingNavbar from "../../components/navbar/LandingNavbar";
import { PrimaryButton, OutlineButton } from "../../components/common/UI";
import Footer from "../../components/common/Footer";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-dark">
      <LandingNavbar />

      <section className="landing-hero max-w-[1440px] mx-auto px-6 sm:px-10 py-12 lg:py-16 grid lg:grid-cols-[1.15fr_0.85fr] items-center gap-10 lg:gap-16">
        <div className="text-center lg:text-left">
          <span className="text-pill mb-6 inline-flex">Professional editing, simplified</span>
          <h1 className="hero-title font-display font-black leading-[1.08] mb-6">
            Hire Professional{" "}
            <span className="bg-gradient-to-r from-brand-purple via-brand-cyan to-brand-blue bg-clip-text text-transparent">
              Video Editors
            </span>{" "}
            in Minutes
          </h1>
          <p className="text-gray-400 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto lg:mx-0 mb-9 leading-relaxed">
            EditZone connects you with verified, skilled video editors for TikTok, YouTube, and every
            format in between — with secure escrow payments and real-time collaboration built in.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <PrimaryButton onClick={() => navigate("/choose-role")} className="rounded-full text-base sm:text-lg px-8 py-3.5">
              Get Started
            </PrimaryButton>
            <OutlineButton onClick={() => navigate("/why-us")} className="rounded-full text-base sm:text-lg px-8 py-3.5">
              Why EditZone?
            </OutlineButton>
          </div>
        </div>
        <div className="hero-visual flex justify-center">
          <div className="favicon-draw-wrap" aria-label="EditZone">
            <img src="/favicon.png" alt="EditZone" className="favicon-draw-image" />
            <span className="favicon-draw-line" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: ShieldCheck, title: "Verified Editors", desc: "Every editor is vetted for skill and reliability." },
          { icon: Wallet, title: "Escrow Payments", desc: "Your funds stay protected until you approve delivery." },
          { icon: Zap, title: "Fast Delivery", desc: "Get professionally edited videos, fast." },
          { icon: Star, title: "Rated & Reviewed", desc: "Transparent ratings from real clients." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass cinematic-card rounded-2xl p-7 min-h-[190px]">
            <Icon className="text-brand-cyan mb-3" size={28} />
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{desc}</p>
          </div>
        ))}
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <div className="glass cinematic-card rounded-2xl p-10">
          <h2 className="font-display text-2xl font-bold mb-3">Ready to bring your videos to life?</h2>
          <p className="text-gray-400 mb-6">Join EditZone today as a client or as a professional editor.</p>
          <PrimaryButton onClick={() => navigate("/choose-role")}>Register Now</PrimaryButton>
        </div>
      </section>
      <Footer />
    </div>
  );
}
