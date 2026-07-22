import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Loader, Badge } from "../../components/common/UI";
import api from "../../services/api";

export default function UserManagement() {
  const [users, setUsers] = useState(null);

  const load = () => api.get("/admin/users").then((res) => setUsers(res.data.users));
  useEffect(() => { load(); }, []);

  const toggleBan = async (id, isBanned) => {
    await api.patch(`/admin/users/${id}/ban`, { is_banned: !isBanned });
    load();
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">User Management</h1>
      {!users ? (
        <Loader />
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-brand-border">
                <th className="p-4">Username</th>
                <th className="p-4">Email</th>
                <th className="p-4">District</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-brand-border last:border-0">
                  <td className="p-4 text-white">{u.username}</td>
                  <td className="p-4 text-gray-400">{u.email}</td>
                  <td className="p-4 text-gray-400">{u.district || "-"}</td>
                  <td className="p-4">
                    <Badge tone={u.is_banned ? "danger" : "success"}>{u.is_banned ? "Banned" : "Active"}</Badge>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleBan(u.id, u.is_banned)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-brand-border text-brand-cyan hover:border-brand-blue"
                    >
                      {u.is_banned ? "Unban" : "Ban"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
