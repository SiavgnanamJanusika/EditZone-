import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard } from "lucide-react";
import UserNavbar from "../../components/navbar/UserNavbar";
import { Loader, Input, PrimaryButton, ErrorText } from "../../components/common/UI";
import api from "../../services/api";

const METHODS = [
  { id: "visa", label: "Visa Card" },
  { id: "mastercard", label: "MasterCard" },
  { id: "payhere", label: "PayHere" },
  { id: "stripe", label: "Stripe" },
];

export default function PaymentPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [monthlyFee, setMonthlyFee] = useState({ amount: 500, currency: "LKR", due: true });

  const [form, setForm] = useState({
    project_name: "",
    project_description: "",
    editor_name: "",
    delivery_date: "",
    order_date: new Date().toISOString().slice(0, 10),
    payment_method: "visa",
    amount: "",
    card_number: "",
    card_holder_name: "",
    expiry_date: "",
    cvv: "",
  });

  useEffect(() => {
    Promise.all([api.get(`/requests/${requestId}`), api.get("/payments/monthly-fee/status")])
      .then(([requestRes, feeRes]) => {
        setForm((f) => ({ ...f, project_name: requestRes.data.project_title, project_description: requestRes.data.project_description }));
        setMonthlyFee(feeRes.data);
      })
      .catch((err) => setError(err.response?.data?.message || "Unable to load this project"))
      .finally(() => setLoading(false));
  }, [requestId]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/payments", { ...form, request_id: requestId, amount: parseFloat(form.amount) });
      navigate("/payment-success", { state: { requestId } });
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Please check your card details.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-brand-dark"><UserNavbar /><Loader /></div>;

  return (
    <div className="min-h-screen bg-brand-dark">
      <UserNavbar />
      <section className="max-w-2xl mx-auto px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-brand-cyan mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Chat
        </button>

        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="text-brand-cyan" />
            <h1 className="font-display text-xl font-bold">Project Payment</h1>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input name="project_name" placeholder="Project Name" value={form.project_name} onChange={onChange} required minLength={3} maxLength={120} />
              <Input name="editor_name" placeholder="Editor Name" value={form.editor_name} onChange={onChange} required minLength={2} maxLength={50} />
            </div>
            <textarea
              name="project_description"
              rows={3}
              placeholder="Project Description"
              value={form.project_description}
              onChange={onChange}
              required
              minLength={20}
              maxLength={5000}
              className="w-full px-4 py-2.5 rounded-lg bg-brand-panel border border-brand-border text-white focus:outline-none focus:border-brand-blue"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400">Order Date</label>
                <Input name="order_date" type="date" value={form.order_date} onChange={onChange} required />
              </div>
              <div>
                <label className="text-xs text-gray-400">Delivery Date</label>
                <Input name="delivery_date" type="date" min={form.order_date} value={form.delivery_date} onChange={onChange} required />
              </div>
            </div>
            <Input name="amount" type="number" min="1" max="10000000" step="0.01" placeholder="Project Amount (LKR)" value={form.amount} onChange={onChange} required />

            <div className="rounded-xl border border-brand-purple/30 bg-brand-purple/10 p-4 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Monthly admin fee (Escrow)</span>
                <span className="font-semibold text-white">
                  {monthlyFee.due ? `${monthlyFee.currency} ${Number(monthlyFee.amount).toFixed(2)}` : "Already paid"}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {monthlyFee.due ? "Added to this charge and held in escrow." : "No monthly fee will be added to this payment."}
              </p>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-2 block">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {METHODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setForm({ ...form, payment_method: m.id })}
                    className={`px-2 py-2 rounded-lg text-xs border transition-colors ${
                      form.payment_method === m.id ? "bg-brand-gradient text-white border-transparent" : "border-brand-border text-gray-300"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <Input name="card_number" inputMode="numeric" placeholder="Card Number" value={form.card_number} onChange={onChange} required minLength={13} maxLength={19} pattern="[0-9 ]{13,19}" />
            <Input name="card_holder_name" placeholder="Card Holder Name" value={form.card_holder_name} onChange={onChange} required minLength={2} maxLength={100} pattern="[A-Za-z][A-Za-z .'-]*" />
            <div className="grid grid-cols-2 gap-4">
              <Input name="expiry_date" inputMode="numeric" placeholder="MM/YY" value={form.expiry_date} onChange={onChange} required pattern="(?:0[1-9]|1[0-2])/[0-9]{2}" maxLength={5} />
              <Input name="cvv" type="password" inputMode="numeric" placeholder="CVV" value={form.cvv} onChange={onChange} required minLength={3} maxLength={4} pattern="[0-9]{3,4}" />
            </div>

            <ErrorText>{error}</ErrorText>

            <PrimaryButton type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Processing..." : "Continue Payment"}
            </PrimaryButton>
            <p className="text-[11px] text-gray-500 text-center">
              Funds are held securely in escrow until your delivery is verified.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
