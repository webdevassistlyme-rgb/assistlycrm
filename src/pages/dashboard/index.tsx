import MainLayout from "../layout";
import WorkspaceDashboard from "../../components/WorkspaceDashboard";
import { getAuthUser } from "../../api/auth";

export default function Dashboard() {
    const authUser = getAuthUser();
    const userName = authUser?.user.name || "John";

    return (
        <MainLayout>
            <WorkspaceDashboard userName={userName} mode="employee" />
        </MainLayout>
    );
}
