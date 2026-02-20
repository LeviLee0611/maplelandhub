export type PartyStatus = "open" | "closed";
export type ApplicationStatus = "pending" | "accepted" | "rejected";

export type Profile = {
  id: string;
  nickname: string | null;
  server: string | null;
  job: string | null;
  level: number | null;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  author_id: string;
  server: string;
  purpose: string;
  hunt_area: string;
  level_min: number;
  level_max: number;
  slots_total: number;
  slots_filled: number;
  status: PartyStatus;
  bump_at: string;
  created_at: string;
  updated_at: string;
};

export type Application = {
  id: string;
  post_id: string;
  applicant_id: string;
  message: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
};
