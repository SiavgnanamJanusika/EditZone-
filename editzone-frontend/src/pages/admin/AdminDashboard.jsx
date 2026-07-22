import { useEffect, useState } from "react";
import { Users, Clapperboard, FolderKanban, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Loader } from "../../components/common/UI";
import api from "../../services/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/dashboard-stats").then((res) => setStats(res.data));
  }, []);

  const cards = stats && [
    { icon: Users, label: "Total Clients", value: stats.total_users },
    { icon: Clapperboard, label: "Total Editors", value: stats.total_editors },
    { icon: FolderKanban, label: "Total Projects", value: stats.total_projects },
    { icon: CheckCircle2, label: "Completed Projects", value: stats.completed_projects },
    { icon: Clock, label: "Pending Verification", value: stats.pending_verification },
    { icon: DollarSign, label: "Total Revenue", value: `$${stats.total_revenue}` },
    { icon: DollarSign, label: "Platform Commission", value: `$${stats.total_platform_commission}` },
  ];

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Admin Overview</h1>
      {!stats ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass rounded-xl p-6">
              <Icon className="text-brand-cyan mb-3" size={24} />
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-sm text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
