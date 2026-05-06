import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    FiBriefcase,
    FiCheck,
    FiCheckCircle,
    FiChevronDown,
    FiChevronLeft,
    FiChevronRight,
    FiCreditCard,
    FiDownload,
    FiEye,
    FiFileText,
    FiFilter,
    FiPlus,
    FiPrinter,
    FiRotateCcw,
    FiSearch,
    FiArchive,
    FiTarget,
    FiUsers,
    FiX,
} from "react-icons/fi";
import AdminLayout from "../adminLayout";
import {
    archivePayrollItem,
    archivePayrollRecord,
    createPayrollItem,
    createPayrollRecord,
    getPayrollItems,
    getPayrollRecords,
    getPayrollStats,
    markPayrollRecordPaid,
    restorePayrollItem,
    restorePayrollRecord,
    runPayroll,
    updatePayrollRecord,
    type PayrollItemCategory,
    type PayrollListItem,
    type PayrollPayType,
    type PayrollRecord,
    type PayrollRecordInput,
    type PayrollStatus,
} from "../../../api/payroll";
import { getSystemSettings } from "../../../api/systemSettings";
import { DataTableSortHeader } from "../../../components/admin/DataTable";
import { formatCurrency } from "../../../lib/currency";

const payrollTabs = ["Employee Payroll", "Payroll Runs", "Payouts", "Deductions", "Tax Settings", "Archived"] as const;
const statusOptions: PayrollStatus[] = ["Pending", "Paid", "Failed", "Completed", "Review", "Applied", "Enabled"];

const emptyRecordForm: PayrollRecordInput = {
    employeeName: "",
    email: "",
    employeeId: "",
    department: "",
    payType: "Monthly",
    grossPay: 0,
    deductions: 0,
    status: "Pending",
    paidOn: "-",
    payPeriod: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
};

const emptyItemForm = {
    name: "",
    second: "",
    third: "",
    fourth: "",
    status: "Pending" as PayrollStatus,
};

