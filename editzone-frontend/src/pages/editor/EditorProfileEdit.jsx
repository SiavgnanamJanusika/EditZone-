import { useEffect, useState } from "react";
import { BadgeCheck, Camera, Images, MapPin, Play, Plus, Sparkles } from "lucide-react";
import EditorNavbar from "../../components/navbar/EditorNavbar";
import { Loader, Input, PrimaryButton, ErrorText } from "../../components/common/UI";
import api from "../../services/api";

const CATEGORIES = ["Image Editor", "TikTok Editor", "Video Editor"];

export default function EditorProfileEdit() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/editors/me/profile").then((res) => setProfile(res.data)).finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await api.put("/editors/me/profile", {
        bio: profile.bio,
        skills: profile.skills,
        hourly_rate: parseFloat(profile.hourly_rate) || 0,
        location: profile.location,
        category: profile.category,
      });
      setProfile((p) => ({ ...p, ...res.data }));
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (!skillInput.trim()) return;
    setProfile((p) => ({ ...p, skills: [...(p.skills || []), skillInput.trim()] }));
    setSkillInput("");
  };

  const removeSkill = (skill) => {
    setProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  };

  const uploadPicture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await api.put(`/editors/me/profile-picture?file_url=${encodeURIComponent(res.data.file_url)}`);
      setProfile((p) => ({ ...p, profile_picture: res.data.file_url }));
    } catch {
      alert("Failed to upload profile picture");
    } finally {
      setUploadingPic(false);
    }
  };

  const uploadPortfolio = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPortfolio(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await api.post(`/editors/me/portfolio?file_url=${encodeURIComponent(res.data.file_url)}`);
      setProfile((p) => ({ ...p, portfolio_links: [...(p.portfolio_links || []), res.data.file_url] }));
    } catch {
      alert("Failed to upload portfolio item");
    } finally {
      setUploadingPortfolio(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-brand-dark"><EditorNavbar /><Loader /></div>;

  return (
    <div className="profile-page min-h-screen bg-brand-dark">
      <EditorNavbar />
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Editor studio</p>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Build your profile</h1>
          </div>
          <span className="hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-semibold text-emerald-200 sm:flex"><Sparkles size={14} /> Live profile</span>
        </div>

        <div className="liquid-glass mb-6 overflow-hidden rounded-[2rem]">
          <div className="profile-cover relative h-36 sm:h-48" />
          <div className="px-5 pb-7 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {profile.profile_picture ? (
              <img src={profile.profile_picture} alt={`${profile.username}'s profile`} className="-mt-14 h-28 w-28 rounded-full border-4 border-[#111827] object-cover shadow-2xl sm:h-32 sm:w-32" />
            ) : (
              <div className="-mt-14 flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#111827] bg-brand-gradient text-2xl font-bold text-white shadow-2xl sm:h-32 sm:w-32">
                {(profile.username || "E").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 pb-1">
              <p className="flex items-center gap-2 truncate font-display text-2xl font-bold text-white">{profile.username}<BadgeCheck size={20} className="text-cyan-300" fill="currentColor" /></p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400"><MapPin size={14} /> {profile.location || "Add your location"}</p>
            </div>
            <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300/30 hover:bg-white/[.1]">
              <Camera size={16} /> {uploadingPic ? "Uploading..." : "Change photo"}
              <input type="file" accept="image/*" hidden onChange={uploadPicture} disabled={uploadingPic} />
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-white/[.08] bg-white/[.035] p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-emerald-300">Business About</p>
            <p className="text-sm leading-relaxed text-slate-300">{profile.bio || "Tell clients what makes your editing style distinctive."}</p>
          </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="liquid-glass rounded-[2rem] p-5 sm:p-7">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Profile details</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Business information</h2>
          </div>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <select
                value={profile.category}
                onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-brand-panel border border-brand-border text-white focus:outline-none focus:border-brand-blue"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <Input placeholder="Location" value={profile.location || ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} />
            <Input type="number" placeholder="Hourly Rate (USD)" value={profile.hourly_rate || ""} onChange={(e) => setProfile({ ...profile, hourly_rate: e.target.value })} />

            <textarea
              rows={4}
              placeholder="Bio - tell clients about your experience..."
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-brand-panel border border-brand-border text-white focus:outline-none focus:border-brand-blue"
            />

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Skills</label>
              <div className="flex gap-2 mb-2">
                <Input placeholder="Add a skill (e.g. Premiere Pro)" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} />
                <button type="button" onClick={addSkill} className="px-4 rounded-lg border border-brand-border text-brand-cyan hover:border-brand-blue">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile.skills || []).map((s) => (
                  <span key={s} onClick={() => removeSkill(s)} className="cursor-pointer text-xs px-2.5 py-1 rounded-full bg-brand-panel2 text-brand-cyan border border-brand-border hover:border-red-400">
                    {s} ×
                  </span>
                ))}
              </div>
            </div>

            <ErrorText>{error}</ErrorText>
            {message && <p className="text-green-400 text-sm">{message}</p>}

            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</PrimaryButton>
          </form>
        </div>

        <div className="liquid-glass rounded-[2rem] p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-fuchsia-300"><Images size={15} /> Project Reels</p>
              <h2 className="mt-1 text-lg font-semibold text-white">Show your best work</h2>
            </div>
            <span className="text-xs text-slate-500">{(profile.portfolio_links || []).length} reels</span>
          </div>
          <div className="reels-grid grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(profile.portfolio_links || []).map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noreferrer" className="reel-card group relative aspect-[9/14] overflow-hidden rounded-2xl border border-white/10 bg-brand-panel">
                {/\.(mp4|webm|mov)(\?|$)/i.test(link) ? <video src={link} muted playsInline className="h-full w-full object-cover" /> : <img src={link} alt={`Project reel ${i + 1}`} className="h-full w-full object-cover" />}
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
                <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md"><Play size={14} fill="currentColor" /></span>
                <span className="absolute bottom-3 left-3 text-xs font-semibold text-white">Reel {String(i + 1).padStart(2, "0")}</span>
              </a>
            ))}
            <label className="group flex aspect-[9/14] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/25 bg-cyan-300/[.035] text-center transition hover:border-cyan-300/55 hover:bg-cyan-300/[.07]">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 text-white shadow-lg"><Plus size={21} /></span>
              <span className="mt-3 px-2 text-xs font-semibold text-cyan-200">{uploadingPortfolio ? "Uploading…" : "Add a reel"}</span>
              <span className="mt-1 px-3 text-[10px] text-slate-500">Image or video</span>
              <input type="file" accept="image/*,video/*" hidden onChange={uploadPortfolio} disabled={uploadingPortfolio} />
            </label>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
