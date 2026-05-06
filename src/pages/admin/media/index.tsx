import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiAlertTriangle, FiArchive, FiExternalLink, FiFile, FiImage, FiPlayCircle, FiPlus, FiSearch, FiX } from "react-icons/fi";
import AdminLayout from "../adminLayout";
import { archiveMediaAsset, getMediaAssets, uploadMediaAsset, type MediaAsset } from "../../../api/media";
import { backendOrigin } from "../../../lib/backendUrl";

function getMediaUrl(url: string) {
    return url.startsWith("http") ? url : `${backendOrigin}${url}`;
}

function formatBytes(bytes: number) {
    if (!bytes) return "0 KB";
    const units = ["B", "KB", "MB", "GB"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function AdminMedia() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [activeType, setActiveType] = useState<"All" | "Image" | "Video">("All");
    const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
    const [pendingArchive, setPendingArchive] = useState<MediaAsset | null>(null);
    const [archiveStep, setArchiveStep] = useState<1 | 2>(1);

    const { data: assets = [], isLoading, isError } = useQuery({
        queryKey: ["media"],
        queryFn: getMediaAssets,
    });

    const uploadMutation = useMutation({
        mutationFn: uploadMediaAsset,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media"] }),
    });

    const archiveMutation = useMutation({
        mutationFn: archiveMediaAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["media"] });
            setPendingArchive(null);
            setArchiveStep(1);
        },
    });

    const filteredAssets = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return assets.filter((asset) => {
            const matchesType = activeType === "All" || asset.assetType === activeType;
            const matchesSearch = !normalizedSearch || asset.name.toLowerCase().includes(normalizedSearch);
            return matchesType && matchesSearch;
        });
    }, [activeType, assets, search]);

    const imageCount = assets.filter((asset) => asset.assetType === "Image").length;
    const videoCount = assets.filter((asset) => asset.assetType === "Video").length;
    const statCards = [
        { label: "Assets", value: assets.length.toString(), meta: "Uploaded files", icon: FiFile },
        { label: "Images", value: imageCount.toString(), meta: "Photos and graphics", icon: FiImage },
        { label: "Videos", value: videoCount.toString(), meta: "Video assets", icon: FiPlayCircle },
    ];

    return (
        <AdminLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">Media</h2>
                        <p className="mt-1 text-sm text-white/50">Upload, preview, and manage images and videos.</p>
                    </div>
                    <label className="flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-5 text-sm font-semibold text-white transition hover:brightness-110">
                        <FiPlus className="size-4" aria-hidden="true" />
                        Upload Media
                        <input
                            className="hidden"
                            type="file"
                            accept="image/*,video/mp4,video/webm,video/ogg,video/quicktime"
                            multiple
                            disabled={uploadMutation.isPending}
                            onChange={(event) => {
                                Array.from(event.target.files || []).forEach((file) => uploadMutation.mutate(file));
                                event.target.value = "";
                            }}
                        />
                    </label>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {statCards.map(({ label, value, meta, icon: Icon }) => (
                        <article key={label} className="rounded-lg border border-white/10 bg-[#0c1018]/80 p-5 shadow-2xl shadow-black/10">
                            <div className="flex items-start gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#842cff]/18 text-[#b78cff]">
                                    <Icon className="size-6" aria-hidden="true" />
                                </span>
                                <span>
                                    <span className="block text-xs font-medium text-white/75">{label}</span>
                                    <span className="mt-2 block text-xl font-semibold text-white">{value}</span>
                                    <span className="mt-1 block text-xs text-white/45">{meta}</span>
                                </span>
                            </div>
                        </article>
                    ))}
                </div>

                <section className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80 shadow-2xl shadow-black/20">
                    <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                        <div>
                            <h3 className="text-base font-semibold text-white">Media Library</h3>
                            <p className="mt-1 text-xs text-white/40">Showing {filteredAssets.length} of {assets.length} records</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="flex h-10 min-w-[16rem] items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-white/45 transition focus-within:border-[#842cff] focus-within:ring-2 focus-within:ring-[#842cff]/20">
                                <input
                                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                                    placeholder="Search media"
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                                <FiSearch className="size-4 shrink-0" aria-hidden="true" />
                            </label>
                            {(["All", "Image", "Video"] as const).map((type) => (
                                <button
                                    key={type}
                                    className={[
                                        "h-10 rounded-lg border px-3 text-sm font-semibold transition",
                                        activeType === type
                                            ? "border-[#842cff] bg-[#842cff]/20 text-white"
                                            : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white",
                                    ].join(" ")}
                                    type="button"
                                    onClick={() => setActiveType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="content-scroll max-h-[calc(100vh-26rem)] overflow-auto p-4">
                        {uploadMutation.isPending && <p className="mb-3 text-sm font-semibold text-[#9df6b7]">Uploading media...</p>}
                        {isLoading && <p className="text-sm text-white/45">Loading media...</p>}
                        {isError && <p className="text-sm text-red-200">Unable to load media.</p>}
                        {!isLoading && !isError && filteredAssets.length === 0 && (
                            <p className="rounded-lg border border-white/10 bg-white/[0.035] p-5 text-sm text-white/45">No media assets yet.</p>
                        )}
                        {filteredAssets.length > 0 && (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {filteredAssets.map((asset) => (
                                    <article key={asset._id} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.035]">
                                        <button className="block aspect-video w-full bg-black/30" type="button" onClick={() => setPreviewAsset(asset)}>
                                            {asset.assetType === "Image" ? (
                                                <img className="size-full object-cover" src={getMediaUrl(asset.url)} alt={asset.name} />
                                            ) : (
                                                <video className="size-full object-cover" src={getMediaUrl(asset.url)} muted />
                                            )}
                                        </button>
                                        <div className="p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-white">{asset.name}</p>
                                                    <p className="mt-1 text-xs text-white/40">{asset.assetType} · {formatBytes(asset.size)}</p>
                                                </div>
                                                <span className="rounded-md bg-[#842cff]/15 px-2 py-1 text-xs font-semibold text-[#d8c8ff]">{asset.assetType}</span>
                                            </div>
                                            <div className="mt-3 flex justify-end gap-2">
                                                <a className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white" href={getMediaUrl(asset.url)} target="_blank" rel="noreferrer" aria-label="Open media">
                                                    <FiExternalLink className="size-4" aria-hidden="true" />
                                                </a>
                                                <button
                                                    className="flex size-8 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-100/70 transition hover:bg-red-400/15 hover:text-red-100"
                                                    type="button"
                                                    onClick={() => {
                                                        setPendingArchive(asset);
                                                        setArchiveStep(1);
                                                    }}
                                                    aria-label="Archive media"
                                                >
                                                    <FiArchive className="size-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {previewAsset && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                        <div className="modal-panel-enter flex max-h-[88vh] w-full max-w-[60rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40">
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">{previewAsset.assetType} Preview</p>
                                    <h3 className="mt-1 truncate text-base font-semibold text-white">{previewAsset.name}</h3>
                                </div>
                                <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={() => setPreviewAsset(null)} aria-label="Close preview">
                                    <FiX className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="min-h-0 flex-1 bg-black/30 p-4">
                                {previewAsset.assetType === "Image" ? (
                                    <img className="max-h-[70vh] w-full rounded-lg object-contain" src={getMediaUrl(previewAsset.url)} alt={previewAsset.name} />
                                ) : (
                                    <video className="max-h-[70vh] w-full rounded-lg" src={getMediaUrl(previewAsset.url)} controls />
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {pendingArchive && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                        <div className="modal-panel-enter w-full max-w-[30rem] overflow-hidden rounded-lg border border-red-300/20 bg-[#101018] shadow-2xl shadow-red-950/30">
                            <div className="border-b border-red-300/15 bg-[linear-gradient(135deg,rgba(239,68,68,0.16),rgba(132,44,255,0.12))] px-5 py-4">
                                <div className="flex items-start gap-3">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-400/15 text-red-200">
                                        <FiAlertTriangle className="size-5" aria-hidden="true" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-100/55">
                                            {archiveStep === 1 ? "Confirm archive" : "Final warning"}
                                        </p>
                                        <h3 className="mt-1 text-lg font-semibold text-white">
                                            {archiveStep === 1 ? "Archive this media asset?" : "You are archiving this asset"}
                                        </h3>
                                    </div>
                                </div>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-sm leading-6 text-white/62">
                                    {archiveStep === 1
                                        ? `"${pendingArchive.name}" will be removed from the media library.`
                                        : `This will hide "${pendingArchive.name}" from admins and any future media selection lists.`}
                                </p>
                                <div className="mt-4 rounded-lg border border-white/10 bg-black/24 p-3">
                                    <p className="truncate text-sm font-semibold text-white">{pendingArchive.name}</p>
                                    <p className="mt-1 text-xs text-white/42">{pendingArchive.assetType} · {formatBytes(pendingArchive.size)}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-4">
                                <button
                                    className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                                    type="button"
                                    onClick={() => {
                                        setPendingArchive(null);
                                        setArchiveStep(1);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="h-10 rounded-lg border border-red-300/25 bg-red-500/18 px-4 text-sm font-semibold text-red-100 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-60"
                                    type="button"
                                    disabled={archiveMutation.isPending}
                                    onClick={() => {
                                        if (archiveStep === 1) {
                                            setArchiveStep(2);
                                            return;
                                        }
                                        archiveMutation.mutate(pendingArchive._id);
                                    }}
                                >
                                    {archiveStep === 1 ? "Continue" : archiveMutation.isPending ? "Archiving..." : "Archive media"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </AdminLayout>
    );
}
