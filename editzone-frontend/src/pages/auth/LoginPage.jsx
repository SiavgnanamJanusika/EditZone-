import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import LandingNavbar from "../../components/navbar/LandingNavbar";
import { Logo, Input, PrimaryButton, ErrorText } from "../../components/common/UI";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: "",
    nic: location.state?.nic || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(
        form.email.trim().toLowerCase(),
        form.password,
        form.nic.trim().toUpperCase(),
      );
      if (!data.registration_complete) {
        navigate("/complete-profile");
      } else if (data.role === "editor") {
        navigate("/editor/dashboard");
      } else if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate(location.state?.from?.pathname || "/editors", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      <LandingNavbar />
      <section className="max-w-md mx-auto px-6 py-16">
        <div className="flex justify-center mb-6"><Logo size={60} /></div>
        <div className="auth-glow-card glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold mb-1 text-center">Welcome Back</h1>
          <p className="text-gray-400 text-sm text-center mb-6">Log in to your EditZone account</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input name="email" type="email" placeholder="Email Address" value={form.email} onChange={onChange} required />
            <Input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required />
            <Input name="nic" placeholder="NIC Number (not required for admin)" value={form.nic} onChange={onChange} />

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-brand-cyan hover:underline">Forgot Password?</Link>
            </div>

            <ErrorText>{error}</ErrorText>

            <PrimaryButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </PrimaryButton>

            <button type="button" className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-brand-border text-gray-300 hover:border-brand-blue transition-colors">
              Continue with Google
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Don't have an account?{" "}
            <Link to="/choose-role" className="text-brand-cyan hover:underline">Register</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
