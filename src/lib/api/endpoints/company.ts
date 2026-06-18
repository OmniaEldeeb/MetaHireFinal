import { api } from "../client";
import type {
  Company,
  CompanyInvitation,
  CompanyLocation,
  CompanyMember,
} from "../models";

export interface UpdateCompanyBody {
  name?: string;
  industry?: string;
  headquarters?: string;
  country?: string;
  city?: string;
  website?: string;
  description?: string;
  size_enum?: string;   // controller field name (NOT 'size')
  founded_year?: number;
  tagline?: string;
  linkedin_url?: string;
  twitter_url?: string;
  phone?: string;
}

export interface LocationBody {
  city?: string;
  label?: string;
  country?: string;
  address?: string;
  is_remote_friendly?: boolean;
  is_primary?: boolean;
}

function imageForm(field: string, file: File) {
  const fd = new FormData();
  fd.append(field, file);
  return fd;
}

export const companyApi = {
  me: () => api.get<{ company: Company }>("/me/company"),
  update: (body: UpdateCompanyBody) =>
    api.post<{ company: Company }>("/me/company", body),
  uploadLogo: (file: File) =>
    api.post<{ logo_url?: string; url?: string }>(
      "/me/company/logo",
      imageForm("logo", file),
    ),
  uploadCover: (file: File) =>
    api.post<{ cover_image_url?: string; url?: string }>(
      "/me/company/cover",
      imageForm("cover", file),
    ),

  // Locations
  // listLocations returns { locations: [...] } — extract the array
  locations: () =>
    api.get<unknown>("/me/company/locations").then((r) => {
      const obj = (r ?? {}) as Record<string, unknown>;
      return (Array.isArray(obj.locations) ? obj.locations : Array.isArray(r) ? r : []) as CompanyLocation[];
    }),
  addLocation: (body: LocationBody) =>
    api.post<CompanyLocation>("/me/company/locations", body),
  updateLocation: (id: number, body: LocationBody) =>
    api.patch<CompanyLocation>(`/me/company/locations/${id}`, body),
  deleteLocation: (id: number) =>
    api.delete<unknown>(`/me/company/locations/${id}`),

  // Members
  // listMembers returns { members: [...], pending: [...] } — extract members array
  members: () =>
    api.get<unknown>("/me/company/members").then((r) => {
      const obj = (r ?? {}) as Record<string, unknown>;
      return (Array.isArray(obj.members) ? obj.members : Array.isArray(r) ? r : []) as CompanyMember[];
    }),
  invite: (body: { email: string; role: string }) =>
    api.post<unknown>("/me/company/members/invite", body),
  updateMember: (id: number, body: { role: string }) =>
    api.patch<unknown>(`/me/company/members/${id}`, body),
  removeMember: (id: number) =>
    api.delete<unknown>(`/me/company/members/${id}`),
  leave: () => api.delete<unknown>("/me/company/members/leave"),

  // Invitations
  // listInvitations returns { invitations: [...] } — extract the array
  invitations: () =>
    api.get<unknown>("/me/company/invitations").then((r) => {
      const obj = (r ?? {}) as Record<string, unknown>;
      return (Array.isArray(obj.invitations) ? obj.invitations : Array.isArray(r) ? r : []) as CompanyInvitation[];
    }),
  cancelInvitation: (id: number) =>
    api.delete<unknown>(`/me/company/invitations/${id}`),
  acceptInvitation: (token: string) =>
    api.post<unknown>(`/me/invitations/${token}/accept`),
  declineInvitation: (token: string) =>
    api.post<unknown>(`/me/invitations/${token}/decline`),
};
