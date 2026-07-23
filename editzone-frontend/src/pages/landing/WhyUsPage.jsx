import { ShieldCheck, Lock, Sparkles, DollarSign, Rocket, Headphones } from "lucide-react";
import LandingNavbar from "../../components/navbar/LandingNavbar";
import Footer from "../../components/common/Footer";

const reasons = [
  { icon: ShieldCheck, title: "Verified Editors", desc: "Every editor on EditZone is reviewed before joining, so you know exactly who you're hiring." },
  { icon: Lock, title: "Secure Payments", desc: "Funds are held in escrow and only released once your delivery is verified — your money is always protected." },
  { icon: Sparkles, title: "High-Quality Editing", desc: "From TikTok cuts to full YouTube productions, our editors bring professional craft to every project." },
  { icon: DollarSign, title: "Affordable Pricing", desc: "Transparent hourly rates set by editors, with no hidden fees — you always know what you're paying for." },
  { icon: Rocket, title: "Fast Delivery", desc: "Real-time chat and streamlined workflows mean projects move quickly from brief to final cut." },
  { icon: Headphones, title: "Reliable Support", desc: "Our team monitors every delivery and is on hand to resolve disputes or issues quickly." },
];

export default function WhyUsPage() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <LandingNavbar />
      <section className="marketing-page-enter max-w-6xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl font-bold mb-4 text-center">Why Choose EditZone</h1>
        <p className="text-gray-400 text-center mb-14 max-w-2xl mx-auto">
          We built EditZone to make hiring a video editor as safe and simple as it should be.
        </p>

        <div className="marketing-card-list grid grid-cols-1 md:grid-cols-3 gap-6">
          {reasons.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-xl p-6 hover:shadow-glow-blue transition-all">
              <div className="w-11 h-11 rounded-lg bg-brand-gradient flex items-center justify-center mb-4">
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
