import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Loader, Badge } from "../../components/common/UI";
import api from "../../services/api";

export default function EditorManagement() {
  const [editors, setEditors] = useState(null);

  useEffect(() => {
    api.get("/admin/editors").then((res) => setEditors(res.data.editors));
  }, []);

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Editor Management</h1>
      {!editors ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {editors.map((e) => (
            <div key={e.id} className="glass rounded-xl p-5">
              <h3 className="font-semibold text-white">{e.category}</h3>
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
