import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "../../components/navbar/LandingNavbar";
import { Logo, Input, PrimaryButton, ErrorText } from "../../components/common/UI";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const DISTRICTS = [
  "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara",
  "Hambantota", "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa",
  "Ampara", "Trincomalee", "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa",
  "Badulla", "Monaragala", "Ratnapura", "Kegalle",
];

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    username: user?.username || "",
    nic: user?.nic || "",
    district: "",
    gender: "Male",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        username: current.username || user.username || "",
        nic: current.nic || user.nic || "",
      }));
    }
  }, [user]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/complete-profile", form);
      await refreshUser();
      navigate(res.data.redirect_to === "editor-dashboard" ? "/editor/dashboard" : "/editors");
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      <LandingNavbar />
      <section className="max-w-md mx-auto px-6 py-16">
        <div className="flex justify-center mb-6"><Logo size={60} /></div>
        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold mb-1 text-center">Complete Your Profile</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Just a few more details to get started</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input name="username" placeholder="Username" value={form.username} onChange={onChange} required />
            <Input name="nic" placeholder="NIC Number" value={form.nic} onChange={onChange} required />
            <Input name="phone" placeholder="Phone Number (e.g. 0771234567)" value={form.phone} onChange={onChange} required />

            <select
              name="district"
              value={form.district}
              onChange={onChange}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-brand-panel border border-brand-border text-white focus:outline-none focus:border-brand-blue"
            >
              <option value="">Select District / Place</option>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>

            <div className="flex gap-4">
              {["Male", "Female"].map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={onChange} className="accent-brand-purple" />
                  {g}
                </label>
              ))}
            </div>

            <ErrorText>{error}</ErrorText>

            <PrimaryButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Finish Registration"}
            </PrimaryButton>
          </form>
        </div>
      </section>
    </div>
  );
}
