import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Loader, Badge, PrimaryButton, OutlineButton } from "../../components/common/UI";
import api from "../../services/api";

const STATUS_TONE = {
  pending: "warning", accepted: "purple", rejected: "danger",
  in_progress: "purple", delivered: "warning", completed: "success",
};

export default function ProjectMonitoring() {
  const [projects, setProjects] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => api.get("/admin/projects").then((res) => setProjects(res.data.projects));
  useEffect(() => { load(); }, []);

  const verify = async (id, approve) => {
    setBusyId(id);
    try {
      await api.patch(`/admin/projects/${id}/verify-delivery`, { approve });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Project Monitoring</h1>
      {!projects ? (
        <Loader />
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <div key={p.id} className="glass rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold text-white">{p.project_title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{p.project_description}</p>
                </div>
                <Badge tone={STATUS_TONE[p.status] || "default"}>{p.status.replace("_", " ")}</Badge>
              </div>

              {p.status === "delivered" && !p.admin_approved && (
                <div className="flex gap-3 mt-4">
                  {p.delivered_file_url && (
                    <a href={p.delivered_file_url} target="_blank" rel="noreferrer" className="text-xs text-brand-cyan underline self-center">
                      Preview delivered file
                    </a>
                  )}
                  <PrimaryButton className="text-sm px-4 py-2" disabled={busyId === p.id} onClick={() => verify(p.id, true)}>
                    Approve & Release Escrow
                  </PrimaryButton>
                  <OutlineButton className="text-sm px-4 py-2" disabled={busyId === p.id} onClick={() => verify(p.id, false)}>
                    Reject / Request Revision
                  </OutlineButton>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
