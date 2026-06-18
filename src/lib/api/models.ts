import type { UserRole } from "@/lib/constants/enums";

export interface Experience {
  title: string;
  company: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface Education {
  degree: string;
  school: string;
  start_date: string;
  end_date?: string;
}

export interface Project {
  name: string;
  description?: string;
  url?: string;
}

export interface Certification {
  name: string;
  issuer?: string;
  date?: string;
}

export interface CandidateProfile {
  headline?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  profile_image_url?: string | null;
  open_to_work?: boolean;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  experience?: Experience[];
  education?: Education[];
  projects?: Project[];
  certifications?: Certification[];
}

export interface ProfileUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  candidate_profile?: CandidateProfile | null;
}

export interface Company {
  id: number;
  user_id?: number;        // owner's user ID — used to connect/follow/message the company
  name: string;
  slug?: string | null;
  industry?: string;
  headquarters?: string;
  country?: string | null;
  city?: string | null;
  website?: string;
  description?: string;
  tagline?: string | null;
  size?: string | null;
  size_enum?: string | null;
  founded_year?: number;
  logo_url?: string | null;
  cover_image_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  phone?: string | null;
  is_verified?: boolean;
  is_active?: boolean;
}

export interface CompanyLocation {
  id: number;
  city: string;
  label?: string;
  country?: string;
  address?: string;
  is_remote_friendly?: boolean;
  is_primary?: boolean;
}

export interface CompanyMember {
  id: number;
  name: string;
  email: string;
  role: "owner" | "hr" | "member";
}

export interface CompanyInvitation {
  id: number;
  email: string;
  role: string;
  created_at?: string;
}