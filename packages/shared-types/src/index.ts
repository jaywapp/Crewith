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
export type FeeType = "recurring" | "one_time";
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
  feeType: FeeType;
  amount: number;
  dueDate: string;
  targetCount: number;
  paidCount: number;
  unpaidCount: number;
  exemptCount: number;
  collectionRate: number;
  payments: AdminFeePaymentListItem[];
}

export interface AdminFeePaymentListItem {
  memberId: string;
  memberName: string;
  status: FeeStatus;
}

export interface AdminEventListItem {
  id: string;
  title: string;
  startsAt: string;
  locationName: string;
  locationAddress?: string;
  responseDeadline?: string;
  attendingCount: number;
  notAttendingCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
  attendanceConversionRate: number;
  participants: AdminEventParticipantListItem[];
}

export interface AdminEventParticipantListItem {
  memberId: string;
  memberName: string;
  response: EventResponse;
  attendanceStatus: AttendanceStatus;
  companionCount: number;
}

export interface AdminNoticeListItem {
  id: string;
  title: string;
  body: string;
  visibility: ResourceVisibility;
  createdAt: string;
  readCount: number;
  unreadCount: number;
  likeCount: number;
  commentCount: number;
  readers: AdminNoticeReaderListItem[];
  comments: AdminNoticeCommentListItem[];
}

export interface AdminNoticeReaderListItem {
  memberId: string;
  memberName: string;
  read: boolean;
}

export interface AdminNoticeCommentListItem {
  id: string;
  memberName: string;
  body: string;
  createdAt: string;
}

export interface AdminTaskItem {
  id: string;
  label: string;
  value: string;
  severity: "info" | "warning" | "danger";
}

export interface CreateAdminMemberInput {
  name: string;
  phoneNumber: string;
  role: ClubRole;
}

export interface UpdateAdminMemberInput {
  name?: string;
  phoneNumber?: string;
  role?: ClubRole;
  memberStatus?: MemberStatus;
  lastFeeStatus?: FeeStatus;
}

export interface CreateAdminFeeInput {
  title: string;
  feeType: FeeType;
  amount: number;
  dueDate: string;
}

export interface UpdateAdminFeePaymentInput {
  memberId: string;
  status: FeeStatus;
}

export interface CreateAdminEventInput {
  title: string;
  startsAt: string;
  locationName: string;
  locationAddress?: string;
  responseDeadline?: string;
}

export interface UpdateAdminEventResponseInput {
  memberId: string;
  response: EventResponse;
}

export interface UpdateAdminAttendanceInput {
  memberId: string;
  status: AttendanceStatus;
  companionCount?: number;
}

export interface CreateAdminNoticeInput {
  title: string;
  body: string;
  visibility: ResourceVisibility;
}

export interface UpdateAdminNoticeReadInput {
  memberId: string;
}

export interface CreateAdminNoticeCommentInput {
  memberId: string;
  body: string;
}

export interface ToggleAdminNoticeReactionInput {
  memberId: string;
}
