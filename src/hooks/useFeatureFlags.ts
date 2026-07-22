import { useQuery } from "@tanstack/react-query";
import { getFeatures, type FeatureKey } from "../api/features";

export function useFeatureFlags() {
    const query = useQuery({
        queryKey: ["features"],
        queryFn: getFeatures,
        staleTime: 10 * 60 * 1000,
    });

    const isEnabled = (key: FeatureKey, scope: "admin" | "employee") => {
        const feature = query.data?.find((item) => item.key === key);

        if (!feature) {
            return true;
        }

        return scope === "admin" ? feature.adminEnabled : feature.employeeEnabled;
    };

    return { ...query, isEnabled };
}
