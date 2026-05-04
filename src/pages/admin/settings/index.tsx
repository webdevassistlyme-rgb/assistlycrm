import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiArchive, FiEdit2, FiPlus, FiSave, FiX } from "react-icons/fi";
import AdminLayout from "../adminLayout";
import {
    archiveRole,
    createRole,
    getRoles,
    updateRole,
    type Role,
    type RoleInput,
} from "../../../api/roles";

export default function AdminSettings() {
    const queryClient = useQueryClient();
    const { data: roles = [], isLoading, isError } = useQuery({
        queryKey: ["roles"],
        queryFn: getRoles,
    });
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
    const [roleForm, setRoleForm] = useState<RoleInput>({ name: "", description: "" });

    const invalidateRoles = () => {
        queryClient.invalidateQueries({ queryKey: ["roles"] });
    };

    const createRoleMutation = useMutation({
        mutationFn: createRole,
        onSuccess: invalidateRoles,
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: RoleInput }) => updateRole(id, role),
        onSuccess: invalidateRoles,
    });

    const archiveRoleMutation = useMutation({
        mutationFn: archiveRole,
        onSuccess: invalidateRoles,
    });

    const openAddRoleModal = () => {
        setEditingRoleId(null);
        setRoleForm({ name: "", description: "" });
        setIsRoleModalOpen(true);
    };

    const openEditRoleModal = (role: Role) => {
        setEditingRoleId(role._id);
        setRoleForm({ name: role.name, description: role.description });
        setIsRoleModalOpen(true);
    };

    const closeRoleModal = () => {
        setIsRoleModalOpen(false);
        setEditingRoleId(null);
        setRoleForm({ name: "", description: "" });
    };

    const handleSaveRole = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!roleForm.name.trim()) {
            return;
        }

        if (editingRoleId) {
            updateRoleMutation.mutate({ id: editingRoleId, role: roleForm });
        } else {
            createRoleMutation.mutate(roleForm);
        }

        closeRoleModal();
    };

    return (
        <AdminLayout>
            <section className="min-h-[calc(100vh-8.5rem)] rounded-lg border border-white/10 bg-[#090b13]/80">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Admin Settings</p>
                        <h2 className="mt-1 text-xl font-semibold text-white">Roles</h2>
                    </div>

                    <button
                        className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                        type="button"
                        onClick={openAddRoleModal}
                    >
                        <FiPlus className="size-4" aria-hidden="true" />
                        Add Role
                    </button>
                </div>

                <div className="grid gap-2.5 p-4 md:grid-cols-3">
                    {[
                        ["Roles", roles.length.toString()],
                        ["Default Role", roles[0]?.name || "None"],
                        ["Source", "MongoDB"],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3">
                            <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-white/35">{label}</p>
                            <p className="mt-1 truncate text-xl font-semibold text-white">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="px-4 pb-4">
                    <div className="overflow-hidden rounded-lg border border-white/10">
                        <table className="w-full text-left">
                            <thead className="border-b border-white/10 bg-white/[0.03]">
                                <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                                    <th className="px-5 py-3">Role</th>
                                    <th className="px-5 py-3">Description</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {isLoading && (
                                    <tr>
                                        <td className="px-5 py-8 text-center text-sm text-white/45" colSpan={3}>
                                            Loading roles...
                                        </td>
                                    </tr>
                                )}
                                {isError && (
                                    <tr>
                                        <td className="px-5 py-8 text-center text-sm text-red-200" colSpan={3}>
                                            Unable to load roles. Check that the backend is running.
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && !isError && roles.length === 0 && (
                                    <tr>
                                        <td className="px-5 py-8 text-center text-sm text-white/45" colSpan={3}>
                                            No roles yet.
                                        </td>
                                    </tr>
                                )}
                                {roles.map((role) => (
                                    <tr key={role._id} className="text-sm transition hover:bg-white/[0.04]">
                                        <td className="px-5 py-4 font-semibold text-white">{role.name}</td>
                                        <td className="px-5 py-4 text-white/55">{role.description || "No description"}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                                    type="button"
                                                    aria-label={`Edit ${role.name}`}
                                                    onClick={() => openEditRoleModal(role)}
                                                >
                                                    <FiEdit2 className="size-4" aria-hidden="true" />
                                                </button>
                                                <button
                                                    className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                                    type="button"
                                                    aria-label={`Archive ${role.name}`}
                                                    onClick={() => archiveRoleMutation.mutate(role._id)}
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
            </section>

            {isRoleModalOpen && (
                <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <form
                        className="modal-panel-enter flex w-full max-w-[30rem] flex-col rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40"
                        onSubmit={handleSaveRole}
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                            <div>
                                <h3 className="text-base font-semibold text-white">
                                    {editingRoleId ? "Edit Role" : "Add Role"}
                                </h3>
                                <p className="mt-1 text-sm text-white/45">Roles appear in the employee form.</p>
                            </div>
                            <button
                                className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                aria-label="Close role modal"
                                onClick={closeRoleModal}
                            >
                                <FiX className="size-4" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="grid gap-4 p-5">
                            <label>
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Role Name</span>
                                <input
                                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                    value={roleForm.name}
                                    onChange={(event) => setRoleForm((role) => ({ ...role, name: event.target.value }))}
                                    placeholder="Sales Agent"
                                />
                            </label>
                            <label>
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Description</span>
                                <textarea
                                    className="mt-2 min-h-24 w-full resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                    value={roleForm.description}
                                    onChange={(event) => setRoleForm((role) => ({ ...role, description: event.target.value }))}
                                    placeholder="Optional role description"
                                />
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-3.5">
                            <button
                                className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                onClick={closeRoleModal}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                type="submit"
                            >
                                <FiSave className="size-4" aria-hidden="true" />
                                Save Role
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
