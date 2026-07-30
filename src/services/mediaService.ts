import { apiRequest } from "../services/apiClient";

export interface MediaItem {
  id: number;
  title: string;
  description?: string;
  mediaUrl: string;
  category: string;
  uploadedBy: {
    id: number;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export type UploadMediaPayload = {
  title: string;
  description?: string;
  mediaUrl: string;
  category: string;
};

export const mediaService = {
  upload(payload: UploadMediaPayload): Promise<MediaItem> {
    return apiRequest<MediaItem>("/api/media", {
      method: "POST",
      body: payload,
    });
  },

  getAll(): Promise<MediaItem[]> {
    return apiRequest<MediaItem[]>("/api/media");
  },

  getByCategory(category: string): Promise<MediaItem[]> {
    return apiRequest<MediaItem[]>(`/api/media/category/${category}`);
  },

  delete(id: number): Promise<void> {
    return apiRequest<void>(`/api/media/${id}`, { method: "DELETE" });
  },

  count(): Promise<number> {
    return apiRequest<number>("/api/media/count");
  },
};