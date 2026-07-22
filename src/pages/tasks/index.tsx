import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheckCircle, FiClock, FiMessageSquare, FiSearch } from "react-icons/fi";
import MainLayout from "../layout";
import { getAuthUser } from "../../api/authStorage";
import { getTasks, updateTaskStatus, type CrmTask, type TaskStatus } from "../../api/tasks";
import { formatCstDate } from "../../lib/dateTime";

const statuses: TaskStatus[] = ["Todo", "In Progress", "Done", "Blocked"];

const priorityClass: Record<string, string> = {
    Low: "text-white/45 bg-white/[0.06]",
    Medium: "text-sky-100 bg-sky-400/10",
    High: "text-yellow-100 bg-yellow-400/10",
    Urgent: "text-red-100 bg-red-500/15",
};

export default function Tasks() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const authUser = getAuthUser();
    const employeeId = authUser?.userType === "employee" ? authUser.user._id : "";
    const [search, setSearch] = useState("");

    const { data: tasks = [], isLoading, isError } = useQuery({
        queryKey: ["tasks", employeeId, search],
        queryFn: () => getTasks({ assignedTo: employeeId, search }),
        enabled: Boolean(employeeId),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => updateTaskStatus(id, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    });

    const groupedTasks = useMemo(
        () => statuses.map((status) => ({ status, tasks: tasks.filter((task) => task.status === status) })),
        [tasks]
    );

    return (
        <MainLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">Tasks</h2>
                        <p className="mt-1 text-sm text-white/50">Track your assigned work, due dates, and lead follow-ups.</p>
                    </div>
                    <label className="flex h-11 w-[20rem] max-w-full items-center gap-3 rounded-lg border border-white/10 bg-[#090b13]/80 px-3 text-white/45 focus-within:border-[#842cff]">
                        <input className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." />
                        <FiSearch className="size-4" />
                    </label>
                </div>

                {isLoading && <p className="mt-5 text-sm text-white/45">Loading tasks...</p>}
                {isError && <p className="mt-5 text-sm text-red-200">Unable to load tasks.</p>}

                <div className="mt-5 grid gap-4 xl:grid-cols-4">
                    {groupedTasks.map((group) => (
                        <section key={group.status} className="min-h-[28rem] rounded-lg border border-white/10 bg-[#090b13]/80">
                            <div className="flex h-12 items-center justify-between border-b border-white/10 px-4">
                                <h3 className="text-sm font-semibold text-white">{group.status}</h3>
                                <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-white/55">{group.tasks.length}</span>
                            </div>
                            <div className="grid gap-3 p-3">
                                {group.tasks.map((task) => (
                                    <TaskCard
                                        key={task._id}
                                        task={task}
                                        onOpen={() => navigate(`/tasks/${task._id}`)}
                                        onStatusChange={(status) => updateStatusMutation.mutate({ id: task._id, status })}
                                    />
                                ))}
                                {group.tasks.length === 0 && <p className="p-3 text-sm text-white/35">No tasks.</p>}
                            </div>
                        </section>
                    ))}
                </div>
            </section>
        </MainLayout>
    );
}

function TaskCard({ task, onOpen, onStatusChange }: { task: CrmTask; onOpen: () => void; onStatusChange: (status: TaskStatus) => void }) {
    return (
        <article
            className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] p-3 transition hover:border-[#842cff]/45 hover:bg-white/[0.065]"
            onClick={onOpen}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen();
                }
            }}
            role="button"
            tabIndex={0}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-white">{task.title}</h4>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">{task.description || "No description"}</p>
                </div>
                <span className={`rounded-md px-2 py-1 text-[0.68rem] font-semibold ${priorityClass[task.priority]}`}>{task.priority}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/45">
                {task.dueAt && <span className="inline-flex items-center gap-1"><FiClock className="size-3" />{formatCstDate(task.dueAt)}</span>}
                {task.relatedLead && <span>{task.relatedLead.businessName}</span>}
                <span className="inline-flex items-center gap-1">
                    <FiMessageSquare className="size-3" aria-hidden="true" />
                    {(task.comments || []).length}
                </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
                {statuses.map((status) => (
                    <button
                        key={status}
                        className={["h-8 rounded-lg border px-2 text-[0.68rem] font-semibold transition", task.status === status ? "border-[#842cff] bg-[#842cff]/20 text-white" : "border-white/10 bg-black/20 text-white/50 hover:bg-white/[0.06] hover:text-white"].join(" ")}
                        type="button"
                        disabled={task.status === status}
                        onClick={(event) => {
                            event.stopPropagation();
                            onStatusChange(status);
                        }}
                    >
                        {status === "Done" && <FiCheckCircle className="mr-1 inline size-3" />}
                        {status}
                    </button>
                ))}
            </div>
        </article>
    );
}
