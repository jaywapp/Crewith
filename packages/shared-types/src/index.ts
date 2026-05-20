export type ClubRole = "owner" | "operator" | "member";
export type MemberStatus = "active" | "dormant" | "left" | "removed";
export type ClubVisibility = "public" | "private";
export type ResourceVisibility = "all_members" | "operators_only";
export type FeeIntervalType =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";
export type FeeStatus = "unpaid" | "paid" | "exempt";
export type EventResponse = "attending" | "not_attending";
export type AttendanceStatus = "present" | "late" | "absent";
export type SubscriptionTier = "under_30" | "under_100" | "under_300";
export type SubscriptionStatus = "trial" | "active" | "expired" | "suspended";

export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ClubSummary {
  clubId: string;
  name: string;
  sportType: string;
  role: ClubRole;
  memberStatus: MemberStatus;
}

export interface DashboardSummary {
  totalMemberCount: number;
  activeMemberCount: number;
  overdueMemberCount: number;
  noticeReadRate: number;
  attendanceRate: number;
  attendanceConversionRate: number;
  monthlyFeeCollectionRate: number;
}
