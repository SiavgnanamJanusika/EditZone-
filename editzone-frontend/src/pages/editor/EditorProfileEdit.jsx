import { useEffect, useState } from "react";
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
    <div className="min-h-screen bg-brand-dark">
      <EditorNavbar />
      <section className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl font-bold mb-6">Edit Profile</h1>

        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-4 mb-6">
            {profile.profile_picture ? (
              <img src={profile.profile_picture} className="w-20 h-20 rounded-full object-cover border border-brand-border" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xl font-bold">
                {(profile.username || "E").slice(0, 2).toUpperCase()}
              </div>
            )}
            <label className="cursor-pointer text-sm text-brand-cyan hover:underline">
              {uploadingPic ? "Uploading..." : "Change profile picture"}
              <input type="file" accept="image/*" hidden onChange={uploadPicture} disabled={uploadingPic} />
            </label>
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

            <div>
              <label className="text-xs text-gray-400 mb-2 block">Portfolio</label>
              <div className="grid grid-cols-3 gap-3 mb-2">
                {(profile.portfolio_links || []).map((link, i) => (
                  <a key={i} href={link} target="_blank" rel="noreferrer" className="aspect-video rounded-lg bg-brand-panel border border-brand-border flex items-center justify-center text-xs text-gray-500">
                    Item {i + 1}
                  </a>
                ))}
              </div>
              <label className="cursor-pointer text-sm text-brand-cyan hover:underline">
                {uploadingPortfolio ? "Uploading..." : "+ Add portfolio item (image/video)"}
                <input type="file" accept="image/*,video/*" hidden onChange={uploadPortfolio} disabled={uploadingPortfolio} />
              </label>
            </div>

            <ErrorText>{error}</ErrorText>
            {message && <p className="text-green-400 text-sm">{message}</p>}

            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</PrimaryButton>
          </form>
        </div>
      </section>
    </div>
  );
}
