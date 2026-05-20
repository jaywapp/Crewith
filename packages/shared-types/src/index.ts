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

export interface AdminClubOverview {
  club: {
    id: string;
    name: string;
    sportType: string;
    visibility: ClubVisibility;
    subscriptionStatus: SubscriptionStatus;
    trialEndsAt: string;
  };
  dashboard: DashboardSummary;
  members: AdminMemberListItem[];
  fees: AdminFeeListItem[];
  events: AdminEventListItem[];
  notices: AdminNoticeListItem[];
  tasks: AdminTaskItem[];
}

export interface AdminMemberListItem {
  id: string;
  name: string;
  phoneNumber: string;
  role: ClubRole;
  memberStatus: MemberStatus;
  joinedAt: string;
  lastFeeStatus: FeeStatus;
  attendanceRate: number;
}

export interface AdminFeeListItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  paidCount: number;
  unpaidCount: number;
  collectionRate: number;
}

export interface AdminEventListItem {
  id: string;
  title: string;
  startsAt: string;
  locationName: string;
  attendingCount: number;
  notAttendingCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
}

export interface AdminNoticeListItem {
  id: string;
  title: string;
  visibility: ResourceVisibility;
  createdAt: string;
  readCount: number;
  unreadCount: number;
  likeCount: number;
  commentCount: number;
}

export interface AdminTaskItem {
  id: string;
  label: string;
  value: string;
  severity: "info" | "warning" | "danger";
}
