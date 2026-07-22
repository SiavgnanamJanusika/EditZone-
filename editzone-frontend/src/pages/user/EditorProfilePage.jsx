import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, ArrowLeft, Eye, Camera, MessageCircle, Play, Images, BadgeCheck } from "lucide-react";
import UserNavbar from "../../components/navbar/UserNavbar";
import { Loader, PrimaryButton, OutlineButton, Badge } from "../../components/common/UI";
import api from "../../services/api";

export default function EditorProfilePage() {
  const { editorId } = useParams();
  const navigate = useNavigate();
  const [editor, setEditor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [form, setForm] = useState({ project_title: "", project_description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/editors/${editorId}`),
      api.get(`/reviews/editor/${editorId}`).catch(() => ({ data: { reviews: [] } })),
    ])
      .then(([eRes, rRes]) => {
        setEditor(eRes.data);
        setReviews(rRes.data.reviews);
      })
      .finally(() => setLoading(false));
  }, [editorId]);

  const submitRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await api.post("/requests", { editor_id: editorId, ...form });
      setMessage("Request sent! You'll be notified when the editor responds.");
      setShowRequestForm(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-brand-dark"><UserNavbar /><Loader /></div>;
  if (!editor) return null;

  return (
    <div className="profile-page min-h-screen bg-brand-dark">
      <UserNavbar />
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <button onClick={() => navigate("/editors")} className="flex items-center gap-2 text-gray-400 hover:text-brand-cyan mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Editors
        </button>

        <div className="liquid-glass overflow-hidden rounded-[2rem] mb-6">
          <div className="profile-cover relative h-36 sm:h-48">
            <div className="absolute right-5 top-5 rounded-full border border-white/15 bg-black/20 p-2.5 text-white/80 backdrop-blur-xl"><Camera size={18} /></div>
          </div>
          <div className="px-5 pb-7 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            {editor.profile_picture ? (
              <img src={editor.profile_picture} alt={`${editor.username}'s profile`} className="-mt-14 h-28 w-28 shrink-0 rounded-full border-4 border-[#111827] object-cover shadow-2xl sm:h-32 sm:w-32" />
            ) : (
              <div className="-mt-14 flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-[#111827] bg-brand-gradient text-2xl font-bold text-white shadow-2xl sm:h-32 sm:w-32">
                {(editor.username || "E").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h1 className="flex items-center gap-2 font-display text-2xl font-bold">{editor.username}<BadgeCheck size={20} className="text-cyan-300" fill="currentColor" /></h1>
              <p className="mt-1 text-sm text-emerald-300">Available for new projects</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-400">
                <span className="flex items-center gap-1"><MapPin size={14} /> {editor.location || "Sri Lanka"}</span>
                <span className="flex items-center gap-1 text-yellow-400"><Star size={14} fill="currentColor" /> {editor.rating_avg || 0} ({editor.rating_count || 0})</span>
                <span className="flex items-center gap-1"><Eye size={14} /> {editor.total_views || 0} views</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(editor.skills || []).map((s) => <Badge key={s}>{s}</Badge>)}
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl font-bold text-brand-cyan">${editor.hourly_rate || 0}<span className="text-sm text-gray-500">/hr</span></p>
              <PrimaryButton className="mt-3 rounded-full" onClick={() => setShowRequestForm(true)}><MessageCircle size={17} /> Send Request</PrimaryButton>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">About</p>
            <p className="text-sm leading-relaxed text-slate-300">{editor.bio || "Creative editor focused on turning raw footage into stories people remember."}</p>
          </div>

          {editor.portfolio_links?.length > 0 && (
            <div className="mt-7 border-t border-white/[0.08] pt-6">
              <div className="mb-4 flex items-center justify-between"><div><p className="flex items-center gap-2 font-semibold"><Images size={18} className="text-cyan-300" /> Project Reels</p><p className="mt-1 text-xs text-slate-500">Tap a reel to view the full project</p></div><span className="text-xs text-slate-500">{editor.portfolio_links.length} projects</span></div>
              <div className="reels-grid grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {editor.portfolio_links.map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noreferrer" className="reel-card group relative aspect-[9/14] overflow-hidden rounded-2xl border border-white/10 bg-brand-panel">
                    {/\.(mp4|webm|mov)(\?|$)/i.test(link) ? <video src={link} muted playsInline className="h-full w-full object-cover" /> : <img src={link} alt={`Project reel ${i + 1}`} className="h-full w-full object-cover" />}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
                    <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md"><Play size={14} fill="currentColor" /></span>
                    <span className="absolute bottom-3 left-3 text-xs font-semibold text-white">Project {String(i + 1).padStart(2, "0")}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>

        {message && <p className="text-brand-cyan text-sm mb-4">{message}</p>}

        {showRequestForm && (
          <div className="glass rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-4">Send a Project Request</h3>
            <form onSubmit={submitRequest} className="space-y-3">
              <input
                required
                minLength={3}
                maxLength={120}
                placeholder="Project Title"
                value={form.project_title}
                onChange={(e) => setForm({ ...form, project_title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-brand-panel border border-brand-border text-white focus:outline-none focus:border-brand-blue"
              />
              <textarea
                required
                minLength={20}
                maxLength={5000}
                rows={4}
                placeholder="Describe your project..."
                value={form.project_description}
                onChange={(e) => setForm({ ...form, project_description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-brand-panel border border-brand-border text-white focus:outline-none focus:border-brand-blue"
              />
              <div className="flex gap-3">
                <PrimaryButton type="submit" disabled={submitting}>{submitting ? "Sending..." : "Send Request"}</PrimaryButton>
                <OutlineButton type="button" onClick={() => setShowRequestForm(false)}>Cancel</OutlineButton>
              </div>
            </form>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Reviews</h3>
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-brand-border pb-4 last:border-0">
                  <div className="flex items-center gap-1 text-yellow-400 mb-1">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-sm text-gray-400">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
