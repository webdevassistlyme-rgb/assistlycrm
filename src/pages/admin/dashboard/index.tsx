import AdminLayout from "../adminLayout";
import WorkspaceDashboard from "../../../components/WorkspaceDashboard";
import { getAuthUser } from "../../../api/auth";

export default function AdminDashboard() {
    const authUser = getAuthUser();
    const userName = authUser?.user.name || "Admin";

    return (
        <AdminLayout>
            <WorkspaceDashboard userName={userName} mode="admin" />
        </AdminLayout>
    );
}
