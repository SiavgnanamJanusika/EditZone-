import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import UserNavbar from "../../components/navbar/UserNavbar";
import { PrimaryButton, Logo } from "../../components/common/UI";

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-brand-dark">
      <UserNavbar />
      <section className="max-w-md mx-auto px-6 py-24 text-center">
        <div className="flex justify-center mb-6"><Logo size={60} /></div>
        <div className="glass rounded-2xl p-10">
          <CheckCircle2 className="text-green-400 mx-auto mb-4" size={56} />
          <h1 className="font-display text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-gray-400 text-sm mb-8">
            Your funds are held securely in escrow. The editor has been notified and will begin work
            on your project.
          </p>
          <PrimaryButton className="w-full" onClick={() => navigate("/order-history")}>
            Go to History
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