const statusClass: Record<string, string> = {
    Paid: "bg-emerald-400/10 text-emerald-200",
    Pending: "bg-white/[0.06] text-white/55",
    Failed: "bg-red-500/15 text-red-200",
    Completed: "bg-sky-400/10 text-sky-100",
    Review: "bg-yellow-400/10 text-yellow-100/85",
    Applied: "bg-violet-400/10 text-violet-100",
    Enabled: "bg-emerald-400/10 text-emerald-200",
};

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${statusClass[status] || "bg-white/[0.06] text-white/55"}`}>
            <span className="size-1.5 rounded-full bg-current" />
            {status}
        </span>
    );
}

const numberWordsUnderTwenty = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
];
const numberWordsTens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numberToWords(value: number): string {
    const wholeValue = Math.max(0, Math.floor(value));

    if (wholeValue < 20) return numberWordsUnderTwenty[wholeValue];
    if (wholeValue < 100) {
        const tens = Math.floor(wholeValue / 10);
        const remainder = wholeValue % 10;
        return `${numberWordsTens[tens]}${remainder ? ` ${numberWordsUnderTwenty[remainder]}` : ""}`;
    }
    if (wholeValue < 1000) {
        const hundreds = Math.floor(wholeValue / 100);
        const remainder = wholeValue % 100;
        return `${numberWordsUnderTwenty[hundreds]} Hundred${remainder ? ` ${numberToWords(remainder)}` : ""}`;
    }
    if (wholeValue < 1000000) {
        const thousands = Math.floor(wholeValue / 1000);
        const remainder = wholeValue % 1000;
        return `${numberToWords(thousands)} Thousand${remainder ? ` ${numberToWords(remainder)}` : ""}`;
    }

    const millions = Math.floor(wholeValue / 1000000);
    const remainder = wholeValue % 1000000;
    return `${numberToWords(millions)} Million${remainder ? ` ${numberToWords(remainder)}` : ""}`;
}

function PayslipDocument({
    record,
    money,
}: {
    record: PayrollRecord;
    money: (value?: number) => string;
}) {
    const payDate = record.paidOn && record.paidOn !== "-" ? record.paidOn : new Date().toLocaleDateString("en-US");

    return (
        <div className="payslip-print bg-white p-8 text-[11px] leading-tight text-black">
            <div className="text-center">
                <h1 className="text-sm font-bold">Payslip</h1>
                <p className="mt-2 font-semibold">Assistly</p>
                <p className="mt-1 font-semibold">P2 33 Purok 5 Bakakeng Norte, Baguio City Philippines</p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-12">
                <div className="grid grid-cols-[6rem_0.5rem_1fr] gap-y-2">
                    <span>Pay Date</span><span>:</span><span>{payDate}</span>
                    <span>Working Days</span><span>:</span><span>-</span>
                    <span>Pay period</span><span>:</span><span>{record.payPeriod}</span>
                    <span>Calculated Per Day</span><span>:</span><span>-</span>
                    <span>Monthly Basic Rate</span><span>:</span><span>{money(record.grossPay)}</span>
                </div>
                <div className="grid grid-cols-[6.5rem_0.5rem_1fr] content-start gap-y-2">
                    <span>Employee Name</span><span>:</span><span>{record.employeeName}</span>
                    <span>Employee ID</span><span>:</span><span>{record.employeeId}</span>
                </div>
            </div>

            <table className="mt-12 w-full border-collapse text-[11px]">
                <thead>
                    <tr className="bg-neutral-300">
                        <th className="w-[32%] border border-black px-1 py-1 text-center font-bold">Earnings</th>
                        <th className="w-[18%] border border-black px-1 py-1 text-center font-bold">Amount</th>
                        <th className="w-[32%] border border-black px-1 py-1 text-center font-bold">Deductions</th>
                        <th className="w-[18%] border border-black px-1 py-1 text-center font-bold">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border-x border-black px-1 py-1 align-top">Basic Pay</td>
                        <td className="border-x border-black px-1 py-1 text-right align-top">{money(record.grossPay)}</td>
                        <td className="border-x border-black px-1 py-1 align-top">Payroll deductions</td>
                        <td className="border-x border-black px-1 py-1 text-right align-top">{money(record.deductions)}</td>
                    </tr>
                    <tr>
                        <td className="border-x border-black px-1 py-8"></td>
                        <td className="border-x border-black px-1 py-8"></td>
                        <td className="border-x border-black px-1 py-8"></td>
                        <td className="border-x border-black px-1 py-8"></td>
                    </tr>
                    <tr>
                        <td className="border-x border-b border-black px-1 py-1 text-right">Total Earnings</td>
                        <td className="border-x border-b border-black px-1 py-1 text-right">{money(record.grossPay)}</td>
                        <td className="border-x border-b border-black px-1 py-1 text-right">
                            <div>Total Deductions</div>
                            <div>Net Pay</div>
                        </td>
                        <td className="border-x border-b border-black px-1 py-1 text-right">
                            <div>{money(record.deductions)}</div>
                            <div>{money(record.netPay)}</div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="mt-10 text-center">
                <p>{money(record.netPay)}</p>
                <p className="mt-2">{numberToWords(record.netPay)}</p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-24 text-center">
                <div>
                    <p>Employer Signature</p>
                    <div className="mx-auto mt-14 w-40 border-t border-black" />
                </div>
                <div>
                    <p>Employee Signature</p>
                    <div className="mx-auto mt-14 w-40 border-t border-black" />
                </div>
            </div>

            <p className="mt-7 text-center">This is system generated payslip</p>
        </div>
    );
}

function ArchivedPanel({
    title,
    rows,
    isLoading,
    isError,
    emptyText,
}: {
    title: string;
    rows: Array<{
        id: string;
        primary: string;
        secondary: string;
        detail: string;
        status: PayrollStatus;
        onRestore: () => void;
    }>;
    isLoading: boolean;
    isError: boolean;
    emptyText: string;
}) {
    return (
        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80 shadow-2xl shadow-black/20">
            <div className="flex min-h-14 items-center justify-between border-b border-white/10 px-5">
                <div>
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-xs text-white/40">Restore archived records back to active payroll.</p>
                </div>
            </div>
            <div className="content-scroll max-h-[calc(100vh-24rem)] overflow-auto">
                {isLoading && <p className="px-5 py-5 text-sm text-white/45">Loading archived records...</p>}
                {isError && <p className="px-5 py-5 text-sm text-red-200">Unable to load archived records.</p>}
                {!isLoading && !isError && rows.length === 0 && <p className="px-5 py-5 text-sm text-white/45">{emptyText}</p>}
                {!isLoading && !isError && rows.length > 0 && (
                    <div className="divide-y divide-white/10">
                        {rows.map((row) => (
                            <article key={row.id} className="flex items-center justify-between gap-4 px-5 py-4 text-sm transition hover:bg-white/[0.035]">
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-white">{row.primary}</p>
                                    <p className="mt-1 truncate text-xs text-white/45">{row.secondary}</p>
                                    <p className="mt-1 truncate text-xs text-white/55">{row.detail || "No details"}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <StatusBadge status={row.status} />
                                    <button
                                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-300/15"
                                        type="button"
                                        onClick={row.onRestore}
                                    >
                                        <FiRotateCcw className="size-4" aria-hidden="true" />
                                        Restore
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default function PayrollPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<(typeof payrollTabs)[number]>("Employee Payroll");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All statuses");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState("employeeId");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [recordModal, setRecordModal] = useState<{ mode: "add" | "edit"; record?: PayrollRecord } | null>(null);
    const [viewingRecord, setViewingRecord] = useState<PayrollRecord | null>(null);
    const [payslipRecord, setPayslipRecord] = useState<PayrollRecord | null>(null);
    const [recordForm, setRecordForm] = useState<PayrollRecordInput>(emptyRecordForm);
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [itemForm, setItemForm] = useState(emptyItemForm);
    const [deleteTarget, setDeleteTarget] = useState<{ type: "record"; record: PayrollRecord } | { type: "item"; item: PayrollListItem } | null>(null);
    const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
    const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

    const itemCategory = activeTab === "Employee Payroll" || activeTab === "Archived" ? undefined : (activeTab as PayrollItemCategory);

    const recordQueryParams = {
        search,
        status: statusFilter === "All statuses" ? undefined : statusFilter,
        sortBy,
        sortDir,
        archived: activeTab === "Archived",
    };

    const { data: stats } = useQuery({ queryKey: ["payroll-stats"], queryFn: getPayrollStats });
    const { data: systemSettings } = useQuery({ queryKey: ["system-settings"], queryFn: getSystemSettings });
    const { data: employees = [], isLoading: isPayrollLoading, isError: isPayrollError } = useQuery({
        queryKey: ["payroll-records", recordQueryParams],
        queryFn: () => getPayrollRecords(recordQueryParams),
        enabled: activeTab === "Employee Payroll" || activeTab === "Archived",
    });
    const { data: payrollItems = [], isLoading: areItemsLoading, isError: areItemsError } = useQuery({
        queryKey: ["payroll-items", itemCategory],
        queryFn: () => getPayrollItems(itemCategory),
        enabled: Boolean(itemCategory),
    });
    const { data: archivedPayrollItems = [], isLoading: areArchivedItemsLoading, isError: areArchivedItemsError } = useQuery({
        queryKey: ["payroll-items", "archived"],
        queryFn: () => getPayrollItems(undefined, { archived: true }),
        enabled: activeTab === "Archived",
    });

    const refreshPayroll = () => {
        queryClient.invalidateQueries({ queryKey: ["payroll-records"] });
        queryClient.invalidateQueries({ queryKey: ["payroll-items"] });
        queryClient.invalidateQueries({ queryKey: ["payroll-stats"] });
    };

    const createRecordMutation = useMutation({ mutationFn: createPayrollRecord, onSuccess: () => { refreshPayroll(); closeRecordModal(); } });
    const updateRecordMutation = useMutation({
        mutationFn: ({ id, record }: { id: string; record: PayrollRecordInput }) => updatePayrollRecord(id, record),
        onSuccess: () => { refreshPayroll(); closeRecordModal(); },
    });
    const markPaidMutation = useMutation({ mutationFn: markPayrollRecordPaid, onSuccess: refreshPayroll });
    const archiveRecordMutation = useMutation({ mutationFn: archivePayrollRecord, onSuccess: () => { refreshPayroll(); closeDeletePrompt(); } });
    const restoreRecordMutation = useMutation({ mutationFn: restorePayrollRecord, onSuccess: refreshPayroll });
    const runPayrollMutation = useMutation({ mutationFn: runPayroll, onSuccess: refreshPayroll });
    const createItemMutation = useMutation({
        mutationFn: createPayrollItem,
        onSuccess: () => {
            refreshPayroll();
            setItemModalOpen(false);
            setItemForm(emptyItemForm);
        },
    });
    const archiveItemMutation = useMutation({ mutationFn: archivePayrollItem, onSuccess: () => { refreshPayroll(); closeDeletePrompt(); } });
    const restoreItemMutation = useMutation({ mutationFn: restorePayrollItem, onSuccess: refreshPayroll });
    const money = (value = 0) => formatCurrency(value, systemSettings?.currencyCode || "USD");

    const totalPages = Math.max(Math.ceil(employees.length / pageSize), 1);
    const visibleEmployees = useMemo(() => employees.slice((page - 1) * pageSize, page * pageSize), [employees, page, pageSize]);
    const visibleEmployeeIds = visibleEmployees.map((employee) => employee._id);
    const selectedRecordIdSet = new Set(selectedRecordIds);
    const areAllVisibleSelected = visibleEmployeeIds.length > 0 && visibleEmployeeIds.every((id) => selectedRecordIdSet.has(id));

    const payrollStats = [
        { label: "Employees", value: String(stats?.totalEmployees ?? employees.length), icon: FiUsers },
        { label: "Gross", value: money(stats?.totalPayroll ?? 0), icon: FiBriefcase },
        { label: "Deductions", value: money(stats?.totalDeductions ?? 0), icon: FiTarget },
        { label: "Net", value: money(stats?.netPayroll ?? 0), icon: FiCreditCard },
        { label: "Paid", value: String(stats?.paidEmployees ?? 0), icon: FiCheckCircle },
    ];

    const changeSort = (field: string) => {
        setSortBy((current) => {
            if (current === field) {
                setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
                return current;
            }
            setSortDir("asc");
            return field;
        });
    };

    const openAddRecord = () => {
        setRecordForm(emptyRecordForm);
        setRecordModal({ mode: "add" });
    };

    const closeRecordModal = () => {
        setRecordModal(null);
        setRecordForm(emptyRecordForm);
    };

    const saveRecord = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!recordForm.employeeName.trim() || !recordForm.employeeId.trim()) return;

        if (recordModal?.mode === "edit" && recordModal.record) {
            updateRecordMutation.mutate({ id: recordModal.record._id, record: recordForm });
            return;
        }

        createRecordMutation.mutate(recordForm);
    };

    const saveItem = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!itemCategory || !itemForm.name.trim()) return;

        createItemMutation.mutate({ category: itemCategory, ...itemForm });
    };

    const exportCsv = () => {
        const header = ["Employee", "Email", "Employee ID", "Department", "Pay Type", "Gross Pay", "Deductions", "Net Pay", "Status", "Paid On", "Pay Period"];
        const rows = employees.map((employee) => [
            employee.employeeName,
            employee.email,
            employee.employeeId,
            employee.department,
            employee.payType,
            employee.grossPay,
            employee.deductions,
            employee.netPay,
            employee.status,
            employee.paidOn,
            employee.payPeriod,
        ]);
        const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "payroll.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const openDeletePrompt = (target: typeof deleteTarget) => {
        setDeleteTarget(target);
        setDeleteStep(1);
    };

    const closeDeletePrompt = () => {
        setDeleteTarget(null);
        setDeleteStep(1);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === "record") archiveRecordMutation.mutate(deleteTarget.record._id);
        if (deleteTarget.type === "item") archiveItemMutation.mutate(deleteTarget.item._id);
    };

    const toggleAllVisibleRecords = () => {
        setSelectedRecordIds((current) => {
            const currentIds = new Set(current);

            if (visibleEmployeeIds.every((id) => currentIds.has(id))) {
                visibleEmployeeIds.forEach((id) => currentIds.delete(id));
            } else {
                visibleEmployeeIds.forEach((id) => currentIds.add(id));
            }

            return Array.from(currentIds);
        });
    };

    const toggleRecordSelection = (recordId: string) => {
        setSelectedRecordIds((current) =>
            current.includes(recordId) ? current.filter((id) => id !== recordId) : [...current, recordId]
        );
    };

    const printPayslip = () => {
        window.print();
    };

    useEffect(() => {
        setSelectedRecordIds((current) => current.filter((id) => employees.some((employee) => employee._id === id)));
    }, [employees]);

    return (
        <AdminLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">Payroll</h2>
                        <p className="mt-1 text-sm text-white/50">Manage payroll, salaries, deductions and payments.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex h-11 w-[20rem] max-w-full items-center gap-3 rounded-lg border border-white/10 bg-[#090b13]/80 px-3 text-white/45 transition focus-within:border-[#842cff] focus-within:ring-2 focus-within:ring-[#842cff]/20">
                            <input
                                className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                                placeholder="Search employees..."
                                type="search"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                    setPage(1);
                                }}
                            />
                            <FiSearch className="size-4 shrink-0" aria-hidden="true" />
                        </label>
                        <div className="relative">
                            <button
                                className="flex h-11 min-w-[10rem] items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#090b13]/80 px-4 text-sm font-semibold text-white/75 transition hover:bg-white/10"
                                type="button"
                                onClick={() => setIsFilterOpen((open) => !open)}
                            >
                                <span className="inline-flex items-center gap-2"><FiFilter className="size-4" />{statusFilter}</span>
                                <FiChevronDown className={["size-4 text-white/40 transition", isFilterOpen ? "rotate-180" : ""].join(" ")} />
                            </button>
                            {isFilterOpen && (
                                <div className="absolute right-0 top-12 z-30 w-full min-w-[12rem] overflow-hidden rounded-lg border border-white/10 bg-[#0d1018] py-1 shadow-2xl shadow-black/40">
                                    {["All statuses", ...statusOptions].map((status) => (
                                        <button
                                            key={status}
                                            className={["flex h-10 w-full items-center justify-between px-3 text-left text-sm font-semibold transition", statusFilter === status ? "bg-[#842cff] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"].join(" ")}
                                            type="button"
                                            onClick={() => {
                                                setStatusFilter(status);
                                                setIsFilterOpen(false);
                                                setPage(1);
                                            }}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-[#090b13]/80 px-4 text-sm font-semibold text-white/75 transition hover:bg-white/10" type="button" onClick={exportCsv}>
                            <FiDownload className="size-4" aria-hidden="true" />
                            Export
                        </button>
                        {activeTab !== "Archived" && (
                            <button
                                className="flex h-11 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                                type="button"
                                disabled={runPayrollMutation.isPending}
                                onClick={() => runPayrollMutation.mutate(emptyRecordForm.payPeriod)}
                            >
                                <FiPlus className="size-4" aria-hidden="true" />
                                {runPayrollMutation.isPending ? "Running..." : "Run Payroll"}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-5 border-b border-white/10">
                    <div className="flex flex-wrap gap-3">
                        {payrollTabs.map((tab) => (
                            <button
                                key={tab}
                                className={["h-12 px-4 text-sm font-semibold transition", activeTab === tab ? "border-b-2 border-[#842cff] bg-[#842cff]/12 text-white" : "text-white/55 hover:text-white"].join(" ")}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === "Employee Payroll" && (
                    <>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <label className="flex h-10 items-center gap-3 rounded-lg border border-white/10 bg-[#090b13]/80 px-3 text-sm text-white/65">
                                <span>Show</span>
                                <select className="bg-transparent text-white outline-none" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
                                    <option className="bg-[#0d1018]">10</option>
                                    <option className="bg-[#0d1018]">25</option>
                                    <option className="bg-[#0d1018]">50</option>
                                </select>
                                <span>entries</span>
                            </label>
                            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2">
                                {payrollStats.map((stat) => {
                                    const Icon = stat.icon;

                                    return (
                                        <article
                                            key={stat.label}
                                            className="flex h-12 min-w-[7rem] items-center gap-2 rounded-lg border border-white/10 bg-[#0c1018]/85 px-2.5 shadow-lg shadow-black/10"
                                        >
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#842cff]/16 text-[#b78cff]">
                                                <Icon className="size-3.5" aria-hidden="true" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white/35">
                                                    {stat.label}
                                                </span>
                                                <span className="mt-0.5 block truncate text-sm font-semibold text-white">{stat.value}</span>
                                            </span>
                                        </article>
                                    );
                                })}
                            </div>
                            <button className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110" type="button" onClick={openAddRecord}>
                                <FiPlus className="size-4" aria-hidden="true" />
                                Add Employee Pay
                            </button>
                        </div>

                        <section className="mt-4 flex h-[calc(100vh-23rem)] min-h-[34rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80 shadow-2xl shadow-black/20">
                            <div className="content-scroll min-h-0 max-w-full flex-1 overflow-auto bg-[linear-gradient(to_bottom,#11151f_0,#11151f_3.25rem,transparent_3.25rem)] [scrollbar-gutter:stable]">
                                <table className="w-full min-w-[56rem] table-fixed border-separate border-spacing-0 text-left">
                                    <thead className="sticky top-0 z-10 bg-[#11151f] text-[0.74rem] font-medium text-white/65 shadow-[12px_0_0_#11151f]">
                                        <tr>
                                            <th className="w-[5%] px-4 py-4">
                                                <input
                                                    className="size-4 rounded border-white/20 bg-transparent accent-[#842cff]"
                                                    type="checkbox"
                                                    aria-label="Select all payroll rows"
                                                    checked={areAllVisibleSelected}
                                                    onChange={toggleAllVisibleRecords}
                                                />
                                            </th>
                                            <th className="w-[34%] px-4 py-4"><DataTableSortHeader field="employeeName" sortBy={sortBy} sortDir={sortDir} onSort={changeSort}>Employee</DataTableSortHeader></th>
                                            <th className="w-[16%] px-4 py-4"><DataTableSortHeader field="employeeId" sortBy={sortBy} sortDir={sortDir} onSort={changeSort}>Employee ID</DataTableSortHeader></th>
                                            <th className="w-[16%] px-4 py-4"><DataTableSortHeader field="netPay" sortBy={sortBy} sortDir={sortDir} onSort={changeSort}>Net Pay</DataTableSortHeader></th>
                                            <th className="w-[14%] px-4 py-4"><DataTableSortHeader field="status" sortBy={sortBy} sortDir={sortDir} onSort={changeSort}>Status</DataTableSortHeader></th>
                                            <th className="w-[15%] px-4 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {isPayrollLoading && <tr><td className="px-4 py-5 text-sm text-white/45" colSpan={6}>Loading payroll...</td></tr>}
                                        {isPayrollError && <tr><td className="px-4 py-5 text-sm text-red-200" colSpan={6}>Unable to load payroll.</td></tr>}
                                        {!isPayrollLoading && !isPayrollError && visibleEmployees.length === 0 && <tr><td className="px-4 py-5 text-sm text-white/45" colSpan={6}>No payroll records found.</td></tr>}
                                        {visibleEmployees.map((employee) => {
                                            const initials = employee.employeeName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

                                            return (
                                                <tr key={employee._id} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                                    <td className="px-4 py-3">
                                                        <input
                                                            className="size-4 rounded border-white/20 bg-transparent accent-[#842cff]"
                                                            type="checkbox"
                                                            aria-label={`Select ${employee.employeeName}`}
                                                            checked={selectedRecordIdSet.has(employee._id)}
                                                            onChange={() => toggleRecordSelection(employee._id)}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f2b08a,#3d241f)] text-xs font-bold text-white">{initials}</span>
                                                            <span className="min-w-0">
                                                                <span className="block truncate font-semibold text-white">{employee.employeeName}</span>
                                                                <span className="mt-0.5 block truncate text-xs text-white/45">{employee.email}</span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-white/75">{employee.employeeId}</td>
                                                    <td className="px-4 py-3 text-white">{money(employee.netPay)}</td>
                                                    <td className="px-4 py-3"><StatusBadge status={employee.status} /></td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex justify-center gap-1">
                                                            <button className="inline-flex size-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => setViewingRecord(employee)} aria-label={`View ${employee.employeeName}`}>
                                                                <FiEye className="size-4" />
                                                            </button>
                                                            <button className="inline-flex size-8 items-center justify-center rounded-lg text-[#cbb7ff] transition hover:bg-[#842cff]/10 hover:text-white" type="button" onClick={() => setPayslipRecord(employee)} aria-label={`Generate payslip for ${employee.employeeName}`}>
                                                                <FiFileText className="size-4" />
                                                            </button>
                                                            <button className="inline-flex size-8 items-center justify-center rounded-lg text-emerald-100/65 transition hover:bg-emerald-400/10 hover:text-emerald-100 disabled:opacity-35" type="button" disabled={employee.status === "Paid"} onClick={() => markPaidMutation.mutate(employee._id)} aria-label={`Mark ${employee.employeeName} paid`}>
                                                                <FiCheck className="size-4" />
                                                            </button>
                                                            <button className="inline-flex size-8 items-center justify-center rounded-lg text-yellow-100/65 transition hover:bg-yellow-400/10 hover:text-yellow-100" type="button" onClick={() => openDeletePrompt({ type: "record", record: employee })} aria-label={`Archive ${employee.employeeName}`}>
                                                                <FiArchive className="size-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
                                <p className="text-xs text-white/45">Showing {employees.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, employees.length)} of {employees.length} entries</p>
                                <div className="flex items-center gap-2">
                                    <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40" type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} aria-label="Previous page">
                                        <FiChevronLeft className="size-4" />
                                    </button>
                                    {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1).map((pageNumber) => (
                                        <button key={pageNumber} className={["flex size-8 items-center justify-center rounded-lg border text-sm font-semibold transition", pageNumber === page ? "border-[#842cff] bg-[#842cff] text-white" : "border-white/10 bg-white/[0.035] text-white/60 hover:bg-white/10 hover:text-white"].join(" ")} type="button" onClick={() => setPage(pageNumber)}>
                                            {pageNumber}
                                        </button>
                                    ))}
                                    {totalPages > 3 && <span className="px-2 text-sm text-white/40">...</span>}
                                    {totalPages > 3 && <button className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] px-2 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => setPage(totalPages)}>{totalPages}</button>}
                                    <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40" type="button" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(value + 1, totalPages))} aria-label="Next page">
                                        <FiChevronRight className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {activeTab === "Archived" && (
                    <section className="mt-5 grid gap-5 xl:grid-cols-2">
                        <ArchivedPanel
                            title="Archived Employee Payroll"
                            isLoading={isPayrollLoading}
                            isError={isPayrollError}
                            emptyText="No archived employee payroll records."
                            rows={employees.map((record) => ({
                                id: record._id,
                                primary: record.employeeName,
                                secondary: record.employeeId,
                                detail: `${record.payPeriod} · ${money(record.netPay)}`,
                                status: record.status,
                                onRestore: () => restoreRecordMutation.mutate(record._id),
                            }))}
                        />
                        <ArchivedPanel
                            title="Archived Payroll Items"
                            isLoading={areArchivedItemsLoading}
                            isError={areArchivedItemsError}
                            emptyText="No archived payroll items."
                            rows={archivedPayrollItems.map((item) => ({
                                id: item._id,
                                primary: item.name,
                                secondary: item.category,
                                detail: [item.second, item.third].filter(Boolean).join(" · "),
                                status: item.status,
                                onRestore: () => restoreItemMutation.mutate(item._id),
                            }))}
                        />
                    </section>
                )}

                {activeTab !== "Employee Payroll" && activeTab !== "Archived" && (
                    <section className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80 shadow-2xl shadow-black/20">
                        <div className="flex min-h-14 items-center justify-between border-b border-white/10 px-5">
                            <div>
                                <h3 className="text-base font-semibold text-white">{activeTab}</h3>
                                <p className="mt-1 text-xs text-white/40">Manage {activeTab.toLowerCase()} for payroll.</p>
                            </div>
                            <button className="flex h-9 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-3 text-sm font-semibold text-white transition hover:brightness-110" type="button" onClick={() => setItemModalOpen(true)}>
                                <FiPlus className="size-4" />
                                Add
                            </button>
                        </div>
                        <div className="content-scroll max-h-[calc(100vh-24rem)] overflow-auto bg-[linear-gradient(to_bottom,#11151f_0,#11151f_3rem,transparent_3rem)] [scrollbar-gutter:stable]">
                            <table className="w-full min-w-[54rem] table-fixed border-separate border-spacing-0 text-left">
                                <thead className="sticky top-0 z-10 bg-[#11151f] text-[0.74rem] font-medium text-white/65 shadow-[12px_0_0_#11151f]">
                                    <tr>
                                        <th className="w-[28%] px-4 py-4">{activeTab === "Tax Settings" ? "Setting" : "Name"}</th>
                                        <th className="w-[22%] px-4 py-4">{activeTab === "Payroll Runs" ? "Period" : activeTab === "Tax Settings" ? "Status" : "Scope"}</th>
                                        <th className="w-[22%] px-4 py-4">{activeTab === "Tax Settings" ? "Description" : "Amount"}</th>
                                        <th className="w-[18%] px-4 py-4">{activeTab === "Tax Settings" ? "Updated" : "Detail"}</th>
                                        <th className="w-[10%] px-4 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {areItemsLoading && <tr><td className="px-4 py-5 text-sm text-white/45" colSpan={5}>Loading {activeTab.toLowerCase()}...</td></tr>}
                                    {areItemsError && <tr><td className="px-4 py-5 text-sm text-red-200" colSpan={5}>Unable to load {activeTab.toLowerCase()}.</td></tr>}
                                    {!areItemsLoading && !areItemsError && payrollItems.length === 0 && <tr><td className="px-4 py-5 text-sm text-white/45" colSpan={5}>No records yet.</td></tr>}
                                    {payrollItems.map((item) => (
                                        <tr key={item._id} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                            <td className="px-4 py-4 font-semibold text-white">{item.name}</td>
                                            <td className="px-4 py-4 text-white/65">{item.second}</td>
                                            <td className="px-4 py-4 text-white/75">{item.third}</td>
                                            <td className="px-4 py-4 text-white/55">{item.fourth || "Today"}</td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="mr-3"><StatusBadge status={item.status} /></span>
                                                <button className="inline-flex size-8 items-center justify-center rounded-lg text-yellow-100/60 transition hover:bg-yellow-400/10 hover:text-yellow-100" type="button" onClick={() => openDeletePrompt({ type: "item", item })} aria-label={`Archive ${item.name}`}>
                                                    <FiArchive className="size-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {recordModal && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                        <form className="modal-panel-enter w-full max-w-[44rem] rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40" onSubmit={saveRecord}>
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Payroll Record</p>
                                    <h3 className="mt-1 text-base font-semibold text-white">{recordModal.mode === "add" ? "Add Employee Pay" : "Edit Employee Pay"}</h3>
                                </div>
                                <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={closeRecordModal} aria-label="Close modal">
                                    <FiX className="size-4" />
                                </button>
                            </div>
                            <div className="grid gap-4 p-5 md:grid-cols-2">
                                {[
                                    ["Employee Name", "employeeName", "John Smith"],
                                    ["Email", "email", "john@example.com"],
                                    ["Employee ID", "employeeId", "EMP-1001"],
                                    ["Department", "department", "Sales"],
                                    ["Paid On", "paidOn", "-"],
                                    ["Pay Period", "payPeriod", "May 2026"],
                                ].map(([label, field, placeholder]) => (
                                    <label key={field}>
                                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">{label}</span>
                                        <input
                                            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                            value={String(recordForm[field as keyof PayrollRecordInput])}
                                            onChange={(event) => setRecordForm((form) => ({ ...form, [field]: event.target.value }))}
                                            placeholder={placeholder}
                                        />
                                    </label>
                                ))}
                                <label>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Pay Type</span>
                                    <select className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#0d1018] px-3 text-sm font-semibold text-white outline-none focus:border-[#842cff]" value={recordForm.payType} onChange={(event) => setRecordForm((form) => ({ ...form, payType: event.target.value as PayrollPayType }))}>
                                        {(["Monthly", "Hourly", "Contract"] as const).map((type) => <option key={type}>{type}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Status</span>
                                    <select className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#0d1018] px-3 text-sm font-semibold text-white outline-none focus:border-[#842cff]" value={recordForm.status} onChange={(event) => setRecordForm((form) => ({ ...form, status: event.target.value as PayrollStatus }))}>
                                        {statusOptions.map((status) => <option key={status}>{status}</option>)}
                                    </select>
                                </label>
                                <label>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Gross Pay</span>
                                    <input className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" type="number" min="0" step="0.01" value={recordForm.grossPay} onChange={(event) => setRecordForm((form) => ({ ...form, grossPay: Number(event.target.value) }))} />
                                </label>
                                <label>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Deductions</span>
                                    <input className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" type="number" min="0" step="0.01" value={recordForm.deductions} onChange={(event) => setRecordForm((form) => ({ ...form, deductions: Number(event.target.value) }))} />
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                                <button className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={closeRecordModal}>Cancel</button>
                                <button className="h-10 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60" type="submit" disabled={createRecordMutation.isPending || updateRecordMutation.isPending}>
                                    Save Record
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {viewingRecord && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                        <section className="modal-panel-enter w-full max-w-[34rem] overflow-hidden rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40">
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Payroll Details</p>
                                    <h3 className="mt-1 truncate text-lg font-semibold text-white">{viewingRecord.employeeName}</h3>
                                </div>
                                <button
                                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                                    type="button"
                                    onClick={() => setViewingRecord(null)}
                                    aria-label="Close payroll details"
                                >
                                    <FiX className="size-4" />
                                </button>
                            </div>
                            <div className="grid gap-3 p-5 sm:grid-cols-2">
                                {[
                                    ["Email", viewingRecord.email || "No email"],
                                    ["Employee ID", viewingRecord.employeeId],
                                    ["Department", viewingRecord.department],
                                    ["Pay Type", viewingRecord.payType],
                                    ["Gross Pay", money(viewingRecord.grossPay)],
                                    ["Deductions", money(viewingRecord.deductions)],
                                    ["Net Pay", money(viewingRecord.netPay)],
                                    ["Status", viewingRecord.status],
                                    ["Paid On", viewingRecord.paidOn || "-"],
                                    ["Pay Period", viewingRecord.payPeriod],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-3">
                                        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/35">{label}</p>
                                        <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                                <button
                                    className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
                                    type="button"
                                    onClick={() => setViewingRecord(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </section>
                    </div>
                )}

                {payslipRecord && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
                        <section className="modal-panel-enter flex max-h-[92vh] w-full max-w-[42rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40">
                            <div className="no-print flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Generated Payslip</p>
                                    <h3 className="mt-1 truncate text-base font-semibold text-white">{payslipRecord.employeeName}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                                        type="button"
                                        onClick={printPayslip}
                                    >
                                        <FiPrinter className="size-4" aria-hidden="true" />
                                        Print / Save PDF
                                    </button>
                                    <button
                                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                                        type="button"
                                        onClick={() => setPayslipRecord(null)}
                                        aria-label="Close payslip"
                                    >
                                        <FiX className="size-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="content-scroll min-h-0 flex-1 overflow-auto bg-neutral-200 p-5">
                                <div className="mx-auto w-full max-w-[36rem] shadow-2xl shadow-black/30">
                                    <PayslipDocument record={payslipRecord} money={money} />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {itemModalOpen && itemCategory && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                        <form className="modal-panel-enter w-full max-w-[34rem] rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40" onSubmit={saveItem}>
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">{itemCategory}</p>
                                    <h3 className="mt-1 text-base font-semibold text-white">Add Payroll Item</h3>
                                </div>
                                <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => setItemModalOpen(false)} aria-label="Close modal"><FiX className="size-4" /></button>
                            </div>
                            <div className="grid gap-4 p-5">
                                {[
                                    ["Name", "name"],
                                    [itemCategory === "Payroll Runs" ? "Period" : itemCategory === "Tax Settings" ? "Status" : "Scope", "second"],
                                    [itemCategory === "Tax Settings" ? "Description" : "Amount", "third"],
                                    [itemCategory === "Tax Settings" ? "Updated" : "Detail", "fourth"],
                                ].map(([label, field]) => (
                                    <label key={field}>
                                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">{label}</span>
                                        <input className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={String(itemForm[field as keyof typeof itemForm])} onChange={(event) => setItemForm((form) => ({ ...form, [field]: event.target.value }))} />
                                    </label>
                                ))}
                                <label>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Status</span>
                                    <select className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-[#0d1018] px-3 text-sm font-semibold text-white outline-none focus:border-[#842cff]" value={itemForm.status} onChange={(event) => setItemForm((form) => ({ ...form, status: event.target.value as PayrollStatus }))}>
                                        {statusOptions.map((status) => <option key={status}>{status}</option>)}
                                    </select>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                                <button className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => setItemModalOpen(false)}>Cancel</button>
                                <button className="h-10 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60" type="submit" disabled={createItemMutation.isPending}>Add Item</button>
                            </div>
                        </form>
                    </div>
                )}

                {deleteTarget && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                        <div className="modal-panel-enter w-full max-w-[32rem] overflow-hidden rounded-lg border border-yellow-300/20 bg-[#0d1018] shadow-2xl shadow-yellow-950/20">
                            <div className="bg-[radial-gradient(circle_at_15%_20%,rgba(250,204,21,0.18),transparent_35%),linear-gradient(135deg,rgba(250,204,21,0.10),rgba(132,44,255,0.08))] px-5 py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-yellow-300/20 bg-yellow-300/12 text-yellow-100"><FiArchive className="size-5" /></span>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-yellow-100/55">Archive Payroll</p>
                                            <h3 className="mt-1 text-lg font-semibold text-white">{deleteStep === 1 ? "Archive this payroll item?" : "Final archive confirmation"}</h3>
                                            <p className="mt-1 text-sm text-yellow-50/65">{deleteStep === 1 ? "This keeps the record but removes it from active payroll tables." : "The record will remain stored as archived."}</p>
                                        </div>
                                    </div>
                                    <button className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={closeDeletePrompt} aria-label="Close archive confirmation"><FiX className="size-4" /></button>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {[1, 2].map((step) => <div key={step} className={["h-1.5 rounded-full transition", deleteStep >= step ? "bg-yellow-300" : "bg-white/10"].join(" ")} />)}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                                    <p className="text-sm font-semibold text-white">{deleteTarget.type === "record" ? deleteTarget.record.employeeName : deleteTarget.item.name}</p>
                                    <p className="mt-1 text-sm text-white/55">{deleteTarget.type === "record" ? deleteTarget.record.employeeId : deleteTarget.item.category}</p>
                                </div>
                                <div className="mt-3 rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-3">
                                    <p className="text-sm leading-6 text-yellow-50/75">{deleteStep === 1 ? "You will be asked one more time before archiving." : "This will archive the payroll item, not permanently delete it."}</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                                <button className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={closeDeletePrompt}>Cancel</button>
                                {deleteStep === 1 ? (
                                    <button className="h-10 rounded-lg border border-yellow-300/20 bg-yellow-300/10 px-4 text-sm font-semibold text-yellow-100/80 transition hover:bg-yellow-300/15 hover:text-yellow-100" type="button" onClick={() => setDeleteStep(2)}>Continue</button>
                                ) : (
                                    <button className="h-10 rounded-lg bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-60" type="button" onClick={confirmDelete} disabled={archiveRecordMutation.isPending || archiveItemMutation.isPending}>Archive</button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </AdminLayout>
    );
}
