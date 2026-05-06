import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import AdminLayout from "../adminLayout";
import { getEmployees } from "../../../api/employees";
import { archiveTask, createTask, getTasks, updateTaskStatus, type CrmTask, type TaskInput, type TaskPriority, type TaskStatus } from "../../../api/tasks";

const statuses: TaskStatus[] = ["Todo", "In Progress", "Done", "Blocked"];
const priorities: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
const emptyTask: TaskInput = { title: "", description: "", relatedLead: null, assignedTo: null, status: "Todo", priority: "Medium", dueAt: null };

export default function AdminTasks() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskForm, setTaskForm] = useState<TaskInput>(emptyTask);

    const { data: tasks = [], isLoading, isError } = useQuery({ queryKey: ["tasks", search], queryFn: () => getTasks({ search }) });
    const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });
    const refreshTasks = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });
    const createTaskMutation = useMutation({ mutationFn: createTask, onSuccess: () => { refreshTasks(); setIsModalOpen(false); setTaskForm(emptyTask); } });
    const updateStatusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => updateTaskStatus(id, status), onSuccess: refreshTasks });
    const archiveTaskMutation = useMutation({ mutationFn: archiveTask, onSuccess: refreshTasks });

    const stats = useMemo(
        () => statuses.map((status) => ({ status, count: tasks.filter((task) => task.status === status).length })),
        [tasks]
    );

    const saveTask = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!taskForm.title.trim()) return;
        createTaskMutation.mutate(taskForm);
    };

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
                        <button className="flex h-11 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-5 text-sm font-semibold text-white" type="button" onClick={() => setIsModalOpen(true)}>
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
                                    <TaskRow key={task._id} task={task} onStatus={(status) => updateStatusMutation.mutate({ id: task._id, status })} onArchive={() => archiveTaskMutation.mutate(task._id)} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {isModalOpen && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                        <form className="modal-panel-enter w-full max-w-[34rem] rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40" onSubmit={saveTask}>
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                                <div>
                                    <h3 className="text-base font-semibold text-white">Add Task</h3>
                                    <p className="mt-1 text-sm text-white/45">Create task and assign it to an employee.</p>
                                </div>
                                <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60" type="button" onClick={() => setIsModalOpen(false)}><FiX /></button>
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
                                    <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" type="datetime-local" onChange={(event) => setTaskForm((task) => ({ ...task, dueAt: event.target.value ? new Date(event.target.value).toISOString() : null }))} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                                <button className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60" type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button className="h-10 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white" type="submit">Create Task</button>
                            </div>
                        </form>
                    </div>
                )}
            </section>
        </AdminLayout>
    );
}

function TaskRow({ task, onStatus, onArchive }: { task: CrmTask; onStatus: (status: TaskStatus) => void; onArchive: () => void }) {
    return (
        <tr className="text-sm text-white/78 transition hover:bg-white/[0.035]">
            <td className="px-4 py-4"><p className="font-semibold text-white">{task.title}</p><p className="mt-1 truncate text-xs text-white/42">{task.description || "No description"}</p></td>
            <td className="px-4 py-4 text-white/65">{task.assignedTo?.name || "Unassigned"}</td>
            <td className="px-4 py-4 text-white/75">{task.priority}</td>
            <td className="px-4 py-4 text-white/65">{task.dueAt ? new Date(task.dueAt).toLocaleString() : "-"}</td>
            <td className="px-4 py-4">
                <select className="h-9 rounded-lg border border-white/10 bg-[#0d1018] px-2 text-xs font-semibold text-white outline-none" value={task.status} onChange={(event) => onStatus(event.target.value as TaskStatus)}>
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
            </td>
            <td className="px-4 py-4 text-right">
                <button className="inline-flex size-8 items-center justify-center rounded-lg text-red-100/65 transition hover:bg-red-400/10 hover:text-red-100" type="button" onClick={onArchive} aria-label={`Archive ${task.title}`}>
                    <FiTrash2 className="size-4" />
                </button>
            </td>
        </tr>
    );
}
