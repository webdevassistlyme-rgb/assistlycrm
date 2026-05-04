import { api } from "../lib/api";

export type AttendanceRecord = {
    _id: string;
    employee: string;
    timeIn: string;
    source: "Login";
    createdAt: string;
};

export async function getEmployeeAttendance(employeeId: string) {
    const response = await api.get<AttendanceRecord[]>(`/employees/${employeeId}/attendance`);
    return response.data;
}
