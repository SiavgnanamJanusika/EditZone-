import { UserPlus, Search, MessageSquare, CreditCard, CheckCircle2 } from "lucide-react";
import LandingNavbar from "../../components/navbar/LandingNavbar";
import Footer from "../../components/common/Footer";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up",
    desc: "Register as a client or as an editor. Editors build a profile with skills, portfolio, and hourly rate; clients set up their account in seconds.",
  },
  {
    icon: Search,
    title: "Discover & Request",
    desc: "Clients browse verified editors by category — Image, TikTok, or Video — and send a project request describing what they need.",
  },
  {
    icon: MessageSquare,
    title: "Chat & Collaborate",
    desc: "Once an editor accepts, a real-time chat opens up. Share briefs, reference files, images, videos, and documents directly in the conversation.",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    desc: "Clients pay through the platform via Visa, MasterCard, Stripe, or PayHere. Funds are held safely in escrow until the work is verified as complete.",
  },
  {
    icon: CheckCircle2,
    title: "Delivery & Release",
    desc: "The editor uploads the finished video. Our admin team verifies the delivery, then releases payment automatically — 85% to the editor, 15% platform fee — and the video reaches the client instantly.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-dark">
      <LandingNavbar />
      <section className="marketing-page-enter max-w-4xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl font-bold mb-4 text-center">How EditZone Works</h1>
        <p className="text-gray-400 text-center mb-14 max-w-2xl mx-auto">
          A secure, end-to-end marketplace connecting clients with professional video editors —
          from discovery to delivery to payment.
        </p>

        <div className="marketing-card-list space-y-8">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="flex gap-5 glass rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/50 hover:shadow-glow-blue">
              <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center shrink-0">
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-brand-cyan font-semibold mb-1">STEP {i + 1}</p>
                <h3 className="font-semibold text-white text-lg mb-1">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="marketing-closing-card glass rounded-xl p-8 mt-14 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/50 hover:shadow-glow-blue">
          <h2 className="font-display text-xl font-bold mb-3">Secure Communication & Payments</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            All messaging happens on-platform through encrypted, real-time chat — no need to share
            personal contact details. Payments are processed through trusted gateways and held in an
            escrow account until an admin verifies the completed delivery, protecting both clients and
            editors from fraud or incomplete work.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
