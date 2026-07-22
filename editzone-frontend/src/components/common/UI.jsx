import logoImg from "../../assets/logo-full.png";

export function Logo({ size = 40, withText = false }) {
  return (
    <div className="flex items-center gap-2">
      <img src={logoImg} alt="EditZone" style={{ height: size, width: "auto" }} className="rounded-md" />
      {withText && (
        <span className="font-display font-bold text-lg tracking-wide bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
          EditZone
        </span>
      )}
    </div>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`px-5 py-2.5 rounded-lg font-semibold text-white bg-brand-gradient hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function OutlineButton({ children, className = "", ...props }) {
  return (
    <button
      className={`px-5 py-2.5 rounded-lg font-semibold text-brand-cyan border border-brand-border hover:border-brand-blue hover:bg-brand-panel2 transition-all duration-200 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Loader({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-brand-cyan">
      <div className="w-5 h-5 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function Badge({ children, tone = "default" }) {
  const tones = {
    default: "bg-brand-panel2 text-brand-cyan border-brand-border",
    success: "bg-green-500/10 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    danger: "bg-red-500/10 text-red-400 border-red-500/30",
    purple: "bg-brand-purple/10 text-brand-purple border-brand-purple/30",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${tones[tone]}`}>{children}</span>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className="text-red-400 text-sm mt-1">{children}</p>;
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 rounded-lg bg-brand-panel border border-brand-border text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors ${props.className || ""}`}
    />
  );
}
