import {
  Sparkles,
  FileText,
  Bot,
  Gauge,
  Users,
  MessagesSquare,
  ScanFace,
  AudioWaveform,
  type LucideIcon,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const STATS = [
  { value: "10k+", label: "Candidates matched" },
  { value: "500+", label: "Companies hiring" },
  { value: "3", label: "AI signals per interview" },
  { value: "<2m", label: "To a scored CV" },
];

export const PROOF_LOGOS = [
  "Northwind",
  "Cairo Labs",
  "Helios",
  "Onyx HR",
  "Delta Stack",
  "Vantage",
];

export type IconColor = "purple" | "green" | "amber" | "coral";

export interface Feature {
  icon: LucideIcon;
  color: IconColor;
  title: string;
  body: string;
}

export const FEATURES: Feature[] = [
  {
    icon: Bot,
    color: "purple",
    title: "AI job matching",
    body: "Real AI pairs candidates with roles by skills, level, and intent — not just keyword overlap.",
  },
  {
    icon: FileText,
    color: "green",
    title: "Automatic CV analysis",
    body: "Upload a CV and get an instant score with strengths, gaps, and concrete fixes.",
  },
  {
    icon: MessagesSquare,
    color: "amber",
    title: "Chatbot job posting",
    body: "Describe the role in plain language; the assistant drafts a complete posting in seconds.",
  },
  {
    icon: AudioWaveform,
    color: "purple",
    title: "Voice tone analysis",
    body: "Interview answers are read for emotion and confidence in parallel — measurable signal.",
  },
  {
    icon: ScanFace,
    color: "coral",
    title: "Facial expression read",
    body: "Webcam frames gauge engagement and composure, aggregated into the session score.",
  },
  {
    icon: Gauge,
    color: "green",
    title: "Smart auto-invite",
    body: "Set score thresholds and let MetaHire advance the strongest candidates automatically.",
  },
];

export const DEMO_POINTS = [
  "Ranked matches with a live fit score on every role",
  "CV strengths and gaps surfaced the moment you upload",
  "One pipeline from applied to hired, updated in real time",
];

export const STEPS = [
  {
    title: "Create your account",
    body: "Sign up as a candidate or a company in seconds — free to start.",
  },
  {
    title: "Build or post",
    body: "Candidates build a scored CV; companies post a role via form or chatbot.",
  },
  {
    title: "Let AI work",
    body: "Matching, CV analysis, and interview scoring run automatically.",
  },
  {
    title: "Interview & hire",
    body: "Review ranked results, invite the best, and move them to an offer.",
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: "purple" | "green" | "amber";
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "I finally got judged on how I actually answer, not just keywords in a PDF. The feedback on each answer was the best part.",
    name: "Nour Salah",
    role: "Full-stack developer",
    avatar: "purple",
  },
  {
    quote:
      "We screened 200 applicants without burning out the team. The scores matched who we'd have picked by hand — just faster.",
    name: "Sara Ahmed",
    role: "Head of Talent, Onyx HR",
    avatar: "green",
  },
  {
    quote:
      "The chatbot wrote a better job post than I would have, and the matches were sharp from day one.",
    name: "Karim Mostafa",
    role: "Engineering Manager",
    avatar: "amber",
  },
];

export interface Plan {
  name: string;
  price: string;
  cadence: string;
  desc: string;
  features: string[];
  cta: string;
  action: "candidate" | "company" | "contact";
  featured?: boolean;
}

export const PLANS: Plan[] = [
  {
    name: "Candidate",
    price: "Free",
    cadence: "forever",
    desc: "Everything you need to get hired on evidence.",
    features: [
      "AI CV builder, report & versions",
      "Unlimited applications",
      "Practice AI interviews",
      "Real-time application tracking",
    ],
    cta: "Get started free",
    action: "candidate",
  },
  {
    name: "Growth",
    price: "$149",
    cadence: "/ month",
    desc: "For teams hiring actively across a few roles.",
    features: [
      "Up to 10 active job posts",
      "AI screening on every applicant",
      "Auto-invite by score thresholds",
      "Team seats & shared pipeline",
    ],
    cta: "Start hiring",
    action: "company",
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    cadence: "talk to us",
    desc: "For high-volume hiring and custom criteria.",
    features: [
      "Unlimited posts & seats",
      "Custom evaluation criteria",
      "Priority support & onboarding",
      "Real-time at scale (Reverb)",
    ],
    cta: "Contact sales",
    action: "contact",
  },
];

export const FAQS = [
  {
    q: "How does the AI matching actually work?",
    a: "MetaHire reads skills, experience level, and intent from profiles and roles, then ranks matches by fit rather than keyword overlap. Interview scoring adds answers, voice tone, and expression on top.",
  },
  {
    q: "Is MetaHire free for candidates?",
    a: "Yes. Building and analyzing CVs, applying to roles, and taking practice interviews are free for candidates. Companies pay for active posts and screening volume.",
  },
  {
    q: "What does the chatbot job posting do?",
    a: "Describe the role conversationally and the assistant drafts a complete posting — title, requirements, skills, and screening thresholds — that you review before publishing.",
  },
  {
    q: "What about privacy and interview recordings?",
    a: "Voice and video are processed to produce scores. You control your profile and CVs, and companies only see analysis tied to roles you apply to.",
  },
  {
    q: "Does it work in Arabic?",
    a: "Interviews support English and Arabic, and the product is built right-to-left ready for Arabic from the ground up.",
  },
];

export const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
    { label: "Browse jobs", href: "/jobs" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "For employers", href: "/register/company" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "/contact" },
  ],
};

export const HERO_BADGE: { icon: LucideIcon; text: string } = {
  icon: Sparkles,
  text: "AI-powered matching is live — try it free",
};

export { Users };
