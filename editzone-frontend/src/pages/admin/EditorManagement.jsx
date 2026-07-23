import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { RefreshCw, Users } from "lucide-react";
import { Loader, Badge } from "../../components/common/UI";
import api from "../../services/api";

export default function EditorManagement() {
  const [editors, setEditors] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    setEditors(null);
    api.get("/admin/editors")
      .then((res) => setEditors(res.data.editors || []))
      .catch((err) => { setError(err.response?.data?.message || "Unable to load editors"); setEditors([]); });
  };

  useEffect(() => { load(); }, []);

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Editor Management</h1>
      {error ? (
        <div className="glass rounded-2xl p-8 text-center"><p className="text-red-300">{error}</p><button onClick={load} className="mt-4 inline-flex items-center gap-2 text-sm text-brand-cyan"><RefreshCw size={15} /> Try again</button></div>
      ) : !editors ? (
        <Loader />
      ) : editors.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center"><Users className="mx-auto mb-4 text-brand-cyan" size={36} /><h2 className="font-semibold text-white">No editors registered yet</h2><p className="mt-2 text-sm text-gray-400">Editor accounts will appear here after registration and profile creation.</p><button onClick={load} className="mt-5 inline-flex items-center gap-2 text-sm text-brand-cyan"><RefreshCw size={15} /> Refresh</button></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {editors.map((e) => (
            <div key={e.id} className="glass rounded-xl p-5">
              <h3 className="font-semibold text-white">{e.username}</h3>
              <p className="text-xs text-brand-cyan">{e.category}</p>
              <p className="mt-1 truncate text-xs text-gray-500">{e.email}</p>
              <p className="text-xs text-gray-500 mb-2">{e.location || "No location set"}</p>
              <div className="flex items-center justify-between text-sm">
                <Badge tone="purple">Rs. {Number(e.hourly_rate || 0).toLocaleString("en-LK")}/hr</Badge>
                <span className="text-yellow-400 text-xs">★ {e.rating_avg} ({e.rating_count})</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{e.total_views} profile views</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
