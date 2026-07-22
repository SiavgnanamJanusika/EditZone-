import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import LandingNavbar from "../../components/navbar/LandingNavbar";
import { Logo, Input, PrimaryButton, ErrorText } from "../../components/common/UI";
import api from "../../services/api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || "", otp: "", new_password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
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
          <h1 className="font-display text-2xl font-bold mb-1 text-center">Reset Password</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Enter the OTP sent to your email and your new password</p>

          {success ? (
            <p className="text-green-400 text-sm text-center">Password reset! Redirecting to login...</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Input name="email" type="email" placeholder="Email Address" value={form.email} onChange={onChange} required />
              <Input name="otp" placeholder="6-digit OTP" value={form.otp} onChange={onChange} required maxLength={6} />
              <Input name="new_password" type="password" placeholder="New Password (min 8 characters)" value={form.new_password} onChange={onChange} required minLength={8} />
              <ErrorText>{error}</ErrorText>
              <PrimaryButton type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </PrimaryButton>
            </form>
          )}

          <p className="text-sm text-gray-500 text-center mt-6">
            <Link to="/login" className="text-brand-cyan hover:underline">Back to login</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
