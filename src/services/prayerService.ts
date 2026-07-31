import { apiRequest } from "./apiClient";

export interface PrayerRequest {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  title: string;
  message: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  private: boolean;
  createdAt: string;
  moderatedAt?: string;
}

export type SubmitPrayerPayload = {
  title: string;
  message: string;
  isPrivate: boolean;
};

export const prayerService = {
  submitPrayer(payload: SubmitPrayerPayload): Promise<PrayerRequest> {

    return apiRequest<PrayerRequest>("/api/prayers", {
      method: "POST",
      body: {
        title: payload.title,
        message: payload.message,
        isPrivate: String(payload.isPrivate),
      },
    });
  },

  getAllForModeration(): Promise<PrayerRequest[]> {
    return apiRequest<PrayerRequest[]>("/api/prayers");
  },

  getPublicWall(): Promise<PrayerRequest[]> {
    return apiRequest<PrayerRequest[]>("/api/prayers/wall");
  },

  getMyPrayers(): Promise<PrayerRequest[]> {
    return apiRequest<PrayerRequest[]>("/api/prayers/mine");
  },

  approve(id: number): Promise<PrayerRequest> {
    return apiRequest<PrayerRequest>(`/api/prayers/${id}/approve`, { method: "PUT" });
  },

  reject(id: number): Promise<PrayerRequest> {
    return apiRequest<PrayerRequest>(`/api/prayers/${id}/reject`, { method: "PUT" });
  },

  getPendingCount(): Promise<number> {
    return apiRequest<number>("/api/prayers/pending-count");
  },
};