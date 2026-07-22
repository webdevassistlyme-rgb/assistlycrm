import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import AdminLayout from "../adminLayout";
import { getEmployees } from "../../../api/employees";
import { archiveTask, createTask, getTasks, updateTask, updateTaskStatus, type CrmTask, type TaskInput, type TaskPriority, type TaskStatus } from "../../../api/tasks";
import { formatCstDateTime, formatCstDateTimeInput, parseCstDateTimeInput } from "../../../lib/dateTime";
import { roleWorkspacePath } from "../../../lib/roleAccess";

const statuses: TaskStatus[] = ["Todo", "In Progress", "Done", "Blocked"];
const priorities: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
const emptyTask: TaskInput = { title: "", description: "", relatedLead: null, assignedTo: null, status: "Todo", priority: "Medium", dueAt: null };

function getTaskInput(task: CrmTask): TaskInput {
    return {
        title: task.title,
        description: task.description || "",
        relatedLead: task.relatedLead?._id || null,
        assignedTo: task.assignedTo?._id || null,
        status: task.status,
        priority: task.priority,
        dueAt: task.dueAt,
    };
}

export default function AdminTasks() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [taskForm, setTaskForm] = useState<TaskInput>(emptyTask);

    const { data: tasks = [], isLoading, isError } = useQuery({ queryKey: ["tasks", search], queryFn: () => getTasks({ search }) });
    const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });
    const refreshTasks = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });
    const closeTaskModal = () => {
        setIsModalOpen(false);
        setEditingTaskId(null);
        setTaskForm(emptyTask);
    };
    const createTaskMutation = useMutation({ mutationFn: createTask, onSuccess: () => { refreshTasks(); closeTaskModal(); } });
    const updateTaskMutation = useMutation({
        mutationFn: ({ id, task }: { id: string; task: TaskInput }) => updateTask(id, task),
        onSuccess: () => {
            refreshTasks();
            closeTaskModal();
        },
    });
    const updateStatusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => updateTaskStatus(id, status), onSuccess: refreshTasks });
    const archiveTaskMutation = useMutation({ mutationFn: archiveTask, onSuccess: refreshTasks });

    const stats = useMemo(
        () => statuses.map((status) => ({ status, count: tasks.filter((task) => task.status === status).length })),
        [tasks]
    );

    const saveTask = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!taskForm.title.trim()) return;
        if (editingTaskId) {
            updateTaskMutation.mutate({ id: editingTaskId, task: taskForm });
            return;
        }
        createTaskMutation.mutate(taskForm);
    };

    const openAddTask = () => {
        setEditingTaskId(null);
        setTaskForm(emptyTask);
        setIsModalOpen(true);
    };

    const openEditTask = (task: CrmTask) => {
        setEditingTaskId(task._id);
        setTaskForm(getTaskInput(task));
        setIsModalOpen(true);
    };

    const isSavingTask = createTaskMutation.isPending || updateTaskMutation.isPending;

    return (
        <AdminLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">Tasks</h2>
                        <p className="mt-1 text-sm text-white/50">Assign work, track follow-ups, and monitor completion.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <label className="flex h-11 w-[20rem] max-w-full items-center gap-3 rounded-lg border border-white/10 bg-[#090b13]/80 px-3 text-white/45 focus-within:border-[#842cff]">
                            <input className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." />
                            <FiSearch className="size-4" />
                        </label>
                        <button className="flex h-11 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-5 text-sm font-semibold text-white" type="button" onClick={openAddTask}>
                            <FiPlus className="size-4" /> Add Task
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-4">
                    {stats.map((stat) => (
                        <article key={stat.status} className="rounded-lg border border-white/10 bg-[#0c1018]/80 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">{stat.status}</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{stat.count}</p>
                        </article>
                    ))}
                </div>

                <section className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80">
                    <div className="content-scroll max-h-[calc(100vh-24rem)] overflow-auto bg-[linear-gradient(to_bottom,#11151f_0,#11151f_3rem,transparent_3rem)] [scrollbar-gutter:stable]">
                        <table className="w-full min-w-[62rem] table-fixed border-separate border-spacing-0 text-left">
                            <thead className="sticky top-0 z-10 bg-[#11151f] text-xs font-semibold uppercase tracking-[0.14em] text-white/35 shadow-[12px_0_0_#11151f]">
                                <tr>
                                    <th className="w-[28%] px-4 py-4">Task</th>
                                    <th className="w-[18%] px-4 py-4">Assigned</th>
                                    <th className="w-[13%] px-4 py-4">Priority</th>
                                    <th className="w-[15%] px-4 py-4">Due</th>
                                    <th className="w-[16%] px-4 py-4">Status</th>
                                    <th className="w-[10%] px-4 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {isLoading && <tr><td className="px-4 py-5 text-sm text-white/45" colSpan={6}>Loading tasks...</td></tr>}
                                {isError && <tr><td className="px-4 py-5 text-sm text-red-200" colSpan={6}>Unable to load tasks.</td></tr>}
                                {tasks.map((task) => (
                                    <TaskRow
                                        key={task._id}
                                        task={task}
                                        onOpen={() => navigate(roleWorkspacePath(`/admin/tasks/${task._id}`))}
                                        onEdit={() => openEditTask(task)}
                                        onStatus={(status) => updateStatusMutation.mutate({ id: task._id, status })}
                                        onArchive={() => archiveTaskMutation.mutate(task._id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {isModalOpen && (
                    <div
                        className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeTaskModal();
                            }
                        }}
                    >
                        <form className="modal-panel-enter w-full max-w-[34rem] rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40" onSubmit={saveTask}>
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                                <div>
                                    <h3 className="text-base font-semibold text-white">{editingTaskId ? "Edit Task" : "Add Task"}</h3>
                                    <p className="mt-1 text-sm text-white/45">{editingTaskId ? "Update the task details, assignee, priority, and due date." : "Create task and assign it to an employee."}</p>
                                </div>
                                <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60" type="button" onClick={closeTaskModal}><FiX /></button>
                            </div>
                            <div className="grid gap-4 p-5">
                                <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" value={taskForm.title} onChange={(event) => setTaskForm((task) => ({ ...task, title: event.target.value }))} placeholder="Task title" />
                                <textarea className="min-h-24 rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-semibold text-white outline-none" value={taskForm.description} onChange={(event) => setTaskForm((task) => ({ ...task, description: event.target.value }))} placeholder="Description" />
                                <select className="h-11 rounded-lg border border-white/10 bg-[#0d1018] px-3 text-sm font-semibold text-white outline-none" value={taskForm.assignedTo || ""} onChange={(event) => setTaskForm((task) => ({ ...task, assignedTo: event.target.value || null }))}>
                                    <option value="">Unassigned</option>
                                    {employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name}</option>)}
                                </select>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <select className="h-11 rounded-lg border border-white/10 bg-[#0d1018] px-3 text-sm font-semibold text-white outline-none" value={taskForm.priority} onChange={(event) => setTaskForm((task) => ({ ...task, priority: event.target.value as TaskPriority }))}>
                                        {priorities.map((priority) => <option key={priority}>{priority}</option>)}
                                    </select>
                                    <select className="h-11 rounded-lg border border-white/10 bg-[#0d1018] px-3 text-sm font-semibold text-white outline-none" value={taskForm.status} onChange={(event) => setTaskForm((task) => ({ ...task, status: event.target.value as TaskStatus }))}>
                                        {statuses.map((status) => <option key={status}>{status}</option>)}
                                    </select>
                                    <input
                                        className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none"
                                        type="datetime-local"
                                        value={formatCstDateTimeInput(taskForm.dueAt)}
                                        onChange={(event) => setTaskForm((task) => ({ ...task, dueAt: event.target.value ? parseCstDateTimeInput(event.target.value)?.toISOString() || null : null }))}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                                <button className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60" type="button" onClick={closeTaskModal}>Cancel</button>
                                <button className="h-10 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white disabled:opacity-60" type="submit" disabled={isSavingTask}>
                                    {editingTaskId ? "Save Changes" : "Create Task"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </section>
        </AdminLayout>
    );
}

function TaskRow({ task, onOpen, onEdit, onStatus, onArchive }: { task: CrmTask; onOpen: () => void; onEdit: () => void; onStatus: (status: TaskStatus) => void; onArchive: () => void }) {
    return (
        <tr className="cursor-pointer text-sm text-white/78 transition hover:bg-white/[0.035]" onClick={onOpen}>
            <td className="px-4 py-4"><p className="font-semibold text-white">{task.title}</p><p className="mt-1 truncate text-xs text-white/42">{task.description || "No description"}</p></td>
            <td className="px-4 py-4 text-white/65">{task.assignedTo?.name || "Unassigned"}</td>
            <td className="px-4 py-4 text-white/75">{task.priority}</td>
            <td className="px-4 py-4 text-white/65">{task.dueAt ? formatCstDateTime(task.dueAt) : "-"}</td>
            <td className="px-4 py-4">
                <select
                    className="h-9 rounded-lg border border-white/10 bg-[#0d1018] px-2 text-xs font-semibold text-white outline-none"
                    value={task.status}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => onStatus(event.target.value as TaskStatus)}
                >
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
            </td>
            <td className="px-4 py-4 text-right">
                <button
                    className="inline-flex size-8 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white"
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onEdit();
                    }}
                    aria-label={`Edit ${task.title}`}
                >
                    <FiEdit2 className="size-4" />
                </button>
                <button
                    className="inline-flex size-8 items-center justify-center rounded-lg text-red-100/65 transition hover:bg-red-400/10 hover:text-red-100"
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onArchive();
                    }}
                    aria-label={`Archive ${task.title}`}
                >
                    <FiTrash2 className="size-4" />
                </button>
            </td>
        </tr>
    );
}
