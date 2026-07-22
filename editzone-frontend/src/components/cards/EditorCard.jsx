import { useNavigate } from "react-router-dom";
import { Star, MapPin } from "lucide-react";

export default function EditorCard({ editor }) {
  const navigate = useNavigate();
  const initials = (editor.username || "E").slice(0, 2).toUpperCase();

  return (
    <button
      onClick={() => navigate(`/editors/${editor.id}`)}
      className="glass cinematic-card group min-h-[255px] rounded-2xl p-6 text-left w-full"
    >
      <div className="flex items-center gap-4 mb-5">
        {editor.profile_picture ? (
          <img src={editor.profile_picture} alt={editor.username} className="w-20 h-20 rounded-2xl object-cover border border-white/10 transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-xl font-bold shadow-lg transition-transform duration-500 group-hover:scale-105">
            {initials}
          </div>
        )}
        <div>
          <h3 className="font-display text-lg font-bold text-white group-hover:text-brand-cyan transition-colors">{editor.username}</h3>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={12} /> {editor.location || "Sri Lanka"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5 min-h-7">
        {(editor.skills || []).slice(0, 3).map((s) => (
          <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-brand-cyan border border-white/10">
            {s}
          </span>
        ))}
        {(!editor.skills || editor.skills.length === 0) && (
          <span className="text-[11px] text-gray-500">{editor.category}</span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm mt-auto border-t border-white/10 pt-4">
        <div className="flex items-center gap-1 text-yellow-400">
          <Star size={14} fill="currentColor" />
          <span>{editor.rating_avg || 0}</span>
          <span className="text-gray-500">({editor.rating_count || 0})</span>
        </div>
        <span className="font-semibold text-brand-cyan">${editor.hourly_rate || 0}/hr</span>
      </div>
    </button>
  );
}
