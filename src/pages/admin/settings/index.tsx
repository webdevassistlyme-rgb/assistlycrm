import type { FormEvent } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiAlertTriangle, FiArchive, FiCheck, FiChevronDown, FiCreditCard, FiEdit2, FiGitBranch, FiPlus, FiSave, FiShield, FiSliders, FiTag, FiTool, FiX } from "react-icons/fi";
import AdminLayout from "../adminLayout";
import { archiveRole, createRole, getRoles, updateRole, type Role, type RoleInput } from "../../../api/roles";
import {
    archiveBranch,
    createBranch,
    getBranches,
    updateBranch,
    type Branch,
    type BranchInput,
} from "../../../api/branches";
import { archiveTool, createTool, getTools, updateTool, type Tool, type ToolInput } from "../../../api/tools";
import { getFeatures, updateFeature, type FeatureFlag } from "../../../api/features";
import {
    archiveProductCategory,
    createProductCategory,
    getProductCategories,
    updateProductCategory,
    type ProductCategory,
    type ProductCategoryInput,
} from "../../../api/productCategories";
import {
    currencyOptions,
    getSystemSettings,
    payrollBillingCycleOptions,
    updateSystemSettings,
    type CurrencyCode,
    type PayrollBillingCycle,
} from "../../../api/systemSettings";

type SettingsTab = "Roles" | "Branches" | "Tools" | "Product Categories" | "Features" | "System";

const emptyRole: RoleInput = { name: "", description: "" };
const emptyBranch: BranchInput = { name: "", company: "Assistly", location: "" };
const emptyTool: ToolInput = { name: "", link: "", branches: [] };
const emptyProductCategory: ProductCategoryInput = { name: "", description: "" };

