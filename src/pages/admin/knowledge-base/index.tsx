import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    FiChevronLeft,
    FiChevronDown,
    FiChevronRight,
    FiEdit2,
    FiExternalLink,
    FiFileText,
    FiAlertTriangle,
    FiHelpCircle,
    FiImage,
    FiMessageCircle,
    FiPlus,
    FiSave,
    FiTrash2,
    FiX,
} from "react-icons/fi";
import AdminLayout from "../adminLayout";
import {
    approveKnowledgeBaseSuggestion,
    archiveKnowledgeBaseEntry,
    createKnowledgeBaseEntry,
    getKnowledgeBaseSuggestions,
    rejectKnowledgeBaseSuggestion,
    getKnowledgeBaseEntries,
    uploadKnowledgeBaseDocument,
    uploadKnowledgeBasePhoto,
    updateKnowledgeBaseEntry,
    type KnowledgeBaseEntry,
    type KnowledgeBaseDocument,
    type KnowledgeBaseEntryType,
    type KnowledgeBaseInput,
    type KnowledgeBaseSuggestion,
} from "../../../api/knowledgeBase";
import { getProductCategories } from "../../../api/productCategories";
import { backendOrigin } from "../../../lib/backendUrl";

const emptyProduct: KnowledgeBaseInput = {
    entryType: "Product",
    title: "",
    category: "",
    description: "",
    scope: "",
    photoUrls: [],
    documents: [],
    question: "",
    answer: "",
    status: "Active",
};

const emptyFaq: KnowledgeBaseInput = {
    ...emptyProduct,
    entryType: "FAQ",
};

function entryToInput(entry: KnowledgeBaseEntry): KnowledgeBaseInput {
    return {
        entryType: entry.entryType,
        title: entry.title,
        category: entry.category || "",
        description: entry.description,
        scope: entry.scope,
        photoUrls: entry.photoUrls,
        documents: entry.documents || [],
        question: entry.question,
        answer: entry.answer,
        comments: entry.comments || [],
        status: entry.status,
    };
}

function getFileUrl(url: string) {
    return url.startsWith("http") ? url : `${backendOrigin}${url}`;
}

export default function AdminKnowledgeBase() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<KnowledgeBaseEntryType>("Product");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const [previewDocument, setPreviewDocument] = useState<KnowledgeBaseDocument | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<KnowledgeBaseEntry | null>(null);
    const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
    const [suggestionEntryFilter, setSuggestionEntryFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [productForm, setProductForm] = useState<KnowledgeBaseInput>(emptyProduct);
    const [faqForm, setFaqForm] = useState<KnowledgeBaseInput>(emptyFaq);
    const [isCustomProductCategory, setIsCustomProductCategory] = useState(false);
    const [isProductCategoryDropdownOpen, setIsProductCategoryDropdownOpen] = useState(false);

    const { data: entries = [], isLoading, isError } = useQuery({
        queryKey: ["knowledge-base"],
        queryFn: () => getKnowledgeBaseEntries(),
    });

    const { data: pendingSuggestions = [] } = useQuery({
        queryKey: ["knowledge-base-suggestions", "Pending"],
        queryFn: () => getKnowledgeBaseSuggestions({ status: "Pending" }),
    });
    const { data: productCategories = [] } = useQuery({
        queryKey: ["product-categories"],
        queryFn: getProductCategories,
    });

    const activeEntries = useMemo(
        () => entries.filter((entry) => entry.entryType === activeTab),
        [activeTab, entries]
    );
    const totalPages = Math.max(1, Math.ceil(activeEntries.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageStart = activeEntries.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const pageEnd = Math.min(safePage * pageSize, activeEntries.length);
    const paginatedEntries = useMemo(
        () => activeEntries.slice((safePage - 1) * pageSize, safePage * pageSize),
        [activeEntries, pageSize, safePage]
    );
    const currentForm = activeTab === "Product" ? productForm : faqForm;
    const productCategoryNames = useMemo(
        () => new Set(productCategories.map((category) => category.name)),
        [productCategories]
    );
    const categorySelectValue = isCustomProductCategory ? "__custom__" : productForm.category;
    const selectedCategoryLabel = isCustomProductCategory
        ? "Custom category"
        : productForm.category || "Select category";
    const visibleSuggestions = useMemo(
        () =>
            pendingSuggestions.filter((suggestion) => {
                if (suggestion.entryType !== activeTab) {
                    return false;
                }

                if (!suggestionEntryFilter) {
                    return true;
                }

                const entryId = typeof suggestion.entry === "string" ? suggestion.entry : suggestion.entry._id;
                return entryId === suggestionEntryFilter;
            }),
        [activeTab, pendingSuggestions, suggestionEntryFilter]
    );
    const pendingCountByEntryId = useMemo(() => {
        const counts = new Map<string, number>();

        pendingSuggestions.forEach((suggestion) => {
            const entryId = typeof suggestion.entry === "string" ? suggestion.entry : suggestion.entry._id;
            counts.set(entryId, (counts.get(entryId) || 0) + 1);
        });

        return counts;
    }, [pendingSuggestions]);

    useEffect(() => {
        setPage(1);
    }, [activeTab, pageSize]);

    useEffect(() => {
        setPage((currentPage) => Math.min(currentPage, totalPages));
    }, [totalPages]);

    const invalidateKnowledge = () => queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });

    const createMutation = useMutation({
        mutationFn: createKnowledgeBaseEntry,
        onSuccess: () => {
            invalidateKnowledge();
            closeModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, entry }: { id: string; entry: KnowledgeBaseInput }) => updateKnowledgeBaseEntry(id, entry),
        onSuccess: () => {
            invalidateKnowledge();
            closeModal();
        },
    });

    const uploadPhotoMutation = useMutation({
        mutationFn: uploadKnowledgeBasePhoto,
        onSuccess: ({ url }) => {
            setProductForm((form) => ({ ...form, photoUrls: [...form.photoUrls, url] }));
        },
    });

    const uploadDocumentMutation = useMutation({
        mutationFn: uploadKnowledgeBaseDocument,
        onSuccess: (document) => {
            if (activeTab === "Product") {
                setProductForm((form) => ({ ...form, documents: [...(form.documents || []), document] }));
                return;
            }

            setFaqForm((form) => ({ ...form, documents: [...(form.documents || []), document] }));
        },
    });

    const archiveMutation = useMutation({
        mutationFn: archiveKnowledgeBaseEntry,
        onSuccess: invalidateKnowledge,
    });

    const approveSuggestionMutation = useMutation({
        mutationFn: approveKnowledgeBaseSuggestion,
        onSuccess: () => {
            invalidateKnowledge();
            queryClient.invalidateQueries({ queryKey: ["knowledge-base-suggestions"] });
        },
    });

    const rejectSuggestionMutation = useMutation({
        mutationFn: rejectKnowledgeBaseSuggestion,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["knowledge-base-suggestions"] }),
    });

    const resetForms = () => {
        setEditingId(null);
        setProductForm(emptyProduct);
        setFaqForm(emptyFaq);
        setIsCustomProductCategory(false);
        setIsProductCategoryDropdownOpen(false);
    };

    const closeModal = () => {
        setIsEntryModalOpen(false);
        resetForms();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const entry = {
            ...currentForm,
            entryType: activeTab,
            photoUrls: activeTab === "Product" ? currentForm.photoUrls : [],
            documents: currentForm.documents || [],
        };

        if (activeTab === "Product" && !entry.title.trim()) {
            return;
        }

        if (activeTab === "FAQ" && !entry.question.trim()) {
            return;
        }

        if (editingId) {
            updateMutation.mutate({ id: editingId, entry });
            return;
        }

        createMutation.mutate(entry);
    };

    const startEdit = (entry: KnowledgeBaseEntry) => {
        setActiveTab(entry.entryType);
        setEditingId(entry._id);
        setIsEntryModalOpen(true);

        if (entry.entryType === "Product") {
            setIsCustomProductCategory(Boolean(entry.category && !productCategoryNames.has(entry.category)));
            setIsProductCategoryDropdownOpen(false);
            setProductForm(entryToInput(entry));
        } else {
            setIsCustomProductCategory(false);
            setIsProductCategoryDropdownOpen(false);
            setFaqForm(entryToInput(entry));
        }
    };

    const openNewEntry = (entryType = activeTab) => {
        setActiveTab(entryType);
        setEditingId(null);
        setProductForm(emptyProduct);
        setFaqForm(emptyFaq);
        setIsCustomProductCategory(false);
        setIsProductCategoryDropdownOpen(false);
        setIsEntryModalOpen(true);
    };

    const switchTab = (tab: KnowledgeBaseEntryType) => {
        setActiveTab(tab);
        resetForms();
    };

    const openSuggestions = (entry?: KnowledgeBaseEntry) => {
        setSuggestionEntryFilter(entry?._id || null);
        setIsSuggestionsOpen(true);
    };

    const openDeletePrompt = (entry: KnowledgeBaseEntry) => {
        setDeleteTarget(entry);
        setDeleteStep(1);
    };

    const closeDeletePrompt = () => {
        setDeleteTarget(null);
        setDeleteStep(1);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        archiveMutation.mutate(deleteTarget._id, { onSuccess: closeDeletePrompt });
    };

    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <AdminLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Knowledge Base</h2>
                        <p className="mt-1 text-sm text-white/45">Products, categories, scopes, photos, and FAQ for agents.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(["Product", "FAQ"] as const).map((tab) => (
                            <button
                                key={tab}
                                className={[
                                    "h-10 rounded-lg border px-4 text-sm font-semibold transition",
                                    activeTab === tab
                                        ? "border-[#842cff] bg-[#842cff]/20 text-white"
                                        : "border-white/10 bg-white/[0.05] text-white/55 hover:bg-white/[0.08] hover:text-white",
                                ].join(" ")}
                                type="button"
                                onClick={() => switchTab(tab)}
                            >
                                {tab === "Product" ? "Products" : "FAQ"}
                            </button>
                        ))}
                        <button
                            className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110"
                            type="button"
                            onClick={() => openNewEntry()}
                        >
                            <FiPlus className="size-4" aria-hidden="true" />
                            Add {activeTab === "Product" ? "Product" : "FAQ"}
                        </button>
                    </div>
                </div>

                <div className="pt-5">
                    <section className="flex h-[calc(100vh-13rem)] min-h-[34rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80 shadow-2xl shadow-black/20">
                        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.025] px-5 py-3">
                            <div>
                                <h3 className="text-base font-semibold text-white">{activeTab === "Product" ? "Products" : "FAQ"}</h3>
                                <p className="mt-1 text-xs text-white/40">
                                    {activeEntries.length > 0
                                        ? `Showing ${pageStart}-${pageEnd} of ${activeEntries.length}`
                                        : "No saved entries yet"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-white/55">
                                    {activeEntries.length}
                                </span>
                                <label className="flex items-center gap-2 text-xs font-semibold text-white/45">
                                    Rows
                                    <select
                                        className="h-9 rounded-lg border border-white/10 bg-black/20 px-2 text-sm font-semibold text-white outline-none transition focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                        value={pageSize}
                                        onChange={(event) => setPageSize(Number(event.target.value))}
                                    >
                                        {[10, 25, 50].map((size) => (
                                            <option key={size} value={size}>
                                                {size}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="content-scroll min-h-0 flex-1 overflow-auto">
                            {isLoading && <p className="p-5 text-sm text-white/45">Loading knowledge base...</p>}
                            {isError && <p className="p-5 text-sm text-red-200">Unable to load knowledge base.</p>}
                            {!isLoading && !isError && activeEntries.length === 0 && (
                                <p className="p-5 text-sm text-white/45">No entries yet.</p>
                            )}
                            {activeEntries.length > 0 && (
                                <table className="w-full min-w-[70rem] table-fixed border-separate border-spacing-0 text-left">
                                    <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0d1018] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/35">
                                        {activeTab === "Product" ? (
                                            <tr>
                                                <th className="w-[20%] px-4 py-3">Title</th>
                                                <th className="w-[14%] px-4 py-3">Category</th>
                                                <th className="w-[22%] px-4 py-3">Description</th>
                                                <th className="w-[16%] px-4 py-3">Scope</th>
                                                <th className="w-[8%] px-4 py-3">Photos</th>
                                                <th className="w-[8%] px-4 py-3">Docs</th>
                                                <th className="w-[12%] px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        ) : (
                                            <tr>
                                                <th className="w-[30%] px-4 py-3">Question</th>
                                                <th className="w-[42%] px-4 py-3">Answer</th>
                                                <th className="w-[8%] px-4 py-3">Docs</th>
                                                <th className="w-[8%] px-4 py-3">Status</th>
                                                <th className="w-[12%] px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {paginatedEntries.map((entry) =>
                                            activeTab === "Product" ? (
                                                <tr key={entry._id} className="text-sm transition odd:bg-white/[0.015] hover:bg-white/[0.05]">
                                                    <td className="px-4 py-4 align-top">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            {entry.photoUrls[0] ? (
                                                                <img
                                                                    className="size-11 shrink-0 rounded-lg border border-white/10 object-cover"
                                                                    src={entry.photoUrls[0]}
                                                                    alt={entry.title}
                                                                />
                                                            ) : (
                                                                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#9b5cff]">
                                                                    <FiImage className="size-5" aria-hidden="true" />
                                                                </span>
                                                            )}
                                                            <span className="min-w-0">
                                                                <span className="block truncate font-semibold text-white">{entry.title}</span>
                                                                <span className="mt-1 block truncate text-xs text-white/40">{entry.status}</span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-white/60">
                                                        <p className="line-clamp-2">{entry.category || "No category"}</p>
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-white/60">
                                                        <p className="line-clamp-2">{entry.description || "No description"}</p>
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-white/60">
                                                        <p className="line-clamp-2">{entry.scope || "No scope"}</p>
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-white/65">{entry.photoUrls.length}</td>
                                                    <td className="px-4 py-4 align-top">
                                                        {entry.documents?.length ? (
                                                            <button
                                                                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-xs font-semibold text-white/65 transition hover:bg-white/10 hover:text-white"
                                                                type="button"
                                                                onClick={() => setPreviewDocument(entry.documents[0])}
                                                            >
                                                                <FiFileText className="size-3.5" aria-hidden="true" />
                                                                {entry.documents.length}
                                                            </button>
                                                        ) : (
                                                            <span className="text-white/35">0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 align-top">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                                                                type="button"
                                                                onClick={() => startEdit(entry)}
                                                                aria-label="Edit entry"
                                                            >
                                                                <FiEdit2 className="size-4" aria-hidden="true" />
                                                            </button>
                                                            <button
                                                                className="relative flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                                                                type="button"
                                                                onClick={() => openSuggestions(entry)}
                                                                aria-label="View entry suggestions"
                                                            >
                                                                <FiMessageCircle className="size-4" aria-hidden="true" />
                                                                {(pendingCountByEntryId.get(entry._id) || 0) > 0 && (
                                                                    <span className="absolute -right-1 -top-1 rounded-full bg-[#842cff] px-1 text-[0.6rem] font-bold text-white">
                                                                        {pendingCountByEntryId.get(entry._id)}
                                                                    </span>
                                                                )}
                                                            </button>
                                                            <button
                                                                className="flex size-8 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-100/70 transition hover:bg-red-400/15 hover:text-red-100"
                                                                type="button"
                                                                onClick={() => openDeletePrompt(entry)}
                                                                aria-label="Delete entry"
                                                            >
                                                                <FiTrash2 className="size-4" aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                <tr key={entry._id} className="text-sm transition odd:bg-white/[0.015] hover:bg-white/[0.05]">
                                                    <td className="px-4 py-4 align-top">
                                                        <div className="flex min-w-0 items-start gap-3">
                                                            <FiHelpCircle className="mt-0.5 size-4 shrink-0 text-[#9b5cff]" aria-hidden="true" />
                                                            <p className="line-clamp-2 font-semibold text-white">{entry.question}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-white/60">
                                                        <p className="line-clamp-3">{entry.answer || "No answer"}</p>
                                                    </td>
                                                    <td className="px-4 py-4 align-top">
                                                        {entry.documents?.length ? (
                                                            <button
                                                                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-xs font-semibold text-white/65 transition hover:bg-white/10 hover:text-white"
                                                                type="button"
                                                                onClick={() => setPreviewDocument(entry.documents[0])}
                                                            >
                                                                <FiFileText className="size-3.5" aria-hidden="true" />
                                                                {entry.documents.length}
                                                            </button>
                                                        ) : (
                                                            <span className="text-white/35">0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-white/65">{entry.status}</td>
                                                    <td className="px-4 py-4 align-top">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                                                                type="button"
                                                                onClick={() => startEdit(entry)}
                                                                aria-label="Edit entry"
                                                            >
                                                                <FiEdit2 className="size-4" aria-hidden="true" />
                                                            </button>
                                                            <button
                                                                className="relative flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                                                                type="button"
                                                                onClick={() => openSuggestions(entry)}
                                                                aria-label="View entry suggestions"
                                                            >
                                                                <FiMessageCircle className="size-4" aria-hidden="true" />
                                                                {(pendingCountByEntryId.get(entry._id) || 0) > 0 && (
                                                                    <span className="absolute -right-1 -top-1 rounded-full bg-[#842cff] px-1 text-[0.6rem] font-bold text-white">
                                                                        {pendingCountByEntryId.get(entry._id)}
                                                                    </span>
                                                                )}
                                                            </button>
                                                            <button
                                                                className="flex size-8 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-100/70 transition hover:bg-red-400/15 hover:text-red-100"
                                                                type="button"
                                                                onClick={() => openDeletePrompt(entry)}
                                                                aria-label="Delete entry"
                                                            >
                                                                <FiTrash2 className="size-4" aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.025] px-5 py-3">
                            <p className="text-xs font-medium text-white/45">
                                Page {safePage} of {totalPages}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    type="button"
                                    disabled={safePage <= 1}
                                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                                >
                                    <FiChevronLeft className="size-4" aria-hidden="true" />
                                    Previous
                                </button>
                                <span className="min-w-16 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center text-sm font-semibold text-white">
                                    {safePage}
                                </span>
                                <button
                                    className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                    type="button"
                                    disabled={safePage >= totalPages}
                                    onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
                                >
                                    Next
                                    <FiChevronRight className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                {isSuggestionsOpen && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                        <div className="modal-panel-enter flex max-h-[88vh] w-full max-w-[48rem] flex-col rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40">
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
                                        Pending Review
                                    </p>
                                    <h3 className="mt-1 text-base font-semibold text-white">
                                        {suggestionEntryFilter ? "Entry Suggestions" : "Knowledge Base Suggestions"}
                                    </h3>
                                </div>
                                <button
                                    className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                                    type="button"
                                    onClick={() => setIsSuggestionsOpen(false)}
                                    aria-label="Close suggestions"
                                >
                                    <FiX className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="content-scroll min-h-0 flex-1 overflow-y-auto p-5">
                                {visibleSuggestions.length === 0 ? (
                                    <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm text-white/50">
                                        No pending suggestions for this view.
                                    </p>
                                ) : (
                                    <div className="grid gap-3">
                                        {visibleSuggestions.map((suggestion: KnowledgeBaseSuggestion) => {
                                            const entryName =
                                                typeof suggestion.entry === "string"
                                                    ? "Knowledge base entry"
                                                    : suggestion.entry.title || suggestion.entry.question || "Knowledge base entry";

                                            return (
                                        <div
                                            key={suggestion._id}
                                            className="rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#842cff]/40 hover:bg-white/[0.055]"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="truncate text-sm font-semibold text-white">{entryName}</h4>
                                                    <p className="mt-1 text-xs text-white/40">
                                                        From {suggestion.submittedByName} · {new Date(suggestion.createdAt).toLocaleString()}
                                                    </p>
                                                    {suggestion.comment && (
                                                        <p className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/65">
                                                            {suggestion.comment}
                                                        </p>
                                                    )}
                                                    <div className="mt-3 grid gap-2 text-xs text-white/55">
                                                        {activeTab === "Product" ? (
                                                            <>
                                                                {suggestion.title && <p><span className="font-semibold text-white/80">Title:</span> {suggestion.title}</p>}
                                                                {suggestion.category && <p><span className="font-semibold text-white/80">Category:</span> {suggestion.category}</p>}
                                                                {suggestion.description && <p><span className="font-semibold text-white/80">Description:</span> {suggestion.description}</p>}
                                                                {suggestion.scope && <p><span className="font-semibold text-white/80">Scope:</span> {suggestion.scope}</p>}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {suggestion.question && <p><span className="font-semibold text-white/80">Question:</span> {suggestion.question}</p>}
                                                                {suggestion.answer && <p><span className="font-semibold text-white/80">Answer:</span> {suggestion.answer}</p>}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        className="h-9 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 text-sm font-semibold text-emerald-100/80 transition hover:bg-emerald-400/15 hover:text-emerald-50"
                                                        type="button"
                                                        onClick={() => approveSuggestionMutation.mutate(suggestion._id)}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="h-9 rounded-lg border border-red-400/20 bg-red-400/10 px-3 text-sm font-semibold text-red-100/70 transition hover:bg-red-400/15 hover:text-red-100"
                                                        type="button"
                                                        onClick={() => rejectSuggestionMutation.mutate(suggestion._id)}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {isEntryModalOpen && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                        <form
                            className="modal-panel-enter flex max-h-[88vh] w-full max-w-[48rem] flex-col rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40"
                            onSubmit={handleSubmit}
                        >
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
                                        {editingId ? "Editing" : "New Entry"}
                                    </p>
                                    <h3 className="mt-1 text-base font-semibold text-white">
                                        {activeTab === "Product" ? "Product or Service" : "FAQ"}
                                    </h3>
                                </div>
                                <button
                                    className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                                    type="button"
                                    onClick={closeModal}
                                    aria-label="Close entry modal"
                                >
                                    <FiX className="size-4" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="content-scroll min-h-0 flex-1 overflow-y-auto p-5">
                                {activeTab === "Product" ? (
                                    <div className="grid gap-4">
                                        <label>
                                            <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Title</span>
                                            <input
                                                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                value={productForm.title}
                                                onChange={(event) => setProductForm((form) => ({ ...form, title: event.target.value }))}
                                                placeholder="Website package, CRM setup, monthly support..."
                                            />
                                        </label>
                                        <div className="relative">
                                            <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Category</span>
                                            <button
                                                className={[
                                                    "mt-2 flex h-11 w-full items-center justify-between gap-3 rounded-lg border bg-black/20 px-3 text-left text-sm font-semibold outline-none transition",
                                                    isProductCategoryDropdownOpen
                                                        ? "border-[#842cff] text-white ring-2 ring-[#842cff]/20"
                                                        : "border-white/10 text-white hover:border-white/20 hover:bg-white/[0.04]",
                                                ].join(" ")}
                                                type="button"
                                                onClick={() => setIsProductCategoryDropdownOpen((isOpen) => !isOpen)}
                                                aria-expanded={isProductCategoryDropdownOpen}
                                            >
                                                <span className={productForm.category || isCustomProductCategory ? "truncate text-white" : "truncate text-white/45"}>
                                                    {selectedCategoryLabel}
                                                </span>
                                                <FiChevronDown
                                                    className={[
                                                        "size-4 shrink-0 text-white/45 transition",
                                                        isProductCategoryDropdownOpen ? "rotate-180 text-white/70" : "",
                                                    ].join(" ")}
                                                    aria-hidden="true"
                                                />
                                            </button>
                                            {isProductCategoryDropdownOpen && (
                                                <div className="absolute left-0 right-0 top-[4.55rem] z-50 overflow-hidden rounded-lg border border-white/10 bg-[#0d1018] py-1 shadow-2xl shadow-black/50">
                                                    <button
                                                        className={[
                                                            "flex h-10 w-full items-center px-3 text-left text-sm font-semibold transition",
                                                            !categorySelectValue
                                                                ? "bg-[#842cff]/25 text-white"
                                                                : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                                                        ].join(" ")}
                                                        type="button"
                                                        onClick={() => {
                                                            setIsCustomProductCategory(false);
                                                            setProductForm((form) => ({ ...form, category: "" }));
                                                            setIsProductCategoryDropdownOpen(false);
                                                        }}
                                                    >
                                                        Select category
                                                    </button>
                                                    {productCategories.map((category) => (
                                                        <button
                                                            key={category._id}
                                                            className={[
                                                                "flex h-10 w-full items-center px-3 text-left text-sm font-semibold transition",
                                                                !isCustomProductCategory && productForm.category === category.name
                                                                    ? "bg-[#842cff]/25 text-white"
                                                                    : "text-white/75 hover:bg-white/[0.06] hover:text-white",
                                                            ].join(" ")}
                                                            type="button"
                                                            onClick={() => {
                                                                setIsCustomProductCategory(false);
                                                                setProductForm((form) => ({ ...form, category: category.name }));
                                                                setIsProductCategoryDropdownOpen(false);
                                                            }}
                                                        >
                                                            {category.name}
                                                        </button>
                                                    ))}
                                                    <button
                                                        className={[
                                                            "flex h-10 w-full items-center border-t border-white/10 px-3 text-left text-sm font-semibold transition",
                                                            isCustomProductCategory
                                                                ? "bg-[#842cff]/25 text-white"
                                                                : "text-[#d8c8ff] hover:bg-[#842cff]/15 hover:text-white",
                                                        ].join(" ")}
                                                        type="button"
                                                        onClick={() => {
                                                            setIsCustomProductCategory(true);
                                                            setProductForm((form) => ({ ...form, category: "" }));
                                                            setIsProductCategoryDropdownOpen(false);
                                                        }}
                                                    >
                                                        Custom category
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {isCustomProductCategory && (
                                            <label>
                                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Custom Category</span>
                                                <input
                                                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                    value={productForm.category}
                                                    onChange={(event) => setProductForm((form) => ({ ...form, category: event.target.value }))}
                                                    placeholder="Type category name"
                                                />
                                            </label>
                                        )}
                                        <label>
                                            <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Description</span>
                                            <textarea
                                                className="mt-2 min-h-24 w-full resize-y rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                value={productForm.description}
                                                onChange={(event) => setProductForm((form) => ({ ...form, description: event.target.value }))}
                                                placeholder="What this product does and who it is for."
                                            />
                                        </label>
                                        <label>
                                            <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Scope</span>
                                            <textarea
                                                className="mt-2 min-h-24 w-full resize-y rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                value={productForm.scope}
                                                onChange={(event) => setProductForm((form) => ({ ...form, scope: event.target.value }))}
                                                placeholder="Deliverables, timeline, inclusions, exclusions."
                                            />
                                        </label>
                                        <label>
                                            <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Photos</span>
                                            <input
                                                className="mt-2 block w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-[#842cff]/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#d8c8ff] hover:file:bg-[#842cff]/30"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                disabled={uploadPhotoMutation.isPending}
                                                onChange={(event) => {
                                                    Array.from(event.target.files || []).forEach((file) => uploadPhotoMutation.mutate(file));
                                                    event.target.value = "";
                                                }}
                                            />
                                            {uploadPhotoMutation.isPending && (
                                                <p className="mt-2 text-xs font-semibold text-[#9df6b7]">Uploading photo...</p>
                                            )}
                                        </label>
                                        {productForm.photoUrls.length > 0 && (
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                {productForm.photoUrls.map((url) => (
                                                    <div key={url} className="group relative overflow-hidden rounded-lg border border-white/10">
                                                        <img className="h-28 w-full object-cover" src={url} alt={productForm.title || "Product"} />
                                                        <button
                                                            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md bg-black/70 text-white/70 opacity-0 transition group-hover:opacity-100"
                                                            type="button"
                                                            aria-label="Remove photo"
                                                            onClick={() =>
                                                                setProductForm((form) => ({
                                                                    ...form,
                                                                    photoUrls: form.photoUrls.filter((photoUrl) => photoUrl !== url),
                                                                }))
                                                            }
                                                        >
                                                            <FiX className="size-4" aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        <label>
                                            <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Question</span>
                                            <input
                                                className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                value={faqForm.question}
                                                onChange={(event) => setFaqForm((form) => ({ ...form, question: event.target.value }))}
                                                placeholder="What is included in onboarding?"
                                            />
                                        </label>
                                        <label>
                                            <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Answer</span>
                                            <textarea
                                                className="mt-2 min-h-36 w-full resize-y rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                value={faqForm.answer}
                                                onChange={(event) => setFaqForm((form) => ({ ...form, answer: event.target.value }))}
                                                placeholder="Write the approved answer agents should use."
                                            />
                                        </label>
                                    </div>
                                )}
                                <div className="mt-4 grid gap-3 border-t border-white/10 pt-4">
                                    <label>
                                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Documents</span>
                                        <input
                                            className="mt-2 block w-full rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white file:mr-3 file:rounded-md file:border-0 file:bg-[#842cff]/20 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#d8c8ff] hover:file:bg-[#842cff]/30"
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,image/*"
                                            disabled={uploadDocumentMutation.isPending}
                                            onChange={(event) => {
                                                Array.from(event.target.files || []).forEach((file) => uploadDocumentMutation.mutate(file));
                                                event.target.value = "";
                                            }}
                                        />
                                        {uploadDocumentMutation.isPending && (
                                            <p className="mt-2 text-xs font-semibold text-[#9df6b7]">Uploading document...</p>
                                        )}
                                    </label>
                                    {(currentForm.documents || []).length > 0 && (
                                        <div className="grid gap-2">
                                            {(currentForm.documents || []).map((document) => (
                                                <div
                                                    key={document.url}
                                                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2"
                                                >
                                                    <button
                                                        className="flex min-w-0 items-center gap-2 text-left text-sm font-semibold text-white/70 transition hover:text-white"
                                                        type="button"
                                                        onClick={() => setPreviewDocument(document)}
                                                    >
                                                        <FiFileText className="size-4 shrink-0 text-[#9b5cff]" aria-hidden="true" />
                                                        <span className="truncate">{document.name}</span>
                                                    </button>
                                                    <button
                                                        className="flex size-7 items-center justify-center rounded-md bg-black/40 text-white/50 transition hover:text-white"
                                                        type="button"
                                                        aria-label="Remove document"
                                                        onClick={() => {
                                                            if (activeTab === "Product") {
                                                                setProductForm((form) => ({
                                                                    ...form,
                                                                    documents: (form.documents || []).filter((item) => item.url !== document.url),
                                                                }));
                                                                return;
                                                            }

                                                            setFaqForm((form) => ({
                                                                ...form,
                                                                documents: (form.documents || []).filter((item) => item.url !== document.url),
                                                            }));
                                                        }}
                                                    >
                                                        <FiX className="size-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                                <button
                                    className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
                                    type="button"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                    type="submit"
                                    disabled={isSaving}
                                >
                                    {editingId ? <FiSave className="size-4" aria-hidden="true" /> : <FiPlus className="size-4" aria-hidden="true" />}
                                    {editingId ? "Save Entry" : "Add Entry"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {previewDocument && (
                    <div className="modal-backdrop-enter fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                        <div className="modal-panel-enter flex h-[88vh] w-full max-w-[56rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40">
                            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Document Preview</p>
                                    <h3 className="mt-1 truncate text-base font-semibold text-white">{previewDocument.name}</h3>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                                        href={getFileUrl(previewDocument.url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label="Open document"
                                    >
                                        <FiExternalLink className="size-4" aria-hidden="true" />
                                    </a>
                                    <button
                                        className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
                                        type="button"
                                        onClick={() => setPreviewDocument(null)}
                                        aria-label="Close document preview"
                                    >
                                        <FiX className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                            <div className="min-h-0 flex-1 bg-black/30 p-4">
                                {previewDocument.mimeType.startsWith("image/") ? (
                                    <img
                                        className="h-full w-full rounded-lg object-contain"
                                        src={getFileUrl(previewDocument.url)}
                                        alt={previewDocument.name}
                                    />
                                ) : previewDocument.mimeType === "application/pdf" || previewDocument.mimeType.startsWith("text/") ? (
                                    <iframe
                                        className="h-full w-full rounded-lg border border-white/10 bg-white"
                                        src={getFileUrl(previewDocument.url)}
                                        title={previewDocument.name}
                                    />
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-center">
                                        <FiFileText className="size-10 text-[#9b5cff]" aria-hidden="true" />
                                        <p className="mt-3 text-sm font-semibold text-white">Preview is not available for this file type.</p>
                                        <a
                                            className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-[#842cff]/35 bg-[#842cff]/15 px-4 text-sm font-semibold text-[#d8c8ff] transition hover:bg-[#842cff]/25 hover:text-white"
                                            href={getFileUrl(previewDocument.url)}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <FiExternalLink className="size-4" aria-hidden="true" />
                                            Open Document
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {deleteTarget && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                        <div className="modal-panel-enter w-full max-w-[32rem] overflow-hidden rounded-lg border border-red-400/20 bg-[#0d1018] shadow-2xl shadow-red-950/30">
                            <div className="bg-[radial-gradient(circle_at_15%_20%,rgba(239,68,68,0.22),transparent_35%),linear-gradient(135deg,rgba(239,68,68,0.12),rgba(132,44,255,0.08))] px-5 py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-red-300/20 bg-red-500/15 text-red-100">
                                            <FiAlertTriangle className="size-5" aria-hidden="true" />
                                        </span>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-red-100/55">Delete KB Entry</p>
                                            <h3 className="mt-1 text-lg font-semibold text-white">
                                                {deleteStep === 1 ? "Are you sure you want to delete?" : "You are deleting this entry"}
                                            </h3>
                                            <p className="mt-1 text-sm text-red-50/60">
                                                {deleteStep === 1 ? "This will remove it from active knowledge base records." : "Final confirmation required before this entry is archived."}
                                            </p>
                                        </div>
                                    </div>
                                    <button className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={closeDeletePrompt} aria-label="Close delete confirmation">
                                        <FiX className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {[1, 2].map((step) => (
                                        <div key={step} className={["h-1.5 rounded-full transition", deleteStep >= step ? "bg-red-400" : "bg-white/10"].join(" ")} />
                                    ))}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Selected Entry</p>
                                    <p className="mt-2 text-sm font-semibold text-white">{deleteTarget.title || deleteTarget.question}</p>
                                    <p className="mt-1 text-xs text-white/45">{deleteTarget.entryType}</p>
                                </div>
                                <div className="mt-3 rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-3">
                                    <p className="text-sm leading-6 text-yellow-50/75">
                                        {deleteStep === 1 ? "Review this entry before continuing. You will be asked one more time." : `You are deleting ${deleteTarget.title || deleteTarget.question}.`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                                <button className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={closeDeletePrompt}>Cancel</button>
                                {deleteStep === 1 ? (
                                    <button className="h-10 rounded-lg border border-red-400/20 bg-red-400/10 px-4 text-sm font-semibold text-red-100/80 transition hover:bg-red-400/15 hover:text-red-100" type="button" onClick={() => setDeleteStep(2)}>Continue</button>
                                ) : (
                                    <button className="h-10 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-60" type="button" onClick={confirmDelete} disabled={archiveMutation.isPending}>Delete Entry</button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </AdminLayout>
    );
}
