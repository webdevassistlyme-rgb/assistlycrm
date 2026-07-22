import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiArrowLeft, FiCheckCircle, FiClock, FiMessageSquare, FiSend, FiUser } from "react-icons/fi";
import { addTaskComment, getTask, updateTaskStatus, type CrmTask, type TaskStatus } from "../../api/tasks";
import { getAuthUser } from "../../api/authStorage";
import { formatCstDateTime, formatPhDateTime } from "../../lib/dateTime";
import MainLayout from "../layout";

const statuses: TaskStatus[] = ["Todo", "In Progress", "Done", "Blocked"];

const priorityClass: Record<string, string> = {
    Low: "border-white/10 bg-white/[0.06] text-white/55",
    Medium: "border-sky-400/20 bg-sky-400/10 text-sky-100",
    High: "border-yellow-400/25 bg-yellow-400/10 text-yellow-100",
    Urgent: "border-red-400/25 bg-red-500/15 text-red-100",
};

function canViewTask(task: CrmTask | undefined, employeeId: string) {
    if (!task) return false;
    return Boolean(employeeId && task.assignedTo?._id === employeeId);
}

export default function TaskDetail() {
    const { taskId = "" } = useParams();
    const queryClient = useQueryClient();
    const authUser = getAuthUser();
    const employee = authUser?.userType === "employee" ? authUser.user : null;
    const employeeId = employee?._id || "";
    const employeeName = employee?.name || "Employee";
    const [commentDraft, setCommentDraft] = useState("");

    const { data: task, isLoading, isError } = useQuery({
        queryKey: ["tasks", taskId],
        queryFn: () => getTask(taskId),
        enabled: Boolean(taskId),
    });

    const comments = useMemo(
        () => [...(task?.comments || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [task?.comments]
    );

    const updateStatusMutation = useMutation({
        mutationFn: (status: TaskStatus) => updateTaskStatus(taskId, status),
        onSuccess: (updatedTask) => {
            queryClient.setQueryData(["tasks", taskId], updatedTask);
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });

    const addCommentMutation = useMutation({
        mutationFn: (body: string) => addTaskComment(taskId, { body, authorName: employeeName, authorType: "employee" }),
        onSuccess: (updatedTask) => {
            setCommentDraft("");
            queryClient.setQueryData(["tasks", taskId], updatedTask);
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });

    const submitComment = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const body = commentDraft.trim();

        if (!body || addCommentMutation.isPending) {
            return;
        }

        addCommentMutation.mutate(body);
    };

    const isUnavailable = !isLoading && (!task || !canViewTask(task, employeeId));

    return (
        <MainLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white" to="/tasks">
                            <FiArrowLeft className="size-4" aria-hidden="true" />
                            Back to Tasks
                        </Link>
                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Task Details</p>
                        <h2 className="mt-1 text-2xl font-semibold text-white">{task?.title || (isLoading ? "Loading..." : "Task not found")}</h2>
                    </div>
                    {task && canViewTask(task, employeeId) && (
                        <span className={`rounded-lg border px-3 py-2 text-sm font-semibold ${priorityClass[task.priority]}`}>{task.priority}</span>
                    )}
                </div>

                {isLoading && <p className="rounded-lg border border-white/10 bg-[#090b13]/80 p-5 text-sm text-white/45">Loading task...</p>}
                {isError && <p className="rounded-lg border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100">Unable to load this task.</p>}
                {isUnavailable && (
                    <div className="rounded-lg border border-white/10 bg-[#090b13]/80 p-6">
                        <p className="text-sm font-semibold text-white">This task is not available.</p>
                        <p className="mt-1 text-sm text-white/50">It may have been archived, reassigned, or removed.</p>
                    </div>
                )}

                {task && canViewTask(task, employeeId) && (
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
                        <article className="overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80 shadow-xl shadow-black/10">
                            <div className="border-b border-white/10 p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-md border border-[#842cff]/35 bg-[#842cff]/15 px-2.5 py-1 text-xs font-semibold text-[#d8c8ff]">{task.status}</span>
                                    {task.dueAt && (
                                        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-white/55">
                                            <FiClock className="size-3" aria-hidden="true" />
                                            {formatCstDateTime(task.dueAt)}
                                        </span>
                                    )}
                                </div>
                                <h1 className="mt-4 text-3xl font-semibold leading-tight text-white">{task.title}</h1>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/65">{task.description || "No description provided."}</p>
                            </div>

                            <div className="grid gap-4 p-5 md:grid-cols-2">
                                <section className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Assigned To</p>
                                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-white">
                                        <FiUser className="size-4 text-[#9b5cff]" aria-hidden="true" />
                                        {task.assignedTo?.name || "Unassigned"}
                                    </p>
                                </section>
                                <section className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Related Lead</p>
                                    <p className="mt-2 text-sm font-semibold text-white">{task.relatedLead?.businessName || "None"}</p>
                                </section>
                            </div>

                            <div className="border-t border-white/10 p-5">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Update Status</p>
                                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                                    {statuses.map((status) => (
                                        <button
                                            key={status}
                                            className={[
                                                "h-10 rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
                                                task.status === status
                                                    ? "border-[#842cff] bg-[#842cff]/20 text-white"
                                                    : "border-white/10 bg-black/20 text-white/50 hover:bg-white/[0.06] hover:text-white",
                                            ].join(" ")}
                                            type="button"
                                            disabled={task.status === status || updateStatusMutation.isPending}
                                            onClick={() => updateStatusMutation.mutate(status)}
                                        >
                                            {status === "Done" && <FiCheckCircle className="mr-1 inline size-3" aria-hidden="true" />}
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </article>

                        <aside className="grid gap-5 self-start">
                            <section className="rounded-lg border border-white/10 bg-[#090b13]/80 p-5 shadow-xl shadow-black/10">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Comments</p>
                                        <h3 className="mt-1 text-base font-semibold text-white">{comments.length} task notes</h3>
                                    </div>
                                    <FiMessageSquare className="size-5 text-[#9b5cff]" aria-hidden="true" />
                                </div>

                                <form className="mt-4 grid gap-3" onSubmit={submitComment}>
                                    <textarea
                                        className="min-h-28 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                        value={commentDraft}
                                        onChange={(event) => setCommentDraft(event.target.value)}
                                        placeholder="Add a comment for this task..."
                                    />
                                    <button
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                                        type="submit"
                                        disabled={addCommentMutation.isPending || !commentDraft.trim()}
                                    >
                                        <FiSend className="size-4" aria-hidden="true" />
                                        {addCommentMutation.isPending ? "Saving..." : "Add Comment"}
                                    </button>
                                </form>
                            </section>

                            <section className="content-scroll max-h-[26rem] overflow-auto rounded-lg border border-white/10 bg-[#090b13]/80 p-4 shadow-xl shadow-black/10">
                                <div className="grid gap-3">
                                    {comments.length > 0 ? (
                                        comments.map((comment) => (
                                            <article key={comment._id || `${comment.createdAt}-${comment.body}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-sm font-semibold text-white">{comment.authorName || "Employee"}</p>
                                                    <p className="shrink-0 text-xs text-white/35">{comment.createdAt ? formatPhDateTime(comment.createdAt) : ""}</p>
                                                </div>
                                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/65">{comment.body}</p>
                                            </article>
                                        ))
                                    ) : (
                                        <p className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-white/45">No comments yet.</p>
                                    )}
                                </div>
                            </section>
                        </aside>
                    </div>
                )}
            </section>
        </MainLayout>
    );
}
