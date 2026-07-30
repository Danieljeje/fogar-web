import { apiRequest } from "./apiClient";

export interface User {
  id: number;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  createdAt?: string;
}
export interface InviteMemberPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  role?: string;
}

export interface RegisterUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  role?: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  role?: string;
}

export interface MemberCountResponse {
  totalMembers: number;
}

export const userService = {
  /**
   * Register user after Firebase signup
   */
  register(payload: RegisterUserPayload): Promise<User> {
    return apiRequest<User>("/api/users/register", {
      method: "POST",
      body: payload,
    });
  },
  /**
 * Admin invites a new member
 */
inviteMember(payload: InviteMemberPayload): Promise<User> {
  return apiRequest<User>("/api/users/invite", {
    method: "POST",
    body: payload,
  });
},

  /**
   * Logged in user
   */
  getCurrentUser(): Promise<User> {
    return apiRequest<User>("/api/users/me");
  },

  /**
   * Admin - all users
   */
  getAllUsers(): Promise<User[]> {
    return apiRequest<User[]>("/api/users");
  },

  /**
   * Single user
   */
  getUserById(id: number): Promise<User> {
    return apiRequest<User>(`/api/users/${id}`);
  },

  /**
   * Update member
   * Requires PUT /api/users/{id}
   */
  updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
    return apiRequest<User>(`/api/users/${id}`, {
      method: "PUT",
      body: payload,
    });
  },

  /**
   * Delete member
   */
  deleteUser(id: number): Promise<void> {
    return apiRequest<void>(`/api/users/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * Dashboard member count
   */
  countMembers(): Promise<MemberCountResponse> {
    return apiRequest<MemberCountResponse>("/api/users/count");
  },

  /**
   * Departments
   * Requires GET /api/users/departments
   */
  getDepartments(): Promise<string[]> {
    return apiRequest<string[]>("/api/users/departments");
  },
};

/**
 * Compatibility exports
 * Existing components can continue using these.
 */

export const fetchMembers = async () => {
  const members = await userService.getAllUsers();

  return {
    content: members,
    totalElements: members.length,
    totalPages: 1,
  };
};

export const fetchDepartments = () => {
  return userService.getDepartments();
};

export const updateMember = (
  id: number,
  payload: UpdateUserPayload
) => {
  return userService.updateUser(id, payload);
};

export const deleteMember = (id: number) => {
  return userService.deleteUser(id);
};