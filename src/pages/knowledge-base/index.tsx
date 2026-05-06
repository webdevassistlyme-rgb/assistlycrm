import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiChevronDown, FiExternalLink, FiFileText, FiHelpCircle, FiImage, FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import { getAuthUser } from "../../api/auth";
import {
    createKnowledgeBaseSuggestion,
    getKnowledgeBaseEntries,
    type KnowledgeBaseDocument,
    type KnowledgeBaseEntry,
    type KnowledgeBaseEntryType,
    type KnowledgeBaseSuggestionInput,
} from "../../api/knowledgeBase";
import { getProductCategories } from "../../api/productCategories";
import { backendOrigin } from "../../lib/backendUrl";
import MainLayout from "../layout";

const emptySuggestion = {
    comment: "",
    title: "",
    category: "",
    description: "",
    scope: "",
    question: "",
    answer: "",
};

function getFileUrl(url: string) {
    return url.startsWith("http") ? url : `${backendOrigin}${url}`;
}

export default function KnowledgeBase() {
    const authUser = getAuthUser();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<KnowledgeBaseEntryType>("Product");
    const [selectedEntry, setSelectedEntry] = useState<KnowledgeBaseEntry | null>(null);
    const [previewDocument, setPreviewDocument] = useState<KnowledgeBaseDocument | null>(null);
    const [suggestionForm, setSuggestionForm] = useState(emptySuggestion);
    const [isCustomSuggestionCategory, setIsCustomSuggestionCategory] = useState(false);
    const [isSuggestionCategoryDropdownOpen, setIsSuggestionCategoryDropdownOpen] = useState(false);

    const { data: entries = [], isLoading, isError } = useQuery({
        queryKey: ["knowledge-base"],
        queryFn: () => getKnowledgeBaseEntries(),
    });
    const { data: productCategories = [] } = useQuery({
        queryKey: ["product-categories"],
        queryFn: getProductCategories,
    });

    const activeEntries = useMemo(
        () => entries.filter((entry) => entry.entryType === activeTab && entry.status === "Active"),
        [activeTab, entries]
    );
    const suggestionCategorySelectValue = isCustomSuggestionCategory ? "__custom__" : suggestionForm.category;
    const suggestionCategoryLabel = isCustomSuggestionCategory
        ? "Custom category"
        : suggestionForm.category || "Suggested category";

    const submitSuggestionMutation = useMutation({
        mutationFn: createKnowledgeBaseSuggestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledge-base-suggestions"] });
            setSuggestionForm(emptySuggestion);
            setIsCustomSuggestionCategory(false);
            setIsSuggestionCategoryDropdownOpen(false);
            setSelectedEntry(null);
        },
    });

    const submitSuggestion = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedEntry) {
            return;
        }

        const employee = authUser?.userType === "employee" ? authUser.user : null;
        const suggestion: KnowledgeBaseSuggestionInput = {
            entry: selectedEntry._id,
            entryType: selectedEntry.entryType,
            comment: suggestionForm.comment,
            submittedById: employee?._id || "",
            submittedByName: employee?.name || "Employee",
            ...(selectedEntry.entryType === "Product"
                ? {
                      title: suggestionForm.title,
                      category: suggestionForm.category,
                      description: suggestionForm.description,
                      scope: suggestionForm.scope,
                  }
                : {
                      question: suggestionForm.question,
                      answer: suggestionForm.answer,
                  }),
        };

        submitSuggestionMutation.mutate(suggestion);
    };

    const openEntry = (entry: KnowledgeBaseEntry) => {
        setSelectedEntry(entry);
        setSuggestionForm(emptySuggestion);
        setIsCustomSuggestionCategory(false);
        setIsSuggestionCategoryDropdownOpen(false);
    };

    return (
        <MainLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Knowledge Base</h2>
                        <p className="mt-1 text-sm text-white/45">Review approved products and FAQ, then suggest updates for admin approval.</p>
                    </div>
                    <div className="flex gap-2">
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
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === "Product" ? "Products" : "FAQ"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-5">
                    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80">
                        <div className="flex min-h-14 items-center justify-between border-b border-white/10 px-5">
                            <h3 className="text-base font-semibold text-white">{activeTab === "Product" ? "Products" : "FAQ"}</h3>
                            <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-white/55">{activeEntries.length}</span>
                        </div>

                        <div className="content-scroll max-h-[calc(100vh-15rem)] overflow-auto">
                            {isLoading && <p className="p-5 text-sm text-white/45">Loading knowledge base...</p>}
                            {isError && <p className="p-5 text-sm text-red-200">Unable to load knowledge base.</p>}
                            {!isLoading && !isError && activeEntries.length === 0 && (
                                <p className="p-5 text-sm text-white/45">No approved entries yet.</p>
                            )}
                            {activeEntries.length > 0 && (
                                <table className="w-full min-w-[54rem] table-fixed text-left">
                                    <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0d1018] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/35">
                                        {activeTab === "Product" ? (
                                            <tr>
                                                <th className="w-[24%] px-4 py-3">Title</th>
                                                <th className="w-[16%] px-4 py-3">Category</th>
                                                <th className="w-[28%] px-4 py-3">Description</th>
                                                <th className="w-[20%] px-4 py-3">Scope</th>
                                                <th className="w-[7%] px-4 py-3">Docs</th>
                                                <th className="w-[7%] px-4 py-3 text-right">Action</th>
                                            </tr>
                                        ) : (
                                            <tr>
                                                <th className="w-[34%] px-4 py-3">Question</th>
                                                <th className="w-[50%] px-4 py-3">Answer</th>
                                                <th className="w-[8%] px-4 py-3">Docs</th>
                                                <th className="w-[8%] px-4 py-3 text-right">Action</th>
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {activeEntries.map((entry) =>
                                            activeTab === "Product" ? (
                                                <tr key={entry._id} className="text-sm transition odd:bg-white/[0.015] hover:bg-white/[0.05]">
                                                    <td className="px-4 py-4 align-top">
                                                        <div className="flex items-center gap-3">
                                                            {entry.photoUrls[0] ? (
                                                                <img className="size-11 rounded-lg object-cover" src={entry.photoUrls[0]} alt={entry.title} />
                                                            ) : (
                                                                <span className="flex size-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#9b5cff]">
                                                                    <FiImage className="size-5" aria-hidden="true" />
                                                                </span>
                                                            )}
                                                            <span className="truncate font-semibold text-white">{entry.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-white/60"><p className="line-clamp-2">{entry.category || "No category"}</p></td>
                                                    <td className="px-4 py-4 align-top text-white/60"><p className="line-clamp-2">{entry.description}</p></td>
                                                    <td className="px-4 py-4 align-top text-white/60"><p className="line-clamp-2">{entry.scope}</p></td>
                                                    <td className="px-4 py-4 align-top">
                                                        {entry.documents?.length ? (
                                                            <button className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-xs font-semibold text-white/65 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => setPreviewDocument(entry.documents[0])}>
                                                                <FiFileText className="size-3.5" aria-hidden="true" />
                                                                {entry.documents.length}
                                                            </button>
                                                        ) : (
                                                            <span className="text-white/35">0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-right">
                                                        <button className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => openEntry(entry)} aria-label="Suggest update">
                                                            <FiMessageCircle className="size-4" aria-hidden="true" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ) : (
                                                <tr key={entry._id} className="text-sm transition odd:bg-white/[0.015] hover:bg-white/[0.05]">
                                                    <td className="px-4 py-4 align-top">
                                                        <div className="flex items-start gap-3">
                                                            <FiHelpCircle className="mt-0.5 size-4 shrink-0 text-[#9b5cff]" aria-hidden="true" />
                                                            <p className="line-clamp-2 font-semibold text-white">{entry.question}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-white/60"><p className="line-clamp-3">{entry.answer}</p></td>
                                                    <td className="px-4 py-4 align-top">
                                                        {entry.documents?.length ? (
                                                            <button className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.05] px-2 py-1 text-xs font-semibold text-white/65 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => setPreviewDocument(entry.documents[0])}>
                                                                <FiFileText className="size-3.5" aria-hidden="true" />
                                                                {entry.documents.length}
                                                            </button>
                                                        ) : (
                                                            <span className="text-white/35">0</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 align-top text-right">
                                                        <button className="inline-flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => openEntry(entry)} aria-label="Suggest update">
                                                            <FiMessageCircle className="size-4" aria-hidden="true" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </div>

                {selectedEntry && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                        <form className="modal-panel-enter flex max-h-[88vh] w-full max-w-[48rem] flex-col rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40" onSubmit={submitSuggestion}>
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Suggest Update</p>
                                    <h3 className="mt-1 text-base font-semibold text-white">
                                        {selectedEntry.title || selectedEntry.question}
                                    </h3>
                                </div>
                                <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => setSelectedEntry(null)} aria-label="Close">
                                    <FiX className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="content-scroll min-h-0 flex-1 overflow-y-auto p-5">
                                {(selectedEntry.documents || []).length > 0 && (
                                    <div className="mb-4 grid gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Documents</p>
                                        {selectedEntry.documents.map((document) => (
                                            <button
                                                key={document.url}
                                                className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                                                type="button"
                                                onClick={() => setPreviewDocument(document)}
                                            >
                                                <FiFileText className="size-4 shrink-0 text-[#9b5cff]" aria-hidden="true" />
                                                <span className="truncate">{document.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="grid gap-4">
                                    <label>
                                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Comment</span>
                                        <textarea className="mt-2 min-h-24 w-full resize-y rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={suggestionForm.comment} onChange={(event) => setSuggestionForm((form) => ({ ...form, comment: event.target.value }))} placeholder="What should admin know about this entry?" />
                                    </label>
                                    {selectedEntry.entryType === "Product" ? (
                                        <>
                                            <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={suggestionForm.title} onChange={(event) => setSuggestionForm((form) => ({ ...form, title: event.target.value }))} placeholder="Suggested product name" />
                                            <div className="relative">
                                                <button
                                                    className={[
                                                        "flex h-11 w-full items-center justify-between gap-3 rounded-lg border bg-black/20 px-3 text-left text-sm font-semibold outline-none transition",
                                                        isSuggestionCategoryDropdownOpen
                                                            ? "border-[#842cff] text-white ring-2 ring-[#842cff]/20"
                                                            : "border-white/10 text-white hover:border-white/20 hover:bg-white/[0.04]",
                                                    ].join(" ")}
                                                    type="button"
                                                    onClick={() => setIsSuggestionCategoryDropdownOpen((isOpen) => !isOpen)}
                                                    aria-expanded={isSuggestionCategoryDropdownOpen}
                                                >
                                                    <span className={suggestionForm.category || isCustomSuggestionCategory ? "truncate text-white" : "truncate text-white/45"}>
                                                        {suggestionCategoryLabel}
                                                    </span>
                                                    <FiChevronDown
                                                        className={[
                                                            "size-4 shrink-0 text-white/45 transition",
                                                            isSuggestionCategoryDropdownOpen ? "rotate-180 text-white/70" : "",
                                                        ].join(" ")}
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                                {isSuggestionCategoryDropdownOpen && (
                                                    <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border border-white/10 bg-[#0d1018] py-1 shadow-2xl shadow-black/50">
                                                        <button
                                                            className={[
                                                                "flex h-10 w-full items-center px-3 text-left text-sm font-semibold transition",
                                                                !suggestionCategorySelectValue
                                                                    ? "bg-[#842cff]/25 text-white"
                                                                    : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                                                            ].join(" ")}
                                                            type="button"
                                                            onClick={() => {
                                                                setIsCustomSuggestionCategory(false);
                                                                setSuggestionForm((form) => ({ ...form, category: "" }));
                                                                setIsSuggestionCategoryDropdownOpen(false);
                                                            }}
                                                        >
                                                            Suggested category
                                                        </button>
                                                        {productCategories.map((category) => (
                                                            <button
                                                                key={category._id}
                                                                className={[
                                                                    "flex h-10 w-full items-center px-3 text-left text-sm font-semibold transition",
                                                                    !isCustomSuggestionCategory && suggestionForm.category === category.name
                                                                        ? "bg-[#842cff]/25 text-white"
                                                                        : "text-white/75 hover:bg-white/[0.06] hover:text-white",
                                                                ].join(" ")}
                                                                type="button"
                                                                onClick={() => {
                                                                    setIsCustomSuggestionCategory(false);
                                                                    setSuggestionForm((form) => ({ ...form, category: category.name }));
                                                                    setIsSuggestionCategoryDropdownOpen(false);
                                                                }}
                                                            >
                                                                {category.name}
                                                            </button>
                                                        ))}
                                                        <button
                                                            className={[
                                                                "flex h-10 w-full items-center border-t border-white/10 px-3 text-left text-sm font-semibold transition",
                                                                isCustomSuggestionCategory
                                                                    ? "bg-[#842cff]/25 text-white"
                                                                    : "text-[#d8c8ff] hover:bg-[#842cff]/15 hover:text-white",
                                                            ].join(" ")}
                                                            type="button"
                                                            onClick={() => {
                                                                setIsCustomSuggestionCategory(true);
                                                                setSuggestionForm((form) => ({ ...form, category: "" }));
                                                                setIsSuggestionCategoryDropdownOpen(false);
                                                            }}
                                                        >
                                                            Custom category
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {isCustomSuggestionCategory && (
                                                <input
                                                    className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                    value={suggestionForm.category}
                                                    onChange={(event) => setSuggestionForm((form) => ({ ...form, category: event.target.value }))}
                                                    placeholder="Type suggested category"
                                                />
                                            )}
                                            <textarea className="min-h-20 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={suggestionForm.description} onChange={(event) => setSuggestionForm((form) => ({ ...form, description: event.target.value }))} placeholder="Suggested description" />
                                            <textarea className="min-h-20 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={suggestionForm.scope} onChange={(event) => setSuggestionForm((form) => ({ ...form, scope: event.target.value }))} placeholder="Suggested scope" />
                                        </>
                                    ) : (
                                        <>
                                            <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={suggestionForm.question} onChange={(event) => setSuggestionForm((form) => ({ ...form, question: event.target.value }))} placeholder="Suggested question" />
                                            <textarea className="min-h-28 rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={suggestionForm.answer} onChange={(event) => setSuggestionForm((form) => ({ ...form, answer: event.target.value }))} placeholder="Suggested answer" />
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                                <button className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => setSelectedEntry(null)}>
                                    Cancel
                                </button>
                                <button className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60" type="submit" disabled={submitSuggestionMutation.isPending}>
                                    <FiSend className="size-4" aria-hidden="true" />
                                    Send Suggestion
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
                                    <a className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white" href={getFileUrl(previewDocument.url)} target="_blank" rel="noreferrer" aria-label="Open document">
                                        <FiExternalLink className="size-4" aria-hidden="true" />
                                    </a>
                                    <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => setPreviewDocument(null)} aria-label="Close document preview">
                                        <FiX className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                            <div className="min-h-0 flex-1 bg-black/30 p-4">
                                {previewDocument.mimeType.startsWith("image/") ? (
                                    <img className="h-full w-full rounded-lg object-contain" src={getFileUrl(previewDocument.url)} alt={previewDocument.name} />
                                ) : previewDocument.mimeType === "application/pdf" || previewDocument.mimeType.startsWith("text/") ? (
                                    <iframe className="h-full w-full rounded-lg border border-white/10 bg-white" src={getFileUrl(previewDocument.url)} title={previewDocument.name} />
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] text-center">
                                        <FiFileText className="size-10 text-[#9b5cff]" aria-hidden="true" />
                                        <p className="mt-3 text-sm font-semibold text-white">Preview is not available for this file type.</p>
                                        <a className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-[#842cff]/35 bg-[#842cff]/15 px-4 text-sm font-semibold text-[#d8c8ff] transition hover:bg-[#842cff]/25 hover:text-white" href={getFileUrl(previewDocument.url)} target="_blank" rel="noreferrer">
                                            <FiExternalLink className="size-4" aria-hidden="true" />
                                            Open Document
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </MainLayout>
    );
}
