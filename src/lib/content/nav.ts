import {
  LayoutDashboard,
  UserRound,
  Briefcase,
  Bookmark,
  FileText,
  Newspaper,
  
  Headphones,
  Files,
  Mic,
  Users,
  MessageSquare,
  FilePlus,
  Inbox,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  stage?: string;
}

export const CANDIDATE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Profile", href: "/profile", icon: UserRound },
  { label: "Browse jobs", href: "/jobs", icon: Briefcase },
  { label: "Applications", href: "/applications", icon: FileText },
  { label: "Saved jobs", href: "/saved-jobs", icon: Bookmark },
  { label: "My CVs", href: "/cv", icon: Files },
  { label: "Interviews", href: "/interviews", icon: Mic },
  { label: "Feed", href: "/feed", icon: Newspaper },
  { label: "Network", href: "/network", icon: Users },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Support", href: "/support", icon: Headphones },
];

export const COMPANY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Company profile", href: "/profile", icon: UserRound },
  { label: "Jobs", href: "/company/jobs", icon: Briefcase },
  { label: "Post a job", href: "/company/jobs/new", icon: FilePlus },
  { label: "Applicants", href: "/company/applications", icon: Inbox },
  { label: "Feed", href: "/feed", icon: Newspaper },
  { label: "Network", href: "/network", icon: Users },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Support", href: "/support", icon: Headphones },
];