export default function AdminSettings() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<SettingsTab>("Roles");
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [isToolModalOpen, setIsToolModalOpen] = useState(false);
    const [isProductCategoryModalOpen, setIsProductCategoryModalOpen] = useState(false);
    const [isToolBranchDropdownOpen, setIsToolBranchDropdownOpen] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
    const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
    const [editingToolId, setEditingToolId] = useState<string | null>(null);
    const [editingProductCategoryId, setEditingProductCategoryId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ label: string; type: SettingsTab; onConfirm: () => void } | null>(null);
    const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
    const [roleForm, setRoleForm] = useState<RoleInput>(emptyRole);
    const [branchForm, setBranchForm] = useState<BranchInput>(emptyBranch);
    const [toolForm, setToolForm] = useState<ToolInput>(emptyTool);
    const [productCategoryForm, setProductCategoryForm] = useState<ProductCategoryInput>(emptyProductCategory);

    const { data: roles = [], isLoading: rolesLoading, isError: rolesError } = useQuery({
        queryKey: ["roles"],
        queryFn: getRoles,
    });
    const { data: branches = [], isLoading: branchesLoading, isError: branchesError } = useQuery({
        queryKey: ["branches"],
        queryFn: getBranches,
    });
    const { data: tools = [], isLoading: toolsLoading, isError: toolsError } = useQuery({
        queryKey: ["tools"],
        queryFn: getTools,
    });
    const { data: productCategories = [], isLoading: productCategoriesLoading, isError: productCategoriesError } = useQuery({
        queryKey: ["product-categories"],
        queryFn: getProductCategories,
    });
    const { data: features = [], isLoading: featuresLoading, isError: featuresError } = useQuery({
        queryKey: ["features"],
        queryFn: getFeatures,
    });
    const { data: systemSettings, isLoading: systemSettingsLoading, isError: systemSettingsError } = useQuery({
        queryKey: ["system-settings"],
        queryFn: getSystemSettings,
    });

    const invalidateRoles = () => queryClient.invalidateQueries({ queryKey: ["roles"] });
    const invalidateBranches = () => queryClient.invalidateQueries({ queryKey: ["branches"] });
    const invalidateTools = () => queryClient.invalidateQueries({ queryKey: ["tools"] });
    const invalidateProductCategories = () => queryClient.invalidateQueries({ queryKey: ["product-categories"] });
    const invalidateFeatures = () => queryClient.invalidateQueries({ queryKey: ["features"] });
    const invalidateSystemSettings = () => queryClient.invalidateQueries({ queryKey: ["system-settings"] });

    const createRoleMutation = useMutation({ mutationFn: createRole, onSuccess: invalidateRoles });
    const updateRoleMutation = useMutation({
        mutationFn: ({ id, role }: { id: string; role: RoleInput }) => updateRole(id, role),
        onSuccess: invalidateRoles,
    });
    const archiveRoleMutation = useMutation({ mutationFn: archiveRole, onSuccess: invalidateRoles });

    const createBranchMutation = useMutation({ mutationFn: createBranch, onSuccess: invalidateBranches });
    const updateBranchMutation = useMutation({
        mutationFn: ({ id, branch }: { id: string; branch: BranchInput }) => updateBranch(id, branch),
        onSuccess: invalidateBranches,
    });
    const archiveBranchMutation = useMutation({ mutationFn: archiveBranch, onSuccess: invalidateBranches });
    const createToolMutation = useMutation({ mutationFn: createTool, onSuccess: invalidateTools });
    const updateToolMutation = useMutation({
        mutationFn: ({ id, tool }: { id: string; tool: ToolInput }) => updateTool(id, tool),
        onSuccess: invalidateTools,
    });
    const archiveToolMutation = useMutation({ mutationFn: archiveTool, onSuccess: invalidateTools });
    const createProductCategoryMutation = useMutation({ mutationFn: createProductCategory, onSuccess: invalidateProductCategories });
    const updateProductCategoryMutation = useMutation({
        mutationFn: ({ id, category }: { id: string; category: ProductCategoryInput }) => updateProductCategory(id, category),
        onSuccess: invalidateProductCategories,
    });
    const archiveProductCategoryMutation = useMutation({ mutationFn: archiveProductCategory, onSuccess: invalidateProductCategories });
    const updateFeatureMutation = useMutation({
        mutationFn: ({ feature }: { feature: FeatureFlag }) =>
            updateFeature(feature.key, {
                adminEnabled: feature.adminEnabled,
                employeeEnabled: feature.employeeEnabled,
            }),
        onSuccess: invalidateFeatures,
    });
    const updateSystemSettingsMutation = useMutation({
        mutationFn: updateSystemSettings,
        onSuccess: invalidateSystemSettings,
    });

    const openAddRoleModal = () => {
        setEditingRoleId(null);
        setRoleForm(emptyRole);
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
        setRoleForm(emptyRole);
    };

    const openAddBranchModal = () => {
        setEditingBranchId(null);
        setBranchForm(emptyBranch);
        setIsBranchModalOpen(true);
    };

    const openEditBranchModal = (branch: Branch) => {
        setEditingBranchId(branch._id);
        setBranchForm({ name: branch.name, company: branch.company, location: branch.location });
        setIsBranchModalOpen(true);
    };

    const closeBranchModal = () => {
        setIsBranchModalOpen(false);
        setEditingBranchId(null);
        setBranchForm(emptyBranch);
    };

    const openAddToolModal = () => {
        setEditingToolId(null);
        setToolForm(emptyTool);
        setIsToolModalOpen(true);
    };

    const openEditToolModal = (tool: Tool) => {
        setEditingToolId(tool._id);
        setToolForm({ name: tool.name, link: tool.link, branches: tool.branches || [] });
        setIsToolModalOpen(true);
    };

    const closeToolModal = () => {
        setIsToolModalOpen(false);
        setIsToolBranchDropdownOpen(false);
        setEditingToolId(null);
        setToolForm(emptyTool);
    };

    const openAddProductCategoryModal = () => {
        setEditingProductCategoryId(null);
        setProductCategoryForm(emptyProductCategory);
        setIsProductCategoryModalOpen(true);
    };

    const openEditProductCategoryModal = (category: ProductCategory) => {
        setEditingProductCategoryId(category._id);
        setProductCategoryForm({ name: category.name, description: category.description });
        setIsProductCategoryModalOpen(true);
    };

    const closeProductCategoryModal = () => {
        setIsProductCategoryModalOpen(false);
        setEditingProductCategoryId(null);
        setProductCategoryForm(emptyProductCategory);
    };

    const handleSaveRole = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!roleForm.name.trim()) return;

        if (editingRoleId) {
            updateRoleMutation.mutate({ id: editingRoleId, role: roleForm });
        } else {
            createRoleMutation.mutate(roleForm);
        }

        closeRoleModal();
    };

    const handleSaveBranch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!branchForm.name.trim()) return;

        if (editingBranchId) {
            updateBranchMutation.mutate({ id: editingBranchId, branch: branchForm });
        } else {
            createBranchMutation.mutate(branchForm);
        }

        closeBranchModal();
    };

    const handleSaveTool = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!toolForm.name.trim()) return;

        if (editingToolId) {
            updateToolMutation.mutate({ id: editingToolId, tool: toolForm });
        } else {
            createToolMutation.mutate(toolForm);
        }

        closeToolModal();
    };

    const handleSaveProductCategory = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!productCategoryForm.name.trim()) return;

        if (editingProductCategoryId) {
            updateProductCategoryMutation.mutate({ id: editingProductCategoryId, category: productCategoryForm });
        } else {
            createProductCategoryMutation.mutate(productCategoryForm);
        }

        closeProductCategoryModal();
    };

    const openCurrentAddModal = () => {
        if (activeTab === "Roles") openAddRoleModal();
        if (activeTab === "Branches") openAddBranchModal();
        if (activeTab === "Tools") openAddToolModal();
        if (activeTab === "Product Categories") openAddProductCategoryModal();
    };

    const openDeletePrompt = (target: { label: string; type: SettingsTab; onConfirm: () => void }) => {
        setDeleteTarget(target);
        setDeleteStep(1);
    };

    const closeDeletePrompt = () => {
        setDeleteTarget(null);
        setDeleteStep(1);
    };

    const confirmDelete = () => {
        deleteTarget?.onConfirm();
        closeDeletePrompt();
    };

    return (
        <AdminLayout>
            <section className="min-h-[calc(100vh-8.5rem)] rounded-lg border border-white/10 bg-[#090b13]/80">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Admin Settings</p>
                        <h2 className="mt-1 text-xl font-semibold text-white">{activeTab}</h2>
                    </div>

                    {activeTab !== "Features" && activeTab !== "System" && (
                        <button
                            className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                            type="button"
                            onClick={openCurrentAddModal}
                        >
                            <FiPlus className="size-4" aria-hidden="true" />
                            Add {activeTab === "Roles" ? "Role" : activeTab === "Branches" ? "Branch" : activeTab === "Tools" ? "Tool" : "Category"}
                        </button>
                    )}
                </div>

                <div className="border-b border-white/10 px-4 pt-3">
                    <div className="flex gap-2">
                        {(["Roles", "Branches", "Tools", "Product Categories", "Features", "System"] as const).map((tab) => {
                            const Icon =
                                tab === "Roles"
                                    ? FiShield
                                    : tab === "Branches"
                                      ? FiGitBranch
                                      : tab === "Tools"
                                        ? FiTool
                                        : tab === "Product Categories"
                                          ? FiTag
                                          : tab === "Features"
                                            ? FiSliders
                                            : FiCreditCard;

                            return (
                                <button
                                    key={tab}
                                    className={[
                                        "flex h-11 items-center gap-2 px-4 text-sm font-semibold transition",
                                        activeTab === tab
                                            ? "border-b-2 border-[#842cff] bg-[#842cff]/12 text-white"
                                            : "text-white/55 hover:text-white",
                                    ].join(" ")}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                >
                                    <Icon className="size-4" aria-hidden="true" />
                                    {tab}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid gap-2.5 p-4 md:grid-cols-3">
                    {(activeTab === "Roles"
                        ? [
                              ["Roles", roles.length.toString()],
                              ["Default Role", roles[0]?.name || "None"],
                              ["Source", "MongoDB"],
                          ]
                        : activeTab === "Branches"
                          ? [
                              ["Branches", branches.length.toString()],
                              ["Default Branch", branches[0]?.name || "None"],
                              ["Source", "MongoDB"],
                          ]
                          : activeTab === "Tools"
                            ? [
                              ["Tools", tools.length.toString()],
                              ["Default Tool", tools[0]?.name || "None"],
                              ["Source", "MongoDB"],
                          ]
                            : activeTab === "Product Categories"
                              ? [
                                  ["Categories", productCategories.length.toString()],
                                  ["Default Category", productCategories[0]?.name || "None"],
                                  ["Source", "MongoDB"],
                              ]
                            : activeTab === "Features"
                              ? [
                                ["Features", features.length.toString()],
                                ["Admin Enabled", features.filter((feature) => feature.adminEnabled).length.toString()],
                                ["Employee Enabled", features.filter((feature) => feature.employeeEnabled).length.toString()],
                            ]
                              : [
                                ["Currency", systemSettings?.currencyCode || "USD"],
                                ["Cycle", systemSettings?.payrollBillingCycle || "Monthly"],
                                ["Run Day", `Day ${systemSettings?.payrollRunDay ?? 15}`],
                            ]
                    ).map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3">
                            <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-white/35">{label}</p>
                            <p className="mt-1 truncate text-xl font-semibold text-white">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="px-4 pb-4">
                    <div className="flex h-[calc(100vh-25rem)] min-h-[26rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80 shadow-2xl shadow-black/20">
                        <div className="content-scroll min-h-0 flex-1 overflow-auto bg-[linear-gradient(to_bottom,#11151f_0,#11151f_3.15rem,transparent_3.15rem)] [scrollbar-gutter:stable]">
                        <table className="w-full min-w-[62rem] table-fixed border-separate border-spacing-0 text-left">
                            <thead className="sticky top-0 z-10 bg-[#11151f] text-[0.74rem] font-medium text-white/65 shadow-[12px_0_0_#11151f]">
                                {activeTab === "Roles" ? (
                                    <tr>
                                        <th className="w-[28%] px-5 py-4">Role</th>
                                        <th className="w-[56%] px-5 py-4">Description</th>
                                        <th className="w-[16%] px-5 py-4 text-right">Actions</th>
                                    </tr>
                                ) : activeTab === "Branches" ? (
                                    <tr>
                                        <th className="w-[24%] px-5 py-4">Branch</th>
                                        <th className="w-[24%] px-5 py-4">Company</th>
                                        <th className="w-[36%] px-5 py-4">Location</th>
                                        <th className="w-[16%] px-5 py-4 text-right">Actions</th>
                                    </tr>
                                ) : activeTab === "Tools" ? (
                                    <tr>
                                        <th className="w-[22%] px-5 py-4">Tool</th>
                                        <th className="w-[34%] px-5 py-4">Link</th>
                                        <th className="w-[28%] px-5 py-4">Branches</th>
                                        <th className="w-[16%] px-5 py-4 text-right">Actions</th>
                                    </tr>
                                ) : activeTab === "Product Categories" ? (
                                    <tr>
                                        <th className="w-[28%] px-5 py-4">Category</th>
                                        <th className="w-[56%] px-5 py-4">Description</th>
                                        <th className="w-[16%] px-5 py-4 text-right">Actions</th>
                                    </tr>
                                ) : activeTab === "Features" ? (
                                    <tr>
                                        <th className="w-[24%] px-5 py-4">Feature</th>
                                        <th className="w-[48%] px-5 py-4">Description</th>
                                        <th className="w-[14%] px-5 py-4 text-center">Admin</th>
                                        <th className="w-[14%] px-5 py-4 text-center">Employee</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="w-[28%] px-5 py-4">Setting</th>
                                        <th className="w-[18%] px-5 py-4">Current</th>
                                        <th className="w-[18%] px-5 py-4">Type</th>
                                        <th className="w-[36%] px-5 py-4">Action</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {activeTab === "Roles" ? (
                                    <>
                                        {rolesLoading && <EmptyRow colSpan={3} text="Loading roles..." />}
                                        {rolesError && <EmptyRow colSpan={3} text="Unable to load roles." danger />}
                                        {!rolesLoading && !rolesError && roles.length === 0 && <EmptyRow colSpan={3} text="No roles yet." />}
                                        {roles.map((role) => (
                                            <tr key={role._id} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                                <td className="px-5 py-4 font-semibold text-white">{role.name}</td>
                                                <td className="truncate px-5 py-4 text-white/55">{role.description || "No description"}</td>
                                                <td className="px-5 py-4">
                                                    <RowActions
                                                        label={role.name}
                                                        onEdit={() => openEditRoleModal(role)}
                                                        onArchive={() =>
                                                            openDeletePrompt({
                                                                label: role.name,
                                                                type: "Roles",
                                                                onConfirm: () => archiveRoleMutation.mutate(role._id),
                                                            })
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : activeTab === "Branches" ? (
                                    <>
                                        {branchesLoading && <EmptyRow colSpan={4} text="Loading branches..." />}
                                        {branchesError && <EmptyRow colSpan={4} text="Unable to load branches." danger />}
                                        {!branchesLoading && !branchesError && branches.length === 0 && <EmptyRow colSpan={4} text="No branches yet." />}
                                        {branches.map((branch) => (
                                            <tr key={branch._id} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                                <td className="px-5 py-4 font-semibold text-white">{branch.name}</td>
                                                <td className="truncate px-5 py-4 text-white/60">{branch.company}</td>
                                                <td className="truncate px-5 py-4 text-white/55">{branch.location || "No location"}</td>
                                                <td className="px-5 py-4">
                                                    <RowActions
                                                        label={branch.name}
                                                        onEdit={() => openEditBranchModal(branch)}
                                                        onArchive={() =>
                                                            openDeletePrompt({
                                                                label: branch.name,
                                                                type: "Branches",
                                                                onConfirm: () => archiveBranchMutation.mutate(branch._id),
                                                            })
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : activeTab === "Tools" ? (
                                    <>
                                        {toolsLoading && <EmptyRow colSpan={4} text="Loading tools..." />}
                                        {toolsError && <EmptyRow colSpan={4} text="Unable to load tools." danger />}
                                        {!toolsLoading && !toolsError && tools.length === 0 && <EmptyRow colSpan={4} text="No tools yet." />}
                                        {tools.map((tool) => (
                                            <tr key={tool._id} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                                <td className="px-5 py-4 font-semibold text-white">{tool.name}</td>
                                                <td className="truncate px-5 py-4 text-white/60">
                                                    {tool.link ? (
                                                        <a className="block truncate transition hover:text-white" href={tool.link} target="_blank" rel="noreferrer">
                                                            {tool.link}
                                                        </a>
                                                    ) : (
                                                        "No link"
                                                    )}
                                                </td>
                                                <td className="truncate px-5 py-4 text-white/55">
                                                    {tool.branches?.length ? tool.branches.join(", ") : "All branches"}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <RowActions
                                                        label={tool.name}
                                                        onEdit={() => openEditToolModal(tool)}
                                                        onArchive={() =>
                                                            openDeletePrompt({
                                                                label: tool.name,
                                                                type: "Tools",
                                                                onConfirm: () => archiveToolMutation.mutate(tool._id),
                                                            })
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : activeTab === "Product Categories" ? (
                                    <>
                                        {productCategoriesLoading && <EmptyRow colSpan={3} text="Loading categories..." />}
                                        {productCategoriesError && <EmptyRow colSpan={3} text="Unable to load categories." danger />}
                                        {!productCategoriesLoading && !productCategoriesError && productCategories.length === 0 && <EmptyRow colSpan={3} text="No categories yet." />}
                                        {productCategories.map((category) => (
                                            <tr key={category._id} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                                <td className="px-5 py-4 font-semibold text-white">{category.name}</td>
                                                <td className="truncate px-5 py-4 text-white/55">{category.description || "No description"}</td>
                                                <td className="px-5 py-4">
                                                    <RowActions
                                                        label={category.name}
                                                        onEdit={() => openEditProductCategoryModal(category)}
                                                        onArchive={() =>
                                                            openDeletePrompt({
                                                                label: category.name,
                                                                type: "Product Categories",
                                                                onConfirm: () => archiveProductCategoryMutation.mutate(category._id),
                                                            })
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : activeTab === "Features" ? (
                                    <>
                                        {featuresLoading && <EmptyRow colSpan={4} text="Loading features..." />}
                                        {featuresError && <EmptyRow colSpan={4} text="Unable to load features." danger />}
                                        {!featuresLoading && !featuresError && features.length === 0 && <EmptyRow colSpan={4} text="No features yet." />}
                                        {features.map((feature) => (
                                            <tr key={feature.key} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                                <td className="px-5 py-4 font-semibold text-white">{feature.label}</td>
                                                <td className="truncate px-5 py-4 text-white/55">{feature.description || "No description"}</td>
                                                <td className="px-5 py-4 text-center">
                                                    <FeatureToggle
                                                        checked={feature.adminEnabled}
                                                        label={`Toggle admin ${feature.label}`}
                                                        onChange={() =>
                                                            updateFeatureMutation.mutate({
                                                                feature: { ...feature, adminEnabled: !feature.adminEnabled },
                                                            })
                                                        }
                                                    />
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <FeatureToggle
                                                        checked={feature.employeeEnabled}
                                                        label={`Toggle employee ${feature.label}`}
                                                        onChange={() =>
                                                            updateFeatureMutation.mutate({
                                                                feature: { ...feature, employeeEnabled: !feature.employeeEnabled },
                                                            })
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {systemSettingsLoading && <EmptyRow colSpan={4} text="Loading system settings..." />}
                                        {systemSettingsError && <EmptyRow colSpan={4} text="Unable to load system settings." danger />}
                                        {!systemSettingsLoading &&
                                            !systemSettingsError &&
                                            currencyOptions.map((currency) => {
                                                const isActive = (systemSettings?.currencyCode || "USD") === currency.code;

                                                return (
                                                    <tr key={currency.code} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                                        <td className="px-5 py-4 font-semibold text-white">{currency.label}</td>
                                                        <td className="px-5 py-4 text-white/60">{currency.code}</td>
                                                        <td className="px-5 py-4 text-xl font-semibold text-white">{currency.symbol}</td>
                                                        <td className="px-5 py-4">
                                                            <button
                                                                className={[
                                                                    "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                                                                    isActive
                                                                        ? "border-[#842cff]/45 bg-[#842cff]/20 text-white"
                                                                        : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white",
                                                                ].join(" ")}
                                                                type="button"
                                                                disabled={isActive || updateSystemSettingsMutation.isPending}
                                                                onClick={() => updateSystemSettingsMutation.mutate({ currencyCode: currency.code as CurrencyCode })}
                                                            >
                                                                {isActive && <FiCheck className="size-4" aria-hidden="true" />}
                                                                {isActive ? "Active currency" : "Use currency"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        {!systemSettingsLoading && !systemSettingsError && (
                                            <>
                                                <tr className="bg-white/[0.02] text-sm text-white/80 transition hover:bg-white/[0.035]">
                                                    <td className="px-5 py-4 font-semibold text-white">Payroll billing cycle</td>
                                                    <td className="px-5 py-4 text-white/65">{systemSettings?.payrollBillingCycle || "Monthly"}</td>
                                                    <td className="px-5 py-4 text-white/45">Payroll</td>
                                                    <td className="px-5 py-4">
                                                        <select
                                                            className="h-9 min-w-40 rounded-lg border border-white/10 bg-[#080b12] px-3 text-sm font-semibold text-white outline-none transition focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20 disabled:opacity-60"
                                                            value={systemSettings?.payrollBillingCycle || "Monthly"}
                                                            disabled={updateSystemSettingsMutation.isPending}
                                                            onChange={(event) =>
                                                                updateSystemSettingsMutation.mutate({
                                                                    payrollBillingCycle: event.target.value as PayrollBillingCycle,
                                                                })
                                                            }
                                                        >
                                                            {payrollBillingCycleOptions.map((cycle) => (
                                                                <option key={cycle}>{cycle}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                                <tr className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                                    <td className="px-5 py-4 font-semibold text-white">Payroll run day</td>
                                                    <td className="px-5 py-4 text-white/65">Day {systemSettings?.payrollRunDay ?? 15}</td>
                                                    <td className="px-5 py-4 text-white/45">Schedule</td>
                                                    <td className="px-5 py-4">
                                                        <input
                                                            className="h-9 w-28 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20 disabled:opacity-60"
                                                            type="number"
                                                            min={1}
                                                            max={31}
                                                            defaultValue={systemSettings?.payrollRunDay ?? 15}
                                                            disabled={updateSystemSettingsMutation.isPending}
                                                            onBlur={(event) =>
                                                                updateSystemSettingsMutation.mutate({
                                                                    payrollRunDay: Number(event.target.value),
                                                                })
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                                <tr className="bg-white/[0.02] text-sm text-white/80 transition hover:bg-white/[0.035]">
                                                    <td className="px-5 py-4 font-semibold text-white">Employee deductions</td>
                                                    <td className="px-5 py-4 text-white/65">Payroll Deductions tab</td>
                                                    <td className="px-5 py-4 text-white/45">Payroll</td>
                                                    <td className="px-5 py-4 text-sm text-white/45">
                                                        Add SSS, benefits, or other fixed employee deductions in Payroll &gt; Deductions.
                                                    </td>
                                                </tr>
                                            </>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                        </div>
                        <div className="flex min-h-14 items-center justify-between border-t border-white/10 px-5 py-3">
                            <p className="text-xs text-white/45">
                                {activeTab === "Roles"
                                    ? `Showing ${roles.length} role${roles.length === 1 ? "" : "s"}`
                                    : activeTab === "Branches"
                                      ? `Showing ${branches.length} branch${branches.length === 1 ? "" : "es"}`
                                      : activeTab === "Tools"
                                        ? `Showing ${tools.length} tool${tools.length === 1 ? "" : "s"}`
                                        : activeTab === "Product Categories"
                                          ? `Showing ${productCategories.length} categor${productCategories.length === 1 ? "y" : "ies"}`
                                        : activeTab === "Features"
                                          ? `Showing ${features.length} feature${features.length === 1 ? "" : "s"}`
                                          : `Showing ${currencyOptions.length + 3} system setting${currencyOptions.length + 3 === 1 ? "" : "s"}`}
                            </p>
                            <span className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-white/55">
                                {activeTab}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {isRoleModalOpen && (
                <SettingsModal
                    title={editingRoleId ? "Edit Role" : "Add Role"}
                    subtitle="Roles appear in the employee form."
                    onClose={closeRoleModal}
                    onSubmit={handleSaveRole}
                >
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
                </SettingsModal>
            )}

            {isBranchModalOpen && (
                <SettingsModal
                    title={editingBranchId ? "Edit Branch" : "Add Branch"}
                    subtitle="Branches appear in credentials and branch filters."
                    onClose={closeBranchModal}
                    onSubmit={handleSaveBranch}
                >
                    <label>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Branch Name</span>
                        <input
                            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                            value={branchForm.name}
                            onChange={(event) => setBranchForm((branch) => ({ ...branch, name: event.target.value }))}
                            placeholder="Assistly HQ"
                        />
                    </label>
                    <label>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Company</span>
                        <input
                            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                            value={branchForm.company}
                            onChange={(event) => setBranchForm((branch) => ({ ...branch, company: event.target.value }))}
                            placeholder="Assistly"
                        />
                    </label>
                    <label>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Location</span>
                        <input
                            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                            value={branchForm.location}
                            onChange={(event) => setBranchForm((branch) => ({ ...branch, location: event.target.value }))}
                            placeholder="Main office, Finance team, Austin..."
                        />
                    </label>
                </SettingsModal>
            )}

            {isToolModalOpen && (
                <SettingsModal
                    title={editingToolId ? "Edit Tool" : "Add Tool"}
                    subtitle="Tools can be referenced by credentials and team workflows."
                    onClose={closeToolModal}
                    onSubmit={handleSaveTool}
                >
                    <label>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Tool Name</span>
                        <input
                            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                            value={toolForm.name}
                            onChange={(event) => setToolForm((tool) => ({ ...tool, name: event.target.value }))}
                            placeholder="Google Workspace"
                        />
                    </label>
                    <label>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Link</span>
                        <input
                            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                            value={toolForm.link}
                            onChange={(event) => setToolForm((tool) => ({ ...tool, link: event.target.value }))}
                            placeholder="https://example.com"
                        />
                    </label>
                    <div className="relative">
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Branches</span>
                        <button
                            className={[
                                "mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border bg-black/20 px-3 text-left text-sm font-semibold transition",
                                isToolBranchDropdownOpen
                                    ? "border-[#842cff] text-white ring-2 ring-[#842cff]/20"
                                    : "border-white/10 text-white/70 hover:bg-white/[0.04] hover:text-white",
                            ].join(" ")}
                            type="button"
                            onClick={() => setIsToolBranchDropdownOpen((isOpen) => !isOpen)}
                            aria-expanded={isToolBranchDropdownOpen}
                        >
                            <span className="min-w-0 truncate">
                                {toolForm.branches.length ? toolForm.branches.join(", ") : "Select branches"}
                            </span>
                            <FiChevronDown
                                className={[
                                    "size-4 shrink-0 text-white/40 transition",
                                    isToolBranchDropdownOpen ? "rotate-180" : "",
                                ].join(" ")}
                                aria-hidden="true"
                            />
                        </button>
                        {isToolBranchDropdownOpen && (
                            <div className="absolute left-0 right-0 top-[4.7rem] z-40 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-[#0d1018] py-1 shadow-2xl shadow-black/40">
                                {branches.map((branch) => {
                                    const isSelected = toolForm.branches.includes(branch.name);

                                    return (
                                        <button
                                            key={branch._id}
                                            className={[
                                                "flex h-10 w-full items-center justify-between gap-3 px-3 text-left text-sm font-semibold transition",
                                                isSelected
                                                    ? "bg-[#842cff]/20 text-white"
                                                    : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                                            ].join(" ")}
                                            type="button"
                                            onClick={() =>
                                                setToolForm((tool) => ({
                                                    ...tool,
                                                    branches: isSelected
                                                        ? tool.branches.filter((branchName) => branchName !== branch.name)
                                                        : [...tool.branches, branch.name],
                                                }))
                                            }
                                        >
                                            <span className="truncate">{branch.name}</span>
                                            {isSelected && <FiCheck className="size-4 text-[#9df6b7]" aria-hidden="true" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </SettingsModal>
            )}

            {isProductCategoryModalOpen && (
                <SettingsModal
                    title={editingProductCategoryId ? "Edit Category" : "Add Category"}
                    subtitle="Categories appear below the title field for product entries."
                    onClose={closeProductCategoryModal}
                    onSubmit={handleSaveProductCategory}
                >
                    <label>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Category Name</span>
                        <input
                            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                            value={productCategoryForm.name}
                            onChange={(event) => setProductCategoryForm((category) => ({ ...category, name: event.target.value }))}
                            placeholder="Website package"
                        />
                    </label>
                    <label>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Description</span>
                        <textarea
                            className="mt-2 min-h-24 w-full resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                            value={productCategoryForm.description}
                            onChange={(event) => setProductCategoryForm((category) => ({ ...category, description: event.target.value }))}
                            placeholder="Optional category description"
                        />
                    </label>
                </SettingsModal>
            )}

            {deleteTarget && (
                <TwoStepDeleteModal
                    title={deleteStep === 1 ? "Are you sure you want to delete?" : `You are deleting this ${deleteTarget.type.slice(0, -1).toLowerCase()}`}
                    label={deleteTarget.label}
                    context={deleteTarget.type}
                    step={deleteStep}
                    onCancel={closeDeletePrompt}
                    onContinue={() => setDeleteStep(2)}
                    onConfirm={confirmDelete}
                />
            )}
        </AdminLayout>
    );
}

function EmptyRow({ colSpan, text, danger = false }: { colSpan: number; text: string; danger?: boolean }) {
    return (
        <tr>
            <td className={`px-5 py-8 text-center text-sm ${danger ? "text-red-200" : "text-white/45"}`} colSpan={colSpan}>
                {text}
            </td>
        </tr>
    );
}

function RowActions({ label, onEdit, onArchive }: { label: string; onEdit: () => void; onArchive: () => void }) {
    return (
        <div className="flex justify-end gap-1.5">
            <button
                className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                type="button"
                aria-label={`Edit ${label}`}
                onClick={onEdit}
            >
                <FiEdit2 className="size-4" aria-hidden="true" />
            </button>
            <button
                className="flex size-8 items-center justify-center rounded-lg border border-red-400/15 bg-red-400/8 text-red-100/60 transition hover:bg-red-400/10 hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-400/35"
                type="button"
                aria-label={`Archive ${label}`}
                onClick={onArchive}
            >
                <FiArchive className="size-4" aria-hidden="true" />
            </button>
        </div>
    );
}

function FeatureToggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
    return (
        <button
            className={[
                "mx-auto flex h-7 w-12 items-center rounded-full border px-1 transition focus:outline-none focus:ring-2 focus:ring-[#842cff]/60",
                checked ? "border-[#842cff]/50 bg-[#842cff]/45" : "border-white/10 bg-white/[0.06]",
            ].join(" ")}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={onChange}
        >
            <span
                className={[
                    "size-5 rounded-full bg-white shadow transition",
                    checked ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
            />
        </button>
    );
}

function SettingsModal({
    title,
    subtitle,
    onClose,
    onSubmit,
    children,
}: {
    title: string;
    subtitle: string;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    children: React.ReactNode;
}) {
    return (
        <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <form
                className="modal-panel-enter flex w-full max-w-[30rem] flex-col rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40"
                onSubmit={onSubmit}
            >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                    <div>
                        <h3 className="text-base font-semibold text-white">{title}</h3>
                        <p className="mt-1 text-sm text-white/45">{subtitle}</p>
                    </div>
                    <button
                        className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                        type="button"
                        aria-label="Close settings modal"
                        onClick={onClose}
                    >
                        <FiX className="size-4" aria-hidden="true" />
                    </button>
                </div>

                <div className="grid gap-4 p-5">{children}</div>

                <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-3.5">
                    <button
                        className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                        type="button"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                        type="submit"
                    >
                        <FiSave className="size-4" aria-hidden="true" />
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
}

function TwoStepDeleteModal({
    title,
    label,
    context,
    step,
    onCancel,
    onContinue,
    onConfirm,
}: {
    title: string;
    label: string;
    context: string;
    step: 1 | 2;
    onCancel: () => void;
    onContinue: () => void;
    onConfirm: () => void;
}) {
    return (
        <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <div className="modal-panel-enter w-full max-w-[32rem] overflow-hidden rounded-lg border border-red-400/20 bg-[#0d1018] shadow-2xl shadow-red-950/30">
                <div className="bg-[radial-gradient(circle_at_15%_20%,rgba(239,68,68,0.22),transparent_35%),linear-gradient(135deg,rgba(239,68,68,0.12),rgba(132,44,255,0.08))] px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-red-300/20 bg-red-500/15 text-red-100">
                                <FiAlertTriangle className="size-5" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-red-100/55">Delete {context}</p>
                                <h3 className="mt-1 text-lg font-semibold text-white">{title}</h3>
                                <p className="mt-1 text-sm text-red-50/60">
                                    {step === 1 ? "This will remove it from active records." : "Final confirmation required before this record is archived."}
                                </p>
                            </div>
                        </div>
                        <button className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={onCancel} aria-label="Close delete confirmation">
                            <FiX className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {[1, 2].map((currentStep) => (
                            <div key={currentStep} className={["h-1.5 rounded-full transition", step >= currentStep ? "bg-red-400" : "bg-white/10"].join(" ")} />
                        ))}
                    </div>
                </div>
                <div className="p-5">
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Selected Record</p>
                        <p className="mt-2 text-sm font-semibold text-white">{label}</p>
                    </div>
                    <div className="mt-3 rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-3">
                        <p className="text-sm leading-6 text-yellow-50/75">
                            {step === 1 ? "Review this record before continuing. You will be asked one more time." : `You are deleting ${label}.`}
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                    <button className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={onCancel}>Cancel</button>
                    {step === 1 ? (
                        <button className="h-10 rounded-lg border border-red-400/20 bg-red-400/10 px-4 text-sm font-semibold text-red-100/80 transition hover:bg-red-400/15 hover:text-red-100" type="button" onClick={onContinue}>Continue</button>
                    ) : (
                        <button className="h-10 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-400" type="button" onClick={onConfirm}>Delete</button>
                    )}
                </div>
            </div>
        </div>
    );
}
