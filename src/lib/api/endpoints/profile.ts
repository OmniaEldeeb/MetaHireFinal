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
  languages_spoken?: unknown[];
}

// GET /me/profile and POST /me/profile both return:
// { user: UserAuthResource{id,name,email,role}, profile: CandidateProfileResource{...} }
// We merge profile into user.candidate_profile so components read user.candidate_profile.*
function mergeProfile(raw: unknown): { user: ProfileUser } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const user = (r.user ?? {}) as Record<string, unknown>;
  const profile = (r.profile ?? {}) as Record<string, unknown>;
  return {
    user: {
      ...user,
      candidate_profile: Object.keys(profile).length > 0
        ? (profile as unknown as CandidateProfile)
        : (user.candidate_profile as CandidateProfile | null | undefined),
    } as ProfileUser,
  };
}

// ── Real response shapes for public profiles ──────────────────────────────────
// Confirmed from actual API responses provided:
// GET /api/users/{id} returns:
//   { user: {id,name,role,profile_url}, profile: {headline,bio,...,profile_image_url,...},
//     connection_status, stats: {connections_count,posts_count}, posts: Paginated<Post> }
// GET /api/companies/{id} returns:
//   { company: {id,name,...,logo_url,cover_image_url,locations:[...]},
//     profile_url, is_following, stats: {followers_count,active_jobs,posts_count},
//     active_jobs: [...], posts: Paginated<Post> }

export interface PublicProfileStats {
  connections_count?: number;
  posts_count?: number;
  followers_count?: number;
  active_jobs?: number;
}

export interface PublicCandidateProfile {
  user: { id: number; name: string; role: string; profile_url?: string };
  profile: CandidateProfile;
  connection_status?: string | null;
  stats?: PublicProfileStats;
  posts?: { data: unknown[]; current_page: number; last_page: number; total: number };
}

export interface PublicCompanyProfile {
  company: Company & {
    locations?: Array<{
      id: number; label?: string; country?: string; city?: string;
      address?: string; is_remote_friendly?: boolean; is_primary?: boolean;
    }>;
  };
  profile_url?: string;
  is_following?: boolean;
  stats?: PublicProfileStats;
  active_jobs?: unknown[];
  posts?: { data: unknown[]; current_page: number; last_page: number; total: number };
}

export const profileApi = {
  me: () => api.get<unknown>("/me/profile").then(mergeProfile),
  update: (body: UpdateProfileBody) => api.post<unknown>("/me/profile", body).then(mergeProfile),

  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return api.post<{ profile_image_url?: string; url?: string }>("/me/avatar", fd);
  },

  // Public profiles — typed against the actual API responses
  getUser: (id: number) => api.get<PublicCandidateProfile>(`/users/${id}`),
  getCompany: (id: number) => api.get<PublicCompanyProfile>(`/companies/${id}`),
};
