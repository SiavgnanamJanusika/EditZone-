import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LandingNavbar from "../../components/navbar/LandingNavbar";
import { Logo, Input, PrimaryButton, ErrorText } from "../../components/common/UI";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const [params] = useSearchParams();
  const role = params.get("role") === "editor" ? "editor" : "user";
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [form, setForm] = useState({ username: "", email: "", password: "", nic: "" });
  const [error, setError] = useState("");
  const [existingAccount, setExistingAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("register");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setExistingAccount(false);
    setLoading(true);
    try {
      if (mode === "signin") {
        const data = await login(
          form.email.trim().toLowerCase(),
          form.password,
          form.nic.trim().toUpperCase(),
        );
        if (!data.registration_complete) navigate("/complete-profile");
        else if (data.role === "editor") navigate("/editor/dashboard");
        else if (data.role === "admin") navigate("/admin");
        else navigate("/editors");
      } else {
        await register({
          ...form,
          email: form.email.trim().toLowerCase(),
          nic: form.nic.trim().toUpperCase(),
          role,
        });
        navigate("/complete-profile");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.message || "Registration failed");
      const accountExists = err.response?.status === 409;
      setExistingAccount(accountExists);
      if (accountExists) setMode("signin");
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
          <h1 className="font-display text-2xl font-bold mb-1 text-center">
            {mode === "signin" ? "Sign In" : `Register as ${role === "editor" ? "an Editor" : "a Client"}`}
          </h1>
          <p className="text-gray-400 text-sm text-center mb-6">
            {mode === "signin" ? "Use your existing EditZone account" : "Create your EditZone account"}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && <Input name="username" placeholder="Username" value={form.username} onChange={onChange} required />}
            <Input name="email" type="email" placeholder="Email Address" value={form.email} onChange={onChange} required />
            <Input name="password" type="password" placeholder="Password (min 8 characters)" value={form.password} onChange={onChange} required minLength={8} />
            <Input name="nic" placeholder="NIC Number (e.g. 200012345678 or 991234567V)" value={form.nic} onChange={onChange} required />

            <ErrorText>{error}</ErrorText>

            {existingAccount && (
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(""); }}
                className="block w-full rounded-lg border border-brand-cyan/50 bg-brand-cyan/10 px-5 py-2.5 text-center text-sm font-semibold text-brand-cyan hover:bg-brand-cyan/20 transition-colors"
              >
                Account already exists — Sign In here
              </button>
            )}

            <PrimaryButton type="submit" className="w-full" disabled={loading}>
              {loading ? (mode === "signin" ? "Signing in..." : "Creating account...") : (mode === "signin" ? "Sign In" : "Continue")}
            </PrimaryButton>

            <button type="button" className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-brand-border text-gray-300 hover:border-brand-blue transition-colors">
              Continue with Google
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            {mode === "signin" ? "Need a new account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signin" ? "register" : "signin"); setError(""); setExistingAccount(false); }}
              className="text-brand-cyan hover:underline"
            >
              {mode === "signin" ? "Register" : "Sign In here"}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
