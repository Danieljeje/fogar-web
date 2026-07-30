import { apiRequest } from "./apiClient";

// ASSUMPTION: mirrors backend PrayerRequest entity. IMPORTANT: the boolean
// field is named isPrivate in PrayerRequest.java, but Lombok/Jackson's
// JavaBean getter convention strips the "is" prefix from boolean getters
// (isPrivate() -> property "private"), so the JSON key actually returned by
// the API is "private", not "isPrivate". Using "isPrivate" here would
// silently read as undefined.
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
    // Backend reads this as a raw Map<String,String>, so booleans go over
    // the wire as strings here — that's fine, it's just a map lookup on
    // the other side (see PrayerService.submitPrayer), no Jackson bean
    // binding involved for the request body.
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