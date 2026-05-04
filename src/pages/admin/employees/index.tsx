import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiArchive, FiBriefcase, FiCheck, FiChevronDown, FiClock, FiEdit2, FiEye, FiMail, FiPhone, FiPlus, FiSearch, FiX } from "react-icons/fi";
import AdminLayout from "../adminLayout";
import {
    archiveEmployee as archiveEmployeeRequest,
    createEmployee,
    getEmployees,
    updateEmployee,
    type Employee,
    type EmployeeStatus,
    type EmployeeInput,
} from "../../../api/employees";
import {
    createEmployeeNotice,
    getEmployeeNotices,
    type NoticeInput,
    type NoticeSeverity,
} from "../../../api/notices";
import { getRoles } from "../../../api/roles";
import { getEmployeeAttendance } from "../../../api/attendance";
import { getEmployeeTransactions } from "../../../api/employeeTransactions";

const teams = ["Sales", "Retention", "Enterprise", "Onboarding", "Renewals"];
const fallbackRoles = ["Sales Agent", "Team Lead", "Manager", "Support Agent"];
const statuses: EmployeeStatus[] = ["Active", "Training", "Paused", "Archived"];
const noticeSeverities: NoticeSeverity[] = ["Info", "Warning", "Critical"];
const todayInputValue = () => new Date().toISOString().slice(0, 10);

type CustomDropdownProps = {
    label: string;
    value: string;
    placeholder?: string;
    onOpen: () => void;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
};

function CustomDropdown({
    label,
    value,
    placeholder = "Select",
    onOpen,
    buttonRef,
}: CustomDropdownProps) {
    return (
        <div className="relative">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">{label}</span>
            <button
                ref={buttonRef}
                className="mt-2 flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 text-left text-sm font-semibold text-white outline-none transition hover:bg-white/[0.04] focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                type="button"
                onClick={onOpen}
            >
                <span className={value ? "text-white" : "text-white/35"}>{value || placeholder}</span>
                <FiChevronDown className="size-4 shrink-0 text-white/45" aria-hidden="true" />
            </button>
        </div>
    );
}

export default function AdminEmployees() {
    const roleButtonRef = useRef<HTMLButtonElement>(null);
    const statusButtonRef = useRef<HTMLButtonElement>(null);
    const queryClient = useQueryClient();
    const { data: employees = [], isLoading, isError } = useQuery({
        queryKey: ["employees"],
        queryFn: getEmployees,
    });
    const { data: roleRecords = [] } = useQuery({
        queryKey: ["roles"],
        queryFn: getRoles,
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit">("add");
    const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
    const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
    const [employeeRecordTab, setEmployeeRecordTab] = useState<"details" | "notices" | "attendance" | "transactions">("details");
    const [transactionDate, setTransactionDate] = useState(todayInputValue);
    const [noticeForm, setNoticeForm] = useState<NoticeInput>({
        title: "",
        message: "",
        severity: "Info",
        issuedBy: "Admin",
    });
    const [archiveTarget, setArchiveTarget] = useState<{ employee: Employee; id: string } | null>(null);
    const [archiveStep, setArchiveStep] = useState<1 | 2>(1);
    const [openDropdown, setOpenDropdown] = useState<"role" | "status" | null>(null);
    const [roleSearch, setRoleSearch] = useState("");
    const [newEmployee, setNewEmployee] = useState<EmployeeInput>({
        name: "",
        employeeCode: "",
        role: "Sales Agent",
        team: "Unassigned",
        email: "",
        phone: "",
        status: "Active",
    });

    const getDropdownStyle = (button: HTMLButtonElement | null) => {
        if (!button) {
            return undefined;
        }

        const rect = button.getBoundingClientRect();
        const menuHeight = 220;
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldOpenAbove = spaceBelow < menuHeight && rect.top > menuHeight;

        return {
            left: rect.left,
            top: shouldOpenAbove ? rect.top - menuHeight - 8 : rect.bottom + 8,
            width: rect.width,
        };
    };

    const dropdownConfigs = {
        role: {
            value: newEmployee.role,
            options: roleRecords.length ? roleRecords.map((role) => role.name) : fallbackRoles,
            searchable: true,
            search: roleSearch,
            buttonRef: roleButtonRef,
            onSearch: setRoleSearch,
            onChange: (role: string) => {
                setNewEmployee((employee) => ({ ...employee, role }));
                setRoleSearch("");
                setOpenDropdown(null);
            },
        },
        status: {
            value: newEmployee.status,
            options: statuses,
            searchable: false,
            search: "",
            buttonRef: statusButtonRef,
            onSearch: () => undefined,
            onChange: (status: string) => {
                setNewEmployee((employee) => ({ ...employee, status: status as EmployeeStatus }));
                setOpenDropdown(null);
            },
        },
    };

    const activeDropdown = openDropdown ? dropdownConfigs[openDropdown] : null;
    const activeDropdownOptions = activeDropdown
        ? activeDropdown.options.filter((option) => option.toLowerCase().includes(activeDropdown.search.toLowerCase()))
        : [];

    const activeEmployees = employees.filter((employee) => employee.status !== "Archived");
    const { data: employeeNotices = [] } = useQuery({
        queryKey: ["employee-notices", viewingEmployee?._id],
        queryFn: () => getEmployeeNotices(viewingEmployee?._id || ""),
        enabled: Boolean(viewingEmployee?._id),
    });
    const { data: employeeAttendance = [] } = useQuery({
        queryKey: ["employee-attendance", viewingEmployee?._id],
        queryFn: () => getEmployeeAttendance(viewingEmployee?._id || ""),
        enabled: Boolean(viewingEmployee?._id),
    });
    const { data: employeeTransactions = [] } = useQuery({
        queryKey: ["employee-transactions", viewingEmployee?._id, transactionDate],
        queryFn: () => getEmployeeTransactions(viewingEmployee?._id || "", transactionDate),
        enabled: Boolean(viewingEmployee?._id),
    });

    const invalidateEmployees = () => {
        queryClient.invalidateQueries({ queryKey: ["employees"] });
    };

    const createEmployeeMutation = useMutation({
        mutationFn: createEmployee,
        onSuccess: invalidateEmployees,
    });

    const updateEmployeeMutation = useMutation({
        mutationFn: ({ id, employee }: { id: string; employee: EmployeeInput }) => updateEmployee(id, employee),
        onSuccess: invalidateEmployees,
    });

    const archiveEmployeeMutation = useMutation({
        mutationFn: archiveEmployeeRequest,
        onSuccess: invalidateEmployees,
    });

    const createNoticeMutation = useMutation({
        mutationFn: ({ employeeId, notice }: { employeeId: string; notice: NoticeInput }) =>
            createEmployeeNotice(employeeId, notice),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employee-notices", viewingEmployee?._id] });
            setNoticeForm({ title: "", message: "", severity: "Info", issuedBy: "Admin" });
        },
    });

    const resetEmployeeForm = () => {
        setNewEmployee({
            name: "",
            employeeCode: "",
            role: "Sales Agent",
            team: "Unassigned",
            email: "",
            phone: "",
            status: "Active",
        });
        setEditingEmployeeId(null);
        setModalMode("add");
        setOpenDropdown(null);
        setRoleSearch("");
    };

    const openAddEmployeeModal = () => {
        resetEmployeeForm();
        setIsModalOpen(true);
    };

    const openEditEmployeeModal = (employee: Employee) => {
        setNewEmployee(employee);
        setEditingEmployeeId(employee._id);
        setModalMode("edit");
        setOpenDropdown(null);
        setIsModalOpen(true);
    };

    const archiveEmployee = (id: string) => {
        archiveEmployeeMutation.mutate(id);
        setArchiveTarget(null);
        setArchiveStep(1);
    };

    const openArchiveConfirm = (employee: Employee) => {
        setArchiveTarget({ employee, id: employee._id });
        setArchiveStep(1);
    };

    const closeEmployeeModal = () => {
        setIsModalOpen(false);
        resetEmployeeForm();
    };

    const handleSaveEmployee = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!newEmployee.name.trim() || !newEmployee.email.trim() || !newEmployee.employeeCode.trim()) {
            return;
        }

        if (editingEmployeeId) {
            updateEmployeeMutation.mutate({ id: editingEmployeeId, employee: newEmployee });
        } else {
            createEmployeeMutation.mutate(newEmployee);
        }
        closeEmployeeModal();
    };

    const handleIssueNotice = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!viewingEmployee || !noticeForm.title.trim() || !noticeForm.message.trim()) {
            return;
        }

        createNoticeMutation.mutate({ employeeId: viewingEmployee._id, notice: noticeForm });
    };

    const openEmployeeView = (employee: Employee) => {
        setViewingEmployee(employee);
        setEmployeeRecordTab("details");
        setTransactionDate(todayInputValue());
    };

    return (
        <AdminLayout>
            <section className="min-h-[calc(100vh-8.5rem)] rounded-lg border border-white/10 bg-[#090b13]/80">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Admin Employees</p>
                        <h2 className="mt-1 text-xl font-semibold text-white">Employees</h2>
                    </div>

                    <button
                        className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                        type="button"
                        onClick={openAddEmployeeModal}
                    >
                        <FiPlus className="size-4" aria-hidden="true" />
                        Add Employee
                    </button>
                </div>

                <div className="grid gap-2.5 p-4 md:grid-cols-3">
                    {[
                        ["Employees", employees.length.toString()],
                        ["Active", activeEmployees.filter((employee) => employee.status === "Active").length.toString()],
                        ["Teams", teams.length.toString()],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3">
                            <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-white/35">{label}</p>
                            <p className="mt-1 text-xl font-semibold text-white">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="px-4 pb-4">
                    <div className="overflow-hidden rounded-lg border border-white/10">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[56rem] text-left">
                                <thead className="border-b border-white/10 bg-white/[0.03]">
                                    <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                                        <th className="px-5 py-3">Employee</th>
                                        <th className="px-5 py-3">Role</th>
                                        <th className="px-5 py-3">Code</th>
                                        <th className="px-5 py-3">Team</th>
                                        <th className="px-5 py-3">Contact</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {isLoading && (
                                        <tr>
                                            <td className="px-5 py-8 text-center text-sm text-white/45" colSpan={7}>
                                                Loading employees...
                                            </td>
                                        </tr>
                                    )}
                                    {isError && (
                                        <tr>
                                            <td className="px-5 py-8 text-center text-sm text-red-200" colSpan={7}>
                                                Unable to load employees. Check that the backend is running.
                                            </td>
                                        </tr>
                                    )}
                                    {!isLoading && !isError && activeEmployees.length === 0 && (
                                        <tr>
                                            <td className="px-5 py-8 text-center text-sm text-white/45" colSpan={7}>
                                                No employees yet.
                                            </td>
                                        </tr>
                                    )}
                                    {activeEmployees.map((employee) => (
                                        <tr key={employee.email} className="text-sm transition hover:bg-white/[0.04]">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex size-9 items-center justify-center rounded-lg bg-white/[0.06] text-sm font-semibold text-white/75">
                                                        {employee.name.charAt(0)}
                                                    </span>
                                                    <span className="font-semibold text-white">{employee.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-white/65">{employee.role}</td>
                                            <td className="px-5 py-4 text-white/65">{employee.employeeCode}</td>
                                            <td className="px-5 py-4 text-white/65">{employee.team}</td>
                                            <td className="px-5 py-4">
                                                <div className="space-y-1 text-white/65">
                                                    <a className="flex items-center gap-2 transition hover:text-white" href={`mailto:${employee.email}`}>
                                                        <FiMail className="size-3.5" aria-hidden="true" />
                                                        {employee.email}
                                                    </a>
                                                    <a className="flex items-center gap-2 transition hover:text-white" href={`tel:${employee.phone}`}>
                                                        <FiPhone className="size-3.5" aria-hidden="true" />
                                                        {employee.phone}
                                                    </a>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="rounded-md border border-[#842cff]/35 bg-[#842cff]/10 px-2 py-1 text-xs font-semibold text-[#b994ff]">
                                                    {employee.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                                        type="button"
                                                        aria-label={`Edit ${employee.name}`}
                                                        onClick={() => openEditEmployeeModal(employee)}
                                                    >
                                                        <FiEdit2 className="size-4" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                                        type="button"
                                                        aria-label={`View ${employee.name}`}
                                                        onClick={() => openEmployeeView(employee)}
                                                    >
                                                        <FiEye className="size-4" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                                        type="button"
                                                        aria-label={`Archive ${employee.name}`}
                                                        onClick={() => openArchiveConfirm(employee)}
                                                    >
                                                        <FiArchive className="size-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {isModalOpen && (
                <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <form
                        className="modal-panel-enter flex max-h-[88vh] w-full max-w-[30rem] flex-col rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40"
                        onSubmit={handleSaveEmployee}
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                            <div>
                                <h3 className="text-base font-semibold text-white">
                                    {modalMode === "add" ? "Add Employee" : "Edit Employee"}
                                </h3>
                                <p className="mt-1 text-sm text-white/45">Create an employee profile.</p>
                            </div>
                            <button
                                className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                aria-label="Close add employee modal"
                                onClick={closeEmployeeModal}
                            >
                                <FiX className="size-4" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="content-scroll grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Full Name</span>
                                <input
                                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                    value={newEmployee.name}
                                    onChange={(event) => setNewEmployee((employee) => ({ ...employee, name: event.target.value }))}
                                    placeholder="Employee name"
                                />
                            </label>

                            <CustomDropdown
                                label="Role"
                                value={newEmployee.role}
                                onOpen={() => setOpenDropdown((current) => (current === "role" ? null : "role"))}
                                buttonRef={roleButtonRef}
                            />

                            <CustomDropdown
                                label="Status"
                                value={newEmployee.status}
                                onOpen={() => setOpenDropdown((current) => (current === "status" ? null : "status"))}
                                buttonRef={statusButtonRef}
                            />

                            <label className="sm:col-span-2">
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Employee Code</span>
                                <input
                                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                    value={newEmployee.employeeCode}
                                    onChange={(event) => setNewEmployee((employee) => ({ ...employee, employeeCode: event.target.value }))}
                                    placeholder="EMP-1001"
                                />
                            </label>

                            <label className="sm:col-span-2">
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Email</span>
                                <input
                                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                    type="email"
                                    value={newEmployee.email}
                                    onChange={(event) => setNewEmployee((employee) => ({ ...employee, email: event.target.value }))}
                                    placeholder="employee@assistly.com"
                                />
                            </label>

                            <label>
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Phone</span>
                                <input
                                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                    value={newEmployee.phone}
                                    onChange={(event) => setNewEmployee((employee) => ({ ...employee, phone: event.target.value }))}
                                    placeholder="+1 (415) 555-0101"
                                />
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-3.5">
                            <button
                                className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                onClick={() => {
                                    closeEmployeeModal();
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                type="submit"
                            >
                                <FiPlus className="size-4" aria-hidden="true" />
                                {modalMode === "add" ? "Add Employee" : "Save Employee"}
                            </button>
                        </div>
                    </form>

                    {activeDropdown && (
                        <div
                            className="fixed z-[60] overflow-hidden rounded-lg border border-white/10 bg-[#11141d] shadow-2xl shadow-black/40"
                            style={getDropdownStyle(activeDropdown.buttonRef.current)}
                        >
                            {activeDropdown.searchable && (
                                <label className="flex h-10 items-center gap-2 border-b border-white/10 px-3 text-white/45">
                                    <FiSearch className="size-4 shrink-0" aria-hidden="true" />
                                    <input
                                        className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                                        value={activeDropdown.search}
                                        onChange={(event) => activeDropdown.onSearch(event.target.value)}
                                        placeholder="Search"
                                    />
                                </label>
                            )}
                            <div className="max-h-44 overflow-y-auto py-1">
                                {activeDropdownOptions.map((option) => (
                                    <button
                                        key={option}
                                        className="flex h-10 w-full items-center justify-between gap-3 px-3 text-left text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                        type="button"
                                        onClick={() => activeDropdown.onChange(option)}
                                    >
                                        {option}
                                        {activeDropdown.value === option && (
                                            <FiCheck className="size-4 text-[#b994ff]" aria-hidden="true" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {viewingEmployee && (
                <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <section className="modal-panel-enter flex max-h-[90vh] w-full max-w-[58rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40">
                        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(132,44,255,0.16),transparent_34%),#0d1018] px-5 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-[#842cff]/35 bg-[#842cff]/15 text-lg font-bold text-white">
                                        {viewingEmployee.name
                                            .split(" ")
                                            .map((part) => part[0])
                                            .join("")
                                            .slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="truncate text-xl font-semibold text-white">{viewingEmployee.name}</h3>
                                            <span className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-200">
                                                {viewingEmployee.status}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/50">
                                            <span className="font-semibold text-white/70">{viewingEmployee.role}</span>
                                            <span>{viewingEmployee.team}</span>
                                            <span>Code {viewingEmployee.employeeCode}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <a
                                        className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                        href={`tel:${viewingEmployee.phone}`}
                                        aria-label="Call employee"
                                    >
                                        <FiPhone className="size-4" aria-hidden="true" />
                                    </a>
                                    <a
                                        className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                        href={`mailto:${viewingEmployee.email}`}
                                        aria-label="Email employee"
                                    >
                                        <FiMail className="size-4" aria-hidden="true" />
                                    </a>
                                    <button
                                        className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                        type="button"
                                        aria-label="Close employee view"
                                        onClick={() => setViewingEmployee(null)}
                                    >
                                        <FiX className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="content-scroll overflow-y-auto p-5">
                            <div className="mb-5 flex items-center gap-7 border-b border-white/10">
                                {[
                                    ["details", "Emp Details"],
                                    ["notices", "Notices"],
                                    ["attendance", "Attendance"],
                                    ["transactions", "Transactions"],
                                ].map(([tab, label]) => (
                                    <button
                                        key={tab}
                                        className={[
                                            "relative h-11 px-0 text-sm font-semibold transition after:absolute after:bottom-[-1px] after:left-0 after:h-0.5 after:w-full after:rounded-full after:transition",
                                            employeeRecordTab === tab
                                                ? "text-[#b994ff] after:bg-[#842cff]"
                                                : "text-white/45 after:bg-transparent hover:text-white/75",
                                        ].join(" ")}
                                        type="button"
                                        onClick={() => setEmployeeRecordTab(tab as "details" | "notices" | "attendance" | "transactions")}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {employeeRecordTab === "details" && (
                                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <FiBriefcase className="size-4 text-[#b994ff]" aria-hidden="true" />
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Employee Details</p>
                                        </div>
                                        <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/55">
                                            Admin view
                                        </span>
                                    </div>
                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        {[
                                            ["Email", viewingEmployee.email],
                                            ["Phone", viewingEmployee.phone],
                                            ["Team", viewingEmployee.team],
                                            ["Employee Code", viewingEmployee.employeeCode],
                                            ["Role", viewingEmployee.role],
                                            ["Status", viewingEmployee.status],
                                        ].map(([label, value]) => (
                                            <div key={label} className="rounded-lg border border-white/10 bg-black/20 p-4">
                                                <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/35">{label}</p>
                                                <p className="mt-2 break-words text-sm font-semibold text-white/75">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {employeeRecordTab === "notices" && (
                                <div className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
                                    <form className="rounded-lg border border-white/10 bg-white/[0.04] p-4" onSubmit={handleIssueNotice}>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Issue Notice</p>
                                            <p className="mt-1 text-sm text-white/45">Attach an admin notice to this employee record.</p>
                                        </div>
                                        <div className="mt-4 flex rounded-lg border border-white/10 bg-black/20 p-1">
                                            {noticeSeverities.map((severity) => (
                                                <button
                                                    key={severity}
                                                    className={[
                                                        "h-8 flex-1 rounded-md px-2 text-xs font-semibold transition",
                                                        noticeForm.severity === severity
                                                            ? "bg-white text-[#070910]"
                                                            : "text-white/55 hover:text-white",
                                                    ].join(" ")}
                                                    type="button"
                                                    onClick={() => setNoticeForm((notice) => ({ ...notice, severity }))}
                                                >
                                                    {severity}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-3 grid gap-3">
                                            <input
                                                className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                value={noticeForm.title}
                                                onChange={(event) => setNoticeForm((notice) => ({ ...notice, title: event.target.value }))}
                                                placeholder="Notice title"
                                            />
                                            <textarea
                                                className="min-h-28 resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-semibold text-white outline-none placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                value={noticeForm.message}
                                                onChange={(event) => setNoticeForm((notice) => ({ ...notice, message: event.target.value }))}
                                                placeholder="Write the notice"
                                            />
                                            <button
                                                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110"
                                                type="submit"
                                            >
                                                <FiPlus className="size-4" aria-hidden="true" />
                                                Issue Notice
                                            </button>
                                        </div>
                                    </form>

                                    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Notice History</p>
                                                <p className="mt-1 text-sm text-white/45">{employeeNotices.length} records attached</p>
                                            </div>
                                            <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/55">
                                                Admin view
                                            </span>
                                        </div>

                                        <div className="mt-5 space-y-4">
                                            {employeeNotices.length === 0 && (
                                                <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-6 text-center">
                                                    <p className="text-sm font-semibold text-white/70">No notices issued</p>
                                                    <p className="mt-1 text-sm text-white/40">New admin notices will appear in this employee record.</p>
                                                </div>
                                            )}
                                            {employeeNotices.map((notice) => (
                                                <article key={notice._id} className="relative pl-6">
                                                    <span
                                                        className={[
                                                            "absolute left-0 top-1.5 size-2.5 rounded-full",
                                                            notice.severity === "Critical"
                                                                ? "bg-rose-400"
                                                                : notice.severity === "Warning"
                                                                  ? "bg-amber-300"
                                                                  : "bg-[#8b3dff]",
                                                        ].join(" ")}
                                                        aria-hidden="true"
                                                    />
                                                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <h4 className="text-sm font-semibold text-white">{notice.title}</h4>
                                                            <span
                                                                className={[
                                                                    "rounded-md px-2 py-1 text-xs font-semibold",
                                                                    notice.severity === "Critical"
                                                                        ? "bg-rose-500/10 text-rose-200"
                                                                        : notice.severity === "Warning"
                                                                          ? "bg-amber-400/10 text-amber-200"
                                                                          : "bg-white/[0.06] text-white/55",
                                                                ].join(" ")}
                                                            >
                                                                {notice.severity}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-sm leading-6 text-white/60">{notice.message}</p>
                                                        <p className="mt-3 text-xs text-white/35">
                                                            Issued by {notice.issuedBy} · {new Date(notice.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            )}

                            {employeeRecordTab === "attendance" && (
                                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Attendance</p>
                                            <p className="mt-1 text-sm text-white/45">{employeeAttendance.length} time-in records</p>
                                        </div>
                                        <span className="rounded-md border border-white/10 bg-black/20 px-2.5 py-1 text-xs font-semibold text-white/55">
                                            Login tracked
                                        </span>
                                    </div>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/35">Total Time In</p>
                                            <p className="mt-2 text-2xl font-semibold text-white">{employeeAttendance.length}</p>
                                        </div>
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/35">Latest</p>
                                            <p className="mt-2 text-sm font-semibold text-white">
                                                {employeeAttendance[0]
                                                    ? new Date(employeeAttendance[0].timeIn).toLocaleString()
                                                    : "No login yet"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {employeeAttendance.length === 0 && (
                                            <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-6 text-center">
                                                <FiClock className="mx-auto size-5 text-white/35" aria-hidden="true" />
                                                <p className="mt-2 text-sm font-semibold text-white/70">No attendance yet</p>
                                                <p className="mt-1 text-sm text-white/40">Employee login will create the first time-in record.</p>
                                            </div>
                                        )}
                                        {employeeAttendance.map((attendance) => (
                                            <article key={attendance._id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#842cff]/25 bg-[#842cff]/10 text-[#b994ff]">
                                                    <FiClock className="size-4" aria-hidden="true" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-white">Time in</p>
                                                    <p className="mt-1 text-sm text-white/45">{new Date(attendance.timeIn).toLocaleString()}</p>
                                                </div>
                                                <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-semibold text-white/55">
                                                    {attendance.source}
                                                </span>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {employeeRecordTab === "transactions" && (
                                <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Transactions</p>
                                            <p className="mt-1 text-sm text-white/45">Activities completed during the selected shift date.</p>
                                        </div>
                                        <label className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white/70">
                                            <span className="text-xs uppercase tracking-[0.12em] text-white/35">Date</span>
                                            <input
                                                className="bg-transparent text-sm font-semibold text-white outline-none [color-scheme:dark]"
                                                type="date"
                                                value={transactionDate}
                                                onChange={(event) => setTransactionDate(event.target.value)}
                                            />
                                        </label>
                                    </div>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/35">Activities</p>
                                            <p className="mt-2 text-2xl font-semibold text-white">{employeeTransactions.length}</p>
                                        </div>
                                        <div className="rounded-lg border border-white/10 bg-black/20 p-3 sm:col-span-2">
                                            <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/35">Shift Date</p>
                                            <p className="mt-2 text-sm font-semibold text-white">
                                                {transactionDate ? new Date(`${transactionDate}T00:00:00`).toLocaleDateString() : "All dates"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {employeeTransactions.length === 0 && (
                                            <div className="rounded-lg border border-dashed border-white/10 bg-black/20 p-6 text-center">
                                                <p className="text-sm font-semibold text-white/70">No transactions found</p>
                                                <p className="mt-1 text-sm text-white/40">Login and employee actions will show here for the selected date.</p>
                                            </div>
                                        )}
                                        {employeeTransactions.map((transaction) => (
                                            <article key={transaction._id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                                                <div className="mt-0.5 rounded-md border border-[#842cff]/25 bg-[#842cff]/10 px-2 py-1 text-xs font-semibold text-[#b994ff]">
                                                    {transaction.category}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <p className="text-sm font-semibold text-white">{transaction.title}</p>
                                                        <time className="text-xs text-white/35">
                                                            {new Date(transaction.occurredAt).toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </time>
                                                    </div>
                                                    <p className="mt-1 text-sm leading-6 text-white/55">{transaction.description}</p>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </section>
                </div>
            )}

            {archiveTarget && (
                <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <section className="modal-panel-enter w-full max-w-[28rem] rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40">
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {archiveStep === 1 ? "Archive Employee" : "Confirm Archive"}
                                </h3>
                                <p className="mt-1 text-sm text-white/45">
                                    {archiveStep === 1
                                        ? "You are about to delete this employee from active records."
                                        : "Confirm delete. This will archive the employee instead of permanently deleting."}
                                </p>
                            </div>
                            <button
                                className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                aria-label="Close archive confirmation"
                                onClick={() => {
                                    setArchiveTarget(null);
                                    setArchiveStep(1);
                                }}
                            >
                                <FiX className="size-4" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="p-5">
                            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Employee</p>
                                <p className="mt-2 text-sm font-semibold text-white">{archiveTarget.employee.name}</p>
                                <p className="mt-1 text-sm text-white/45">{archiveTarget.employee.email}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-4">
                            <button
                                className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                onClick={() => {
                                    setArchiveTarget(null);
                                    setArchiveStep(1);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex h-10 items-center gap-2 rounded-lg border border-red-400/25 bg-red-400/15 px-4 text-sm font-semibold text-red-100 transition hover:bg-red-400/25 focus:outline-none focus:ring-2 focus:ring-red-400/40"
                                type="button"
                                onClick={() => {
                                    if (archiveStep === 1) {
                                        setArchiveStep(2);
                                        return;
                                    }

                                    archiveEmployee(archiveTarget.id);
                                }}
                            >
                                <FiArchive className="size-4" aria-hidden="true" />
                                {archiveStep === 1 ? "Yes" : "Confirm Delete"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </AdminLayout>
    );
}
