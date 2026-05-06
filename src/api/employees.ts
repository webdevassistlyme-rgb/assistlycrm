import { api } from "../lib/api";

export type EmployeeStatus = "Active" | "Training" | "Paused" | "Archived";

export type Employee = {
    _id: string;
    name: string;
    employeeCode: string;
    role: string;
    team: string;
    email: string;
    phone: string;
    salary: number;
    status: EmployeeStatus;
};

export type EmployeeInput = Omit<Employee, "_id">;

export async function getEmployees() {
    const response = await api.get<Employee[]>("/employees");
    return response.data;
}

export async function createEmployee(employee: EmployeeInput) {
    const response = await api.post<Employee>("/employees", employee);
    return response.data;
}

export async function updateEmployee(id: string, employee: EmployeeInput) {
    const response = await api.put<Employee>(`/employees/${id}`, employee);
    return response.data;
}

export async function archiveEmployee(id: string) {
    const response = await api.patch<Employee>(`/employees/${id}/archive`);
    return response.data;
}
