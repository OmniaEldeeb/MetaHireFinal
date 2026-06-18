import { api } from "../client";
import type { ProfileUser, CandidateProfile, Company } from "../models";

export interface UpdateProfileBody {
  name?: string;
  phone?: string;
  headline?: string;
  bio?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  open_to_work?: boolean;
  skills?: string[];
  experience?: unknown[];
  education?: unknown[];
  projects?: unknown[];
  certifications?: unknown[];
}

// Controller GET/POST /me/profile returns { user: UserAuthResource, profile: CandidateProfileResource }
// UserAuthResource only has: id, name, email, role
// CandidateProfileResource has: headline, bio, location, skills, experience, etc.
// We merge profile into user.candidate_profile so the form can read user.candidate_profile.*
function mergeProfile(raw: unknown): { user: ProfileUser } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const user = (r.user ?? {}) as Record<string, unknown>;
  const profile = (r.profile ?? {}) as Record<string, unknown>;
  return {
    user: {
      ...user,
      // Merge profile fields into candidate_profile so form reads user.candidate_profile.*
      candidate_profile: Object.keys(profile).length > 0
        ? (profile as unknown as CandidateProfile)
        : (user.candidate_profile as CandidateProfile | null | undefined),
    } as ProfileUser,
  };
}

export const profileApi = {
  me: () =>
    api.get<unknown>("/me/profile").then(mergeProfile),

  update: (body: UpdateProfileBody) =>
    api.post<unknown>("/me/profile", body).then(mergeProfile),

  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return api.post<{ profile_image_url?: string; url?: string }>(
      "/me/avatar",
      fd,
    );
  },
  // Public views (auth required)
  getUser: (id: number) => api.get<{ user: ProfileUser }>(`/users/${id}`),
  getCompany: (id: number) =>
    api.get<{ company: Company }>(`/companies/${id}`),
};
