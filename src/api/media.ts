import { api } from "../lib/api";

export type MediaAssetType = "Image" | "Video";

export type MediaAsset = {
    _id: string;
    name: string;
    url: string;
    mimeType: string;
    assetType: MediaAssetType;
    branch: string;
    size: number;
    isArchived: boolean;
    createdAt?: string;
};

export async function getMediaAssets() {
    const response = await api.get<MediaAsset[]>("/media");
    return response.data;
}

export async function uploadMediaAsset({ file, branch }: { file: File; branch: string }) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
    const response = await api.post<MediaAsset>("/media", { dataUrl, fileName: file.name, branch });
    return response.data;
}

export async function archiveMediaAsset(id: string) {
    const response = await api.patch<MediaAsset>(`/media/${id}/archive`);
    return response.data;
}
