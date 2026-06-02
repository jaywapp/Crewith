import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import {
  type AcceptInviteInput,
  type AdminEventListItem,
  type AdminFeeListItem,
  type AdminInviteLinkListItem,
  type AdminJoinRequestListItem,
  type AdminMemberListItem,
  type AdminNoticeListItem,
  type AdminNotificationLogItem,
  type CreateAdminEventInput,
  type CreateAdminFeeInput,
  type CreateAdminMemberInput,
  type CreateAdminNoticeInput,
  type CreateAdminNoticeCommentInput,
  type CreateClubInput,
  type CreateFeedbackInput,
  type CreateInviteLinkInput,
  type CreateJoinRequestInput,
  type FeedbackResult,
  type FeePaymentStatus,
  type ImportAdminMembersInput,
  type ImportAdminMembersResult,
  type MemberDirectoryItem,
  type MemberNotificationItem,
  type RegisterDeviceInput,
  type RegisterInput,
  type ResetMemberPasswordInput,
  type ReviewJoinRequestInput,
  type SelfResetPasswordInput,
  type SendReminderInput,
  type ToggleAdminNoticeReactionInput,
  type UpdateAdminAttendanceInput,
  type UpdateAdminEventInput,
  type UpdateAdminEventResponseInput,
  type UpdateAdminFeePaymentInput,
  type UpdateAdminMemberInput,
  type UpdateAdminNoticeInput,
  type UpdateAdminNoticeReadInput,
  type UpdateClubFeeSettingsInput,
  type UpdateClubNotificationSettingsInput,
  type UpdateClubPrivacySettingsInput,
  type UpdateMemberProfileInput,
  type AuthLoginInput,
  type buildOverview,
  type buildProfile,
  type buildMemberAppOverview,
  type buildReminderTargets,
  type ensureFeeSettings,
  type ensureNotificationSettings,
  type ensurePrivacySettings,
  type registerMemberDevice,
} from "./mvp.store";
import { MvpRepository } from "./mvp.repository";

// 전화번호 정규화 (현재 store와 동일한 로직)
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("82")) return `0${digits.slice(2)}`;
  return digits;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function toAdminMember(
  user: {
    id: string;
    name: string | null;
    phoneNumber: string;
    birthDate: Date | null;
    gender: string | null;
    passwordHash: string;
  },
  membership: {
    role: string;
    memberStatus: string;
    joinedAt: Date;
    leftAt: Date | null;
    personalDataDeleteAt: Date | null;
    lastFeeStatus: string;
  },
  attendanceRate = 0,
): AdminMemberListItem {
  return {
    id: user.id,
    name: user.name ?? "",
    phoneNumber: user.phoneNumber,
    birthDate: user.birthDate?.toISOString().slice(0, 10),
    gender: user.gender ?? undefined,
    role: membership.role as any,
    memberStatus: membership.memberStatus as any,
    joinedAt: membership.joinedAt.toISOString().slice(0, 10),
    leftAt: membership.leftAt?.toISOString().slice(0, 10),
    personalDataDeleteAt: membership.personalDataDeleteAt?.toISOString().slice(0, 10),
    lastFeeStatus: membership.lastFeeStatus as any,
    attendanceRate,
    password: user.passwordHash,
  };
}

function toAdminFee(
  fee: {
    id: string;
    title: string;
    feeType: string;
    amount: number;
    dueDate: Date;
    payments: Array<{
      status: string;
      clubMember: { user: { id: string; name: string | null } };
    }>;
  },
  allMemberIds: string[],
): AdminFeeListItem {
  const payments = allMemberIds.map((mid) => {
    const p = fee.payments.find((fp) => fp.clubMember.user.id === mid);
    return {
      memberId: mid,
      memberName: p?.clubMember.user.name ?? "",
      status: (p?.status ?? "unpaid") as FeePaymentStatus,
    };
  });

  const paidCount = payments.filter((p) => p.status === "paid").length;
  const exemptCount = payments.filter((p) => p.status === "exempt").length;
  const unpaidCount = payments.filter((p) => p.status === "unpaid").length;
  const targetCount = payments.length;

  return {
    id: fee.id,
    title: fee.title,
    feeType: fee.feeType as any,
    amount: fee.amount,
    dueDate: fee.dueDate.toISOString().slice(0, 10),
    targetCount,
    paidCount,
    unpaidCount,
    exemptCount,
    collectionRate:
      targetCount > 0 ? Math.round((paidCount / targetCount) * 100) : 0,
    payments,
  };
}

function toAdminEvent(event: {
  id: string;
  title: string;
  startsAt: Date;
  locationName: string | null;
  locationAddress: string | null;
  responseDeadline: Date | null;
  visibility: string;
  responses: Array<{
    response: string;
    clubMember: { userId: string; user: { name: string | null } };
  }>;
  attendance: Array<{
    status: string;
    companionCount: number;
    clubMember: { userId: string; user: { name: string | null } };
  }>;
}): AdminEventListItem {
  const attendingCount = event.responses.filter(
    (r) => r.response === "attending",
  ).length;
  const notAttendingCount = event.responses.filter(
    (r) => r.response === "not_attending",
  ).length;
  const presentCount = event.attendance.filter(
    (a) => a.status === "present",
  ).length;
  const lateCount = event.attendance.filter((a) => a.status === "late").length;
  const absentCount = event.attendance.filter(
    (a) => a.status === "absent",
  ).length;
  const totalAttendance = presentCount + lateCount + absentCount;

  return {
    id: event.id,
    title: event.title,
    startsAt: event.startsAt.toISOString(),
    locationName: event.locationName ?? "",
    locationAddress: event.locationAddress ?? undefined,
    responseDeadline: event.responseDeadline?.toISOString(),
    visibility: event.visibility as any,
    attendingCount,
    notAttendingCount,
    presentCount,
    lateCount,
    absentCount,
    attendanceRate:
      totalAttendance > 0
        ? Math.round(((presentCount + lateCount) / totalAttendance) * 100)
        : 0,
    attendanceConversionRate:
      attendingCount > 0
        ? Math.round(
            ((presentCount + lateCount) / attendingCount) * 100,
          )
        : 0,
    participants: event.responses.map((r) => {
      const att = event.attendance.find(
        (a) => a.clubMember.userId === r.clubMember.userId,
      );
      return {
        memberId: r.clubMember.userId,
        memberName: r.clubMember.user.name ?? "",
        response: r.response as any,
        attendanceStatus: (att?.status ?? "absent") as any,
        companionCount: att?.companionCount ?? 0,
      };
    }),
  };
}

const EVENT_INCLUDE = {
  responses: { include: { clubMember: { include: { user: true } } } },
  attendance: { include: { clubMember: { include: { user: true } } } },
} as const;

const NOTICE_INCLUDE = {
  reads: { include: { clubMember: { include: { user: true } } } },
  comments: {
    where: { deletedAt: null },
    include: { clubMember: { include: { user: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  reactions: true,
  _count: { select: { reads: true, reactions: true, comments: true } },
} as const;

function toAdminNotice(notice: any, allMemberIds: string[]): AdminNoticeListItem {
  return {
    id: notice.id,
    title: notice.title,
    body: notice.body,
    visibility: notice.visibility,
    createdAt: notice.createdAt.toISOString(),
    readCount: notice._count.reads,
    unreadCount: allMemberIds.length - notice._count.reads,
    likeCount: notice._count.reactions,
    commentCount: notice._count.comments,
    readers: allMemberIds.map((mid) => ({
      memberId: mid,
      memberName:
        notice.reads.find((r: any) => r.clubMember.userId === mid)?.clubMember
          .user.name ?? "",
      read: notice.reads.some((r: any) => r.clubMember.userId === mid),
    })),
    comments: notice.comments.map((c: any) => ({
      id: c.id,
      memberName: c.clubMember.user.name ?? "",
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

// ─── Repository ─────────────────────────────────────────────────────────────

@Injectable()
export class PrismaRepository extends MvpRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // ── TASK 3: 인증 메서드 ────────────────────────────────────────────────────

  async login(input: AuthLoginInput) {
    const phone = normalizePhone(input.phoneNumber ?? "");
    const password = `${input.password ?? ""}`.trim();

    const user = await this.prisma.user.findFirst({
      where: { phoneNumber: phone, status: { not: "removed" } },
      include: {
        memberships: {
          where: { memberStatus: { not: "removed" } },
          include: { club: true },
        },
      },
    });

    if (!user || user.passwordHash !== password) {
      throw new BadRequestException(
        "전화번호 또는 비밀번호가 올바르지 않습니다.",
      );
    }

    return {
      memberId: user.id,
      profile: {
        memberId: user.id,
        name: user.name ?? "",
        phoneNumber: user.phoneNumber,
        profileImageUrl: user.profileImageUrl ?? undefined,
      },
      clubs: user.memberships.map((m) => ({
        clubId: m.clubId,
        name: m.club.name,
        sportType: m.club.sportType,
        role: m.role,
        memberStatus: m.memberStatus,
      })),
    };
  }

  async register(input: RegisterInput) {
    const phone = normalizePhone(input.phoneNumber ?? "");
    const name = `${input.name ?? ""}`.trim();
    const password = `${input.password ?? ""}`.trim();

    if (!name || !phone || !password) {
      throw new BadRequestException("이름, 전화번호, 비밀번호를 입력하세요.");
    }

    const existing = await this.prisma.user.findFirst({
      where: { phoneNumber: phone, status: { not: "removed" } },
    });

    if (existing) {
      throw new ConflictException("이미 사용 중인 전화번호입니다.");
    }

    const user = await this.prisma.user.create({
      data: {
        phoneNumber: phone,
        name,
        passwordHash: password,
        birthDate: input.birthDate ? new Date(input.birthDate) : null,
        gender: input.gender?.trim() || null,
      },
    });

    return { memberId: user.id };
  }

  async createClub(input: CreateClubInput) {
    const name = `${input.name ?? ""}`.trim();
    const sportType = `${input.sportType ?? ""}`.trim();

    if (!name || !sportType) {
      throw new BadRequestException("모임명과 종목을 입력하세요.");
    }

    const owner = await this.prisma.user.findUnique({
      where: { id: input.ownerMemberId },
    });

    if (!owner) {
      throw new NotFoundException("회원을 찾을 수 없습니다.");
    }

    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const club = await this.prisma.club.create({
      data: {
        name,
        sportType,
        visibility: "private",
        ownerUserId: owner.id,
        trialStartedAt: new Date(),
        trialEndsAt,
        subscriptionStatus: "trial",
        members: {
          create: {
            userId: owner.id,
            role: "owner",
            memberStatus: "active",
            lastFeeStatus: "unpaid",
          },
        },
      },
    });

    return { clubId: club.id, name: club.name, sportType: club.sportType };
  }

  async resetMemberPassword(memberId: string, input: ResetMemberPasswordInput) {
    const newPassword = `${input.password ?? ""}`.trim();
    if (!newPassword) throw new BadRequestException("비밀번호를 입력하세요.");

    await this.prisma.user.update({
      where: { id: memberId },
      data: { passwordHash: newPassword },
    });

    return { memberId };
  }

  async selfResetPassword(input: SelfResetPasswordInput): Promise<{ success: true }> {
    const phone = normalizePhone(input.phoneNumber ?? "");
    const user = await this.prisma.user.findFirst({
      where: { phoneNumber: phone, status: { not: "removed" } },
    });

    if (!user) throw new NotFoundException("등록되지 않은 전화번호입니다.");

    const digits = user.phoneNumber.replace(/\D/g, "");
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: digits.slice(-4) },
    });

    return { success: true };
  }

  // ── TASK 4: 회원 CRUD ──────────────────────────────────────────────────────

  async getMembers(clubId: string): Promise<AdminMemberListItem[]> {
    const memberships = await this.prisma.clubMember.findMany({
      where: { clubId, memberStatus: { not: "removed" } },
      include: { user: true, eventAttendance: true },
      orderBy: { joinedAt: "asc" },
    });

    return memberships.map((m) => {
      const attendedCount = m.eventAttendance.filter(
        (a) => a.status === "present" || a.status === "late",
      ).length;
      const rate =
        m.eventAttendance.length > 0
          ? Math.round((attendedCount / m.eventAttendance.length) * 100)
          : 0;
      return toAdminMember(m.user, m, rate);
    });
  }

  async createMember(
    clubId: string,
    input: CreateAdminMemberInput,
  ): Promise<AdminMemberListItem> {
    const phone = normalizePhone(input.phoneNumber.trim());
    const phoneDigits = phone.replace(/\D/g, "");

    let user = await this.prisma.user.findFirst({
      where: { phoneNumber: phone, status: { not: "removed" } },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phoneNumber: phone,
          name: input.name.trim(),
          passwordHash:
            input.password?.trim() || phoneDigits.slice(-4),
        },
      });
    }

    const role = (
      ["owner", "operator", "member"].includes(input.role ?? "")
        ? input.role
        : "member"
    ) as any;

    const membership = await this.prisma.clubMember.create({
      data: {
        clubId,
        userId: user.id,
        role,
        memberStatus: "active",
        lastFeeStatus: "unpaid",
      },
      include: { user: true },
    });

    return toAdminMember(membership.user, membership);
  }

  async updateMember(
    clubId: string,
    memberId: string,
    input: UpdateAdminMemberInput,
  ): Promise<AdminMemberListItem> {
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: memberId },
      include: { user: true },
    });

    if (!membership) throw new NotFoundException("회원을 찾을 수 없습니다.");

    const userUpdate: any = {};
    if (input.name?.trim()) userUpdate.name = input.name.trim();
    if (input.phoneNumber?.trim())
      userUpdate.phoneNumber = normalizePhone(input.phoneNumber);
    if (input.password?.trim()) userUpdate.passwordHash = input.password.trim();

    const memberUpdate: any = {};
    if (["owner", "operator", "member"].includes(input.role ?? ""))
      memberUpdate.role = input.role;
    if (
      ["active", "dormant", "left", "removed"].includes(
        input.memberStatus ?? "",
      )
    ) {
      memberUpdate.memberStatus = input.memberStatus;
      if (
        input.memberStatus === "left" ||
        input.memberStatus === "removed"
      ) {
        memberUpdate.leftAt = new Date();
      }
    }
    if (["unpaid", "paid", "exempt"].includes(input.lastFeeStatus ?? "")) {
      memberUpdate.lastFeeStatus = input.lastFeeStatus;
    }

    if (Object.keys(userUpdate).length > 0) {
      await this.prisma.user.update({
        where: { id: memberId },
        data: userUpdate,
      });
    }

    const updated = await this.prisma.clubMember.update({
      where: { id: membership.id },
      data: memberUpdate,
      include: { user: true },
    });

    return toAdminMember(updated.user, updated);
  }

  async removeMember(
    clubId: string,
    memberId: string,
  ): Promise<AdminMemberListItem> {
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: memberId },
      include: { user: true },
    });

    if (!membership) throw new NotFoundException("회원을 찾을 수 없습니다.");

    const updated = await this.prisma.clubMember.update({
      where: { id: membership.id },
      data: { memberStatus: "removed", leftAt: new Date() },
      include: { user: true },
    });

    return toAdminMember(updated.user, updated);
  }

  async updateMemberFeeStatus(
    clubId: string,
    memberId: string,
    status: FeePaymentStatus,
  ): Promise<AdminMemberListItem> {
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: memberId },
      include: { user: true },
    });

    if (!membership) throw new NotFoundException("회원을 찾을 수 없습니다.");

    const updated = await this.prisma.clubMember.update({
      where: { id: membership.id },
      data: { lastFeeStatus: status },
      include: { user: true },
    });

    return toAdminMember(updated.user, updated);
  }

  async importMembers(
    clubId: string,
    input: ImportAdminMembersInput,
  ): Promise<ImportAdminMembersResult> {
    const errors: ImportAdminMembersResult["errors"] = [];
    const importedMembers: AdminMemberListItem[] = [];

    const rows = `${input.rows ?? ""}`
      .split(/\r?\n/)
      .map((r) => r.trim())
      .filter(Boolean);

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 1;
      const [name, phoneNumber, roleValue, passwordValue] = row
        .split(/\t|,/)
        .map((c) => c.trim());

      if (!name || !phoneNumber) {
        errors.push({
          row: rowNumber,
          reason: "Name and phone number are required",
          value: row,
        });
        continue;
      }

      const phone = normalizePhone(phoneNumber);
      const existingMember = await this.prisma.clubMember.findFirst({
        where: {
          clubId,
          user: { phoneNumber: phone, status: { not: "removed" } },
          memberStatus: { not: "removed" },
        },
      });

      if (existingMember) {
        errors.push({
          row: rowNumber,
          reason: "Duplicate phone number",
          value: row,
        });
        continue;
      }

      const role = ["owner", "operator", "member"].includes(roleValue ?? "")
        ? roleValue
        : "member";
      const member = await this.createMember(clubId, {
        name,
        phoneNumber: phone,
        role: role as any,
        password: passwordValue?.trim() || undefined,
      });
      importedMembers.push(member);
    }

    return {
      createdCount: importedMembers.length,
      skippedCount: errors.length,
      errors,
      members: importedMembers,
    };
  }

  // ── TASK 5: 회비 메서드 ────────────────────────────────────────────────────

  async getFees(clubId: string): Promise<AdminFeeListItem[]> {
    const activeMembers = await this.prisma.clubMember.findMany({
      where: { clubId, memberStatus: { not: "removed" } },
      select: { userId: true },
    });
    const memberIds = activeMembers.map((m) => m.userId);

    const fees = await this.prisma.feeItem.findMany({
      where: { clubId },
      include: {
        payments: { include: { clubMember: { include: { user: true } } } },
      },
      orderBy: { dueDate: "desc" },
    });

    return fees.map((fee) => toAdminFee(fee, memberIds));
  }

  async createFee(
    clubId: string,
    input: CreateAdminFeeInput,
  ): Promise<AdminFeeListItem> {
    const activeMembers = await this.prisma.clubMember.findMany({
      where: { clubId, memberStatus: { not: "removed" } },
    });

    const ownerMember = await this.prisma.clubMember.findFirst({
      where: { clubId, role: "owner" },
    });

    const fee = await this.prisma.feeItem.create({
      data: {
        clubId,
        title: input.title.trim(),
        feeType: (["recurring", "one_time"].includes(input.feeType ?? "")
          ? input.feeType
          : "one_time") as any,
        amount: Number(input.amount) || 0,
        dueDate: new Date(input.dueDate),
        visibility: "all_members",
        createdBy:
          ownerMember?.userId ??
          activeMembers[0]?.userId ??
          clubId,
        payments: {
          create: activeMembers.map((m) => ({
            clubMemberId: m.id,
            status: "unpaid" as const,
          })),
        },
      },
      include: {
        payments: { include: { clubMember: { include: { user: true } } } },
      },
    });

    return toAdminFee(fee, activeMembers.map((m) => m.userId));
  }

  async updateFeePayment(
    clubId: string,
    feeId: string,
    input: UpdateAdminFeePaymentInput,
  ): Promise<AdminFeeListItem> {
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: input.memberId },
    });

    if (!membership) throw new NotFoundException("회원을 찾을 수 없습니다.");

    await this.prisma.feePayment.upsert({
      where: {
        feeItemId_clubMemberId: {
          feeItemId: feeId,
          clubMemberId: membership.id,
        },
      },
      update: {
        status: input.status as any,
        paidAt: input.status === "paid" ? new Date() : null,
      },
      create: {
        feeItemId: feeId,
        clubMemberId: membership.id,
        status: input.status as any,
      },
    });

    const activeMembers = await this.prisma.clubMember.findMany({
      where: { clubId, memberStatus: { not: "removed" } },
      select: { userId: true },
    });

    const fee = await this.prisma.feeItem.findUniqueOrThrow({
      where: { id: feeId },
      include: {
        payments: { include: { clubMember: { include: { user: true } } } },
      },
    });

    return toAdminFee(fee, activeMembers.map((m) => m.userId));
  }

  // ── TASK 6: 일정 메서드 ────────────────────────────────────────────────────

  async getEvents(clubId: string): Promise<AdminEventListItem[]> {
    const events = await this.prisma.event.findMany({
      where: { clubId },
      include: EVENT_INCLUDE,
      orderBy: { startsAt: "desc" },
    });
    return events.map(toAdminEvent);
  }

  async createEvent(
    clubId: string,
    input: CreateAdminEventInput,
  ): Promise<AdminEventListItem> {
    const ownerMember = await this.prisma.clubMember.findFirst({
      where: { clubId, role: "owner" },
    });

    const event = await this.prisma.event.create({
      data: {
        clubId,
        title: input.title.trim(),
        startsAt: new Date(input.startsAt),
        locationName: input.locationName?.trim() || null,
        locationAddress: input.locationAddress?.trim() || null,
        responseDeadline: input.responseDeadline
          ? new Date(input.responseDeadline)
          : null,
        visibility: (input.visibility ?? "all_members") as any,
        createdBy: ownerMember?.userId ?? clubId,
      },
      include: EVENT_INCLUDE,
    });

    return toAdminEvent(event);
  }

  async updateEvent(
    clubId: string,
    eventId: string,
    input: UpdateAdminEventInput,
  ): Promise<AdminEventListItem> {
    const event = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(input.title && { title: input.title.trim() }),
        ...(input.startsAt && { startsAt: new Date(input.startsAt) }),
        ...(input.locationName !== undefined && {
          locationName: input.locationName?.trim() || null,
        }),
        ...(input.locationAddress !== undefined && {
          locationAddress: input.locationAddress?.trim() || null,
        }),
        ...(input.responseDeadline !== undefined && {
          responseDeadline: input.responseDeadline
            ? new Date(input.responseDeadline)
            : null,
        }),
        ...(input.visibility && { visibility: input.visibility as any }),
      },
      include: EVENT_INCLUDE,
    });

    return toAdminEvent(event);
  }

  async deleteEvent(
    clubId: string,
    eventId: string,
  ): Promise<{ id: string; deleted: true }> {
    await this.prisma.event.delete({ where: { id: eventId } });
    return { id: eventId, deleted: true };
  }

  async updateEventResponse(
    clubId: string,
    eventId: string,
    input: UpdateAdminEventResponseInput,
  ): Promise<AdminEventListItem> {
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: input.memberId },
    });
    if (!membership) throw new NotFoundException("회원을 찾을 수 없습니다.");

    await this.prisma.eventResponse.upsert({
      where: {
        eventId_clubMemberId: {
          eventId,
          clubMemberId: membership.id,
        },
      },
      update: { response: input.response as any },
      create: {
        eventId,
        clubMemberId: membership.id,
        response: input.response as any,
      },
    });

    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      include: EVENT_INCLUDE,
    });
    return toAdminEvent(event);
  }

  async updateEventAttendance(
    clubId: string,
    eventId: string,
    input: UpdateAdminAttendanceInput,
  ): Promise<AdminEventListItem> {
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: input.memberId },
    });
    if (!membership) throw new NotFoundException("회원을 찾을 수 없습니다.");

    await this.prisma.eventAttendance.upsert({
      where: {
        eventId_clubMemberId: {
          eventId,
          clubMemberId: membership.id,
        },
      },
      update: {
        status: input.status as any,
        companionCount: input.companionCount ?? 0,
      },
      create: {
        eventId,
        clubMemberId: membership.id,
        status: input.status as any,
        companionCount: input.companionCount ?? 0,
      },
    });

    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      include: EVENT_INCLUDE,
    });
    return toAdminEvent(event);
  }

  // ── TASK 7: 공지 메서드 ────────────────────────────────────────────────────

  async getNotices(clubId: string): Promise<AdminNoticeListItem[]> {
    const activeMembers = await this.prisma.clubMember.findMany({
      where: { clubId, memberStatus: { not: "removed" } },
      select: { userId: true },
    });
    const memberIds = activeMembers.map((m) => m.userId);

    const notices = await this.prisma.notice.findMany({
      where: { clubId, deletedAt: null },
      include: NOTICE_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return notices.map((n) => toAdminNotice(n, memberIds));
  }

  async createNotice(
    clubId: string,
    input: CreateAdminNoticeInput,
  ): Promise<AdminNoticeListItem> {
    const ownerMember = await this.prisma.clubMember.findFirst({
      where: { clubId, role: "owner" },
    });

    const notice = await this.prisma.notice.create({
      data: {
        clubId,
        title: input.title.trim(),
        body: input.body.trim(),
        visibility: (input.visibility ?? "all_members") as any,
        createdBy: ownerMember?.userId ?? clubId,
      },
      include: NOTICE_INCLUDE,
    });

    const activeMembers = await this.prisma.clubMember.findMany({
      where: { clubId, memberStatus: { not: "removed" } },
      select: { userId: true },
    });

    return toAdminNotice(notice, activeMembers.map((m) => m.userId));
  }

  async updateNotice(
    clubId: string,
    noticeId: string,
    input: UpdateAdminNoticeInput,
  ): Promise<AdminNoticeListItem> {
    const notice = await this.prisma.notice.update({
      where: { id: noticeId },
      data: {
        ...(input.title && { title: input.title.trim() }),
        ...(input.body && { body: input.body.trim() }),
        ...(input.visibility && { visibility: input.visibility as any }),
      },
      include: NOTICE_INCLUDE,
    });

    const activeMembers = await this.prisma.clubMember.findMany({
      where: { clubId, memberStatus: { not: "removed" } },
      select: { userId: true },
    });

    return toAdminNotice(notice, activeMembers.map((m) => m.userId));
  }

  async deleteNotice(
    clubId: string,
    noticeId: string,
  ): Promise<{ id: string; deleted: true }> {
    await this.prisma.notice.update({
      where: { id: noticeId },
      data: { deletedAt: new Date() },
    });
    return { id: noticeId, deleted: true };
  }

  async markNoticeRead(
    clubId: string,
    noticeId: string,
    input: UpdateAdminNoticeReadInput,
  ): Promise<AdminNoticeListItem> {
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: input.memberId },
    });
    if (!membership) throw new NotFoundException("회원을 찾을 수 없습니다.");

    await this.prisma.noticeRead.upsert({
      where: {
        noticeId_clubMemberId: {
          noticeId,
          clubMemberId: membership.id,
        },
      },
      update: {},
      create: { noticeId, clubMemberId: membership.id },
    });

    const [notice, activeMembers] = await Promise.all([
      this.prisma.notice.findUniqueOrThrow({
        where: { id: noticeId },
        include: NOTICE_INCLUDE,
      }),
      this.prisma.clubMember.findMany({
        where: { clubId, memberStatus: { not: "removed" } },
        select: { userId: true },
      }),
    ]);

    return toAdminNotice(notice, activeMembers.map((m) => m.userId));
  }

  async toggleNoticeReaction(
    clubId: string,
    noticeId: string,
    input: ToggleAdminNoticeReactionInput,
  ): Promise<AdminNoticeListItem> {
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: input.memberId },
    });
    if (!membership) throw new NotFoundException("회원을 찾을 수 없습니다.");

    const existing = await this.prisma.noticeReaction.findUnique({
      where: {
        noticeId_clubMemberId_reactionType: {
          noticeId,
          clubMemberId: membership.id,
          reactionType: "like",
        },
      },
    });

    if (existing) {
      await this.prisma.noticeReaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.noticeReaction.create({
        data: {
          noticeId,
          clubMemberId: membership.id,
          reactionType: "like",
        },
      });
    }

    const [notice, activeMembers] = await Promise.all([
      this.prisma.notice.findUniqueOrThrow({
        where: { id: noticeId },
        include: NOTICE_INCLUDE,
      }),
      this.prisma.clubMember.findMany({
        where: { clubId, memberStatus: { not: "removed" } },
        select: { userId: true },
      }),
    ]);

    return toAdminNotice(notice, activeMembers.map((m) => m.userId));
  }

  async createNoticeComment(
    clubId: string,
    noticeId: string,
    input: CreateAdminNoticeCommentInput,
  ): Promise<AdminNoticeListItem> {
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: input.memberId },
    });
    if (!membership) throw new NotFoundException("회원을 찾을 수 없습니다.");

    await this.prisma.noticeComment.create({
      data: {
        noticeId,
        clubMemberId: membership.id,
        body: input.body.trim(),
      },
    });

    const [notice, activeMembers] = await Promise.all([
      this.prisma.notice.findUniqueOrThrow({
        where: { id: noticeId },
        include: NOTICE_INCLUDE,
      }),
      this.prisma.clubMember.findMany({
        where: { clubId, memberStatus: { not: "removed" } },
        select: { userId: true },
      }),
    ]);

    return toAdminNotice(notice, activeMembers.map((m) => m.userId));
  }

  // ── TASK 8: 설정 메서드 ────────────────────────────────────────────────────

  async getFeeSettings(clubId: string) {
    const settings = await this.prisma.clubFeeSetting.findUnique({
      where: { clubId },
    });

    return {
      clubId,
      amount: settings?.amount ?? 0,
      dueDay: settings?.dueDay ?? 1,
      intervalType: (settings?.intervalType ?? "monthly") as any,
      customIntervalDays:
        (settings?.customIntervalDays as number | undefined) ?? undefined,
      gracePeriodDays: settings?.gracePeriodDays ?? 0,
      autoReminderEnabled: settings?.autoReminderEnabled ?? false,
      reminderDaysAfterDue: (settings?.reminderRule as any)?.days ?? [],
    };
  }

  async updateFeeSettings(
    clubId: string,
    input: UpdateClubFeeSettingsInput,
  ) {
    const current = await this.getFeeSettings(clubId);

    const next = {
      amount:
        Number.isFinite(Number(input.amount)) && Number(input.amount) >= 0
          ? Number(input.amount)
          : current.amount,
      dueDay:
        Number.isInteger(Number(input.dueDay)) && Number(input.dueDay) >= 1
          ? Number(input.dueDay)
          : current.dueDay,
      intervalType: (
        [
          "weekly",
          "biweekly",
          "monthly",
          "quarterly",
          "yearly",
          "custom",
        ].includes(input.intervalType ?? "")
          ? input.intervalType
          : current.intervalType
      ) as any,
      customIntervalDays: input.customIntervalDays
        ? Number(input.customIntervalDays)
        : current.customIntervalDays,
      gracePeriodDays: Number.isInteger(Number(input.gracePeriodDays))
        ? Number(input.gracePeriodDays)
        : current.gracePeriodDays,
      autoReminderEnabled:
        typeof input.autoReminderEnabled === "boolean"
          ? input.autoReminderEnabled
          : current.autoReminderEnabled,
      reminderRule: Array.isArray(input.reminderDaysAfterDue)
        ? {
            days: input.reminderDaysAfterDue
              .map(Number)
              .filter(Number.isInteger),
          }
        : { days: current.reminderDaysAfterDue },
    };

    await this.prisma.clubFeeSetting.upsert({
      where: { clubId },
      update: next,
      create: { clubId, ...next },
    });

    return {
      clubId,
      ...next,
      reminderDaysAfterDue: (next.reminderRule as any).days,
    };
  }

  async getPrivacySettings(clubId: string) {
    const settings = await this.prisma.clubPrivacySetting.findMany({
      where: { clubId },
    });
    const get = (field: string) =>
      settings.find((s) => s.fieldName === field)?.visibleToMembers ?? false;

    return {
      clubId,
      showPhoneNumberToMembers: get("phoneNumber"),
      showBirthDateToMembers: get("birthDate"),
      showGenderToMembers: get("gender"),
    };
  }

  async updatePrivacySettings(
    clubId: string,
    input: UpdateClubPrivacySettingsInput,
  ) {
    const fields: Array<[string, boolean | undefined]> = [
      ["phoneNumber", input.showPhoneNumberToMembers],
      ["birthDate", input.showBirthDateToMembers],
      ["gender", input.showGenderToMembers],
    ];

    for (const [fieldName, value] of fields) {
      if (typeof value === "boolean") {
        await this.prisma.clubPrivacySetting.upsert({
          where: { clubId_fieldName: { clubId, fieldName } },
          update: { visibleToMembers: value },
          create: { clubId, fieldName, visibleToMembers: value },
        });
      }
    }

    return this.getPrivacySettings(clubId);
  }

  async getNotificationSettings(clubId: string) {
    const s = await this.prisma.clubNotificationSetting.findUnique({
      where: { clubId },
    });
    const rule = (s?.eventReminderRule as any) ?? {};

    return {
      clubId,
      eventReminderEnabled: rule.enabled ?? false,
      eventReminderHoursBefore: rule.hoursBefore ?? [],
      feeReminderEnabled: (s?.feeReminderRule as any)?.enabled ?? false,
      feeReminderDaysAfterDue: (s?.feeReminderRule as any)?.days ?? [],
      noticeUnreadReminderEnabled:
        (s?.noticeUnreadReminderRule as any)?.enabled ?? false,
      noticeUnreadReminderHoursAfter:
        (s?.noticeUnreadReminderRule as any)?.hoursAfter ?? [],
    };
  }

  async updateNotificationSettings(
    clubId: string,
    input: UpdateClubNotificationSettingsInput,
  ) {
    const current = await this.getNotificationSettings(clubId);

    const eventRule = {
      enabled:
        typeof input.eventReminderEnabled === "boolean"
          ? input.eventReminderEnabled
          : current.eventReminderEnabled,
      hoursBefore: Array.isArray(input.eventReminderHoursBefore)
        ? input.eventReminderHoursBefore
            .map(Number)
            .filter(Number.isInteger)
        : current.eventReminderHoursBefore,
    };
    const feeRule = {
      enabled:
        typeof input.feeReminderEnabled === "boolean"
          ? input.feeReminderEnabled
          : current.feeReminderEnabled,
      days: Array.isArray(input.feeReminderDaysAfterDue)
        ? input.feeReminderDaysAfterDue
            .map(Number)
            .filter(Number.isInteger)
        : current.feeReminderDaysAfterDue,
    };
    const noticeRule = {
      enabled:
        typeof input.noticeUnreadReminderEnabled === "boolean"
          ? input.noticeUnreadReminderEnabled
          : current.noticeUnreadReminderEnabled,
      hoursAfter: Array.isArray(input.noticeUnreadReminderHoursAfter)
        ? input.noticeUnreadReminderHoursAfter
            .map(Number)
            .filter(Number.isInteger)
        : current.noticeUnreadReminderHoursAfter,
    };

    await this.prisma.clubNotificationSetting.upsert({
      where: { clubId },
      update: {
        eventReminderRule: eventRule,
        feeReminderRule: feeRule,
        noticeUnreadReminderRule: noticeRule,
      },
      create: {
        clubId,
        eventReminderRule: eventRule,
        feeReminderRule: feeRule,
        noticeUnreadReminderRule: noticeRule,
      },
    });

    return {
      clubId,
      eventReminderEnabled: eventRule.enabled,
      eventReminderHoursBefore: eventRule.hoursBefore,
      feeReminderEnabled: feeRule.enabled,
      feeReminderDaysAfterDue: feeRule.days,
      noticeUnreadReminderEnabled: noticeRule.enabled,
      noticeUnreadReminderHoursAfter: noticeRule.hoursAfter,
    };
  }

  // ── TASK 9: 가입 신청 + 초대 링크 메서드 ───────────────────────────────────

  async getJoinRequests(clubId: string): Promise<AdminJoinRequestListItem[]> {
    const requests = await this.prisma.joinRequest.findMany({
      where: { clubId },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((r) => ({
      id: r.id,
      applicantName: r.applicantName,
      applicantPhone: r.applicantPhone,
      greeting: r.greeting,
      status: r.status as any,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async createJoinRequest(
    clubId: string,
    input: CreateJoinRequestInput,
  ): Promise<AdminJoinRequestListItem> {
    const phone = normalizePhone(input.applicantPhone?.trim() ?? "");
    let userId: string;

    const existingUser = await this.prisma.user.findFirst({
      where: { phoneNumber: phone, status: { not: "removed" } },
    });

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const tempUser = await this.prisma.user.create({
        data: {
          phoneNumber: phone || `temp-${Date.now()}`,
          name: input.applicantName?.trim() ?? "",
          passwordHash: "",
          status: "active",
        },
      });
      userId = tempUser.id;
    }

    const request = await this.prisma.joinRequest.create({
      data: {
        clubId,
        userId,
        applicantName: input.applicantName.trim(),
        applicantPhone: input.applicantPhone.trim(),
        greeting: input.greeting.trim(),
        status: "pending",
      },
    });

    return {
      id: request.id,
      applicantName: request.applicantName,
      applicantPhone: request.applicantPhone,
      greeting: request.greeting,
      status: "pending",
      createdAt: request.createdAt.toISOString(),
    };
  }

  async reviewJoinRequest(
    clubId: string,
    requestId: string,
    input: ReviewJoinRequestInput,
  ): Promise<AdminJoinRequestListItem> {
    const request = await this.prisma.joinRequest.update({
      where: { id: requestId },
      data: { status: input.status as any, reviewedAt: new Date() },
    });

    if (input.status === "approved") {
      const phone = normalizePhone(request.applicantPhone);
      let user = await this.prisma.user.findFirst({
        where: { phoneNumber: phone, status: { not: "removed" } },
      });

      if (!user) {
        const digits = phone.replace(/\D/g, "");
        user = await this.prisma.user.create({
          data: {
            phoneNumber: phone,
            name: request.applicantName,
            passwordHash: digits.slice(-4),
          },
        });
      }

      const existingMembership = await this.prisma.clubMember.findFirst({
        where: {
          clubId,
          userId: user.id,
          memberStatus: { not: "removed" },
        },
      });

      if (!existingMembership) {
        await this.prisma.clubMember.create({
          data: {
            clubId,
            userId: user.id,
            role: "member",
            memberStatus: "active",
            lastFeeStatus: "unpaid",
          },
        });
      }
    }

    return {
      id: request.id,
      applicantName: request.applicantName,
      applicantPhone: request.applicantPhone,
      greeting: request.greeting,
      status: request.status as any,
      createdAt: request.createdAt.toISOString(),
    };
  }

  async getInviteLinks(clubId: string): Promise<AdminInviteLinkListItem[]> {
    const links = await this.prisma.inviteLink.findMany({
      where: { clubId },
      orderBy: { createdAt: "desc" },
    });

    return links.map((l) => ({
      id: l.id,
      token: l.tokenHash,
      expiresAt: l.expiresAt.toISOString().slice(0, 10),
      disabled: !!l.disabledAt,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async createInviteLink(
    clubId: string,
    input: CreateInviteLinkInput,
  ): Promise<AdminInviteLinkListItem> {
    const ownerMember = await this.prisma.clubMember.findFirst({
      where: { clubId, role: "owner" },
    });
    const expiresInDays = Number(input.expiresInDays) || 30;
    const token = `CREWITH-${Date.now().toString().slice(-6)}`;

    const link = await this.prisma.inviteLink.create({
      data: {
        clubId,
        tokenHash: token,
        expiresAt: new Date(
          Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
        ),
        createdBy: ownerMember?.userId ?? clubId,
      },
    });

    return {
      id: link.id,
      token: link.tokenHash,
      expiresAt: link.expiresAt.toISOString().slice(0, 10),
      disabled: false,
      createdAt: link.createdAt.toISOString(),
    };
  }

  async disableInviteLink(
    clubId: string,
    inviteId: string,
  ): Promise<AdminInviteLinkListItem> {
    const link = await this.prisma.inviteLink.update({
      where: { id: inviteId },
      data: { disabledAt: new Date() },
    });

    return {
      id: link.id,
      token: link.tokenHash,
      expiresAt: link.expiresAt.toISOString().slice(0, 10),
      disabled: true,
      createdAt: link.createdAt.toISOString(),
    };
  }

  async acceptInvite(
    clubId: string,
    token: string,
    input: AcceptInviteInput,
  ): Promise<AdminMemberListItem> {
    const link = await this.prisma.inviteLink.findFirst({
      where: { clubId, tokenHash: token.trim(), disabledAt: null },
    });

    if (!link) throw new NotFoundException("유효하지 않은 초대 링크입니다.");
    if (link.expiresAt < new Date())
      throw new NotFoundException("만료된 초대 링크입니다.");

    const phone = normalizePhone(input.applicantPhone.trim());
    let user = await this.prisma.user.findFirst({
      where: { phoneNumber: phone, status: { not: "removed" } },
    });

    if (!user) {
      const digits = phone.replace(/\D/g, "");
      user = await this.prisma.user.create({
        data: {
          phoneNumber: phone,
          name: input.applicantName.trim(),
          passwordHash: digits.slice(-4),
        },
      });
    }

    const existingMembership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: user.id, memberStatus: { not: "removed" } },
    });

    if (existingMembership) {
      return toAdminMember(user, existingMembership);
    }

    const membership = await this.prisma.clubMember.create({
      data: {
        clubId,
        userId: user.id,
        role: "member",
        memberStatus: "active",
        lastFeeStatus: "unpaid",
      },
      include: { user: true },
    });

    return toAdminMember(membership.user, membership);
  }

  // ── TASK 10: 멤버 앱 오버뷰 + 디바이스 + 알림 ────────────────────────────

  async getMemberProfile(memberId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: memberId },
    });
    return {
      memberId: user.id,
      name: user.name ?? "",
      phoneNumber: user.phoneNumber,
      profileImageUrl: user.profileImageUrl ?? undefined,
    };
  }

  async updateMemberProfile(
    memberId: string,
    input: UpdateMemberProfileInput,
  ) {
    const data: any = {};
    if (input.name?.trim()) data.name = input.name.trim();
    if (input.phoneNumber?.trim())
      data.phoneNumber = normalizePhone(input.phoneNumber);
    if (typeof input.profileImageUrl === "string")
      data.profileImageUrl = input.profileImageUrl.trim() || null;

    const user = await this.prisma.user.update({
      where: { id: memberId },
      data,
    });

    return {
      memberId: user.id,
      name: user.name ?? "",
      phoneNumber: user.phoneNumber,
      profileImageUrl: user.profileImageUrl ?? undefined,
    };
  }

  async registerDevice(input: RegisterDeviceInput) {
    // DevicePlatform enum only supports android and ios — map "web" to android as fallback
    const platform: "android" | "ios" =
      input.platform === "ios" ? "ios" : "android";

    const existing = await this.prisma.userDevice.findFirst({
      where: { userId: input.memberId, fcmToken: input.fcmToken },
    });

    let device;
    if (existing) {
      device = await this.prisma.userDevice.update({
        where: { id: existing.id },
        data: { lastSeenAt: new Date() },
      });
    } else {
      device = await this.prisma.userDevice.create({
        data: {
          userId: input.memberId,
          platform,
          fcmToken: input.fcmToken,
          lastSeenAt: new Date(),
        },
      });
    }

    return {
      id: device.id,
      memberId: input.memberId,
      platform: input.platform,
      fcmToken: input.fcmToken,
      registeredAt: device.createdAt.toISOString(),
      lastSeenAt: device.lastSeenAt?.toISOString() ?? new Date().toISOString(),
      disabled: false,
    };
  }

  async getMemberAppOverview(clubId: string, memberId: string) {
    const club = await this.prisma.club.findUniqueOrThrow({
      where: { id: clubId },
    });
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: memberId },
      include: { user: true },
    });

    if (!membership) throw new NotFoundException("모임 회원이 아닙니다.");

    const [fees, events, notices] = await Promise.all([
      this.prisma.feeItem.findMany({
        where: { clubId },
        include: {
          payments: { where: { clubMemberId: membership.id } },
        },
        orderBy: { dueDate: "desc" },
      }),
      this.prisma.event.findMany({
        where: {
          clubId,
          startsAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          responses: { where: { clubMemberId: membership.id } },
          attendance: { where: { clubMemberId: membership.id } },
        },
        orderBy: { startsAt: "asc" },
      }),
      this.prisma.notice.findMany({
        where: { clubId, deletedAt: null },
        include: {
          reads: { where: { clubMemberId: membership.id } },
          reactions: { where: { clubMemberId: membership.id } },
          _count: { select: { reactions: true, comments: true } },
          comments: {
            where: { deletedAt: null },
            include: { clubMember: { include: { user: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      club: { id: club.id, name: club.name, sportType: club.sportType },
      member: {
        id: membership.user.id,
        name: membership.user.name ?? "",
        role: membership.role,
      },
      fees: fees.map((f) => ({
        id: f.id,
        title: f.title,
        amount: f.amount,
        dueDate: f.dueDate.toISOString().slice(0, 10),
        status: (f.payments[0]?.status ?? "unpaid") as any,
      })),
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt.toISOString(),
        locationName: e.locationName ?? "",
        locationAddress: e.locationAddress ?? undefined,
        visibility: e.visibility,
        response: (e.responses[0]?.response ?? "not_attending") as any,
        attendanceStatus: (e.attendance[0]?.status ?? "absent") as any,
        companionCount: e.attendance[0]?.companionCount ?? 0,
      })),
      notices: notices.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        visibility: n.visibility,
        read: n.reads.length > 0,
        liked: n.reactions.length > 0,
        likeCount: n._count.reactions,
        commentCount: n._count.comments,
        comments: n.comments.map((c) => ({
          id: c.id,
          memberName: c.clubMember.user.name ?? "",
          body: c.body,
          createdAt: c.createdAt.toISOString(),
        })),
      })),
    };
  }

  async getMemberDirectory(
    clubId: string,
    memberId: string,
  ): Promise<MemberDirectoryItem[]> {
    const memberships = await this.prisma.clubMember.findMany({
      where: { clubId, memberStatus: { not: "removed" } },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    });

    return memberships.map((m) => ({
      id: m.user.id,
      name: m.user.name ?? "",
      role: m.role as any,
      memberStatus: m.memberStatus as any,
      joinedAt: m.joinedAt.toISOString().slice(0, 10),
      profileImageUrl: m.user.profileImageUrl ?? undefined,
      phoneNumber: m.user.phoneNumber,
      birthDate: m.user.birthDate?.toISOString().slice(0, 10),
      gender: m.user.gender ?? undefined,
    }));
  }

  async getMemberNotifications(
    memberId: string,
  ): Promise<MemberNotificationItem[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId: memberId },
      orderBy: { createdAt: "desc" },
    });

    return notifications.map((n) => ({
      id: n.id,
      memberId: n.userId,
      clubId: n.clubId ?? "",
      type: n.type as any,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt?.toISOString(),
    }));
  }

  async markMemberNotificationRead(
    memberId: string,
    notificationId: string,
  ): Promise<MemberNotificationItem> {
    const notification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return {
      id: notification.id,
      memberId: notification.userId,
      clubId: notification.clubId ?? "",
      type: notification.type as any,
      title: notification.title,
      body: notification.body,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString(),
    };
  }

  // ── TASK 11: getAdminOverview + reminders + createFeedback ────────────────

  async getAdminOverview(clubId: string) {
    const club = await this.prisma.club.findUniqueOrThrow({
      where: { id: clubId },
    });

    const [
      members,
      fees,
      events,
      notices,
      joinRequests,
      inviteLinks,
      feeSettings,
      privacySettings,
      notificationSettings,
    ] = await Promise.all([
      this.getMembers(clubId),
      this.getFees(clubId),
      this.getEvents(clubId),
      this.getNotices(clubId),
      this.getJoinRequests(clubId),
      this.getInviteLinks(clubId),
      this.getFeeSettings(clubId),
      this.getPrivacySettings(clubId),
      this.getNotificationSettings(clubId),
    ]);

    const activeMemberCount = members.filter(
      (m) => m.memberStatus === "active",
    ).length;
    const overdueMemberCount = members.filter(
      (m) => m.lastFeeStatus === "unpaid",
    ).length;
    const noticeReadRate =
      notices.length > 0
        ? Math.round(
            (notices.reduce(
              (sum, n) =>
                sum +
                n.readCount / Math.max(n.readCount + n.unreadCount, 1),
              0,
            ) /
              notices.length) *
              100,
          )
        : 0;
    const recentEvents = events.slice(0, 5);
    const avgAttendance =
      recentEvents.length > 0
        ? Math.round(
            recentEvents.reduce((sum, e) => sum + e.attendanceRate, 0) /
              recentEvents.length,
          )
        : 0;
    const latestFee = fees[0];
    const monthlyFeeCollectionRate = latestFee?.collectionRate ?? 0;

    return {
      club: {
        id: club.id,
        name: club.name,
        sportType: club.sportType,
        visibility: club.visibility,
        subscriptionStatus: club.subscriptionStatus,
        trialEndsAt: club.trialEndsAt.toISOString().slice(0, 10),
      },
      dashboard: {
        totalMemberCount: members.length,
        activeMemberCount,
        overdueMemberCount,
        noticeReadRate,
        attendanceRate: avgAttendance,
        attendanceConversionRate: avgAttendance,
        monthlyFeeCollectionRate,
      },
      feeSettings,
      privacySettings,
      notificationSettings,
      members,
      fees,
      events,
      notices,
      joinRequests,
      inviteLinks,
      reminderTargets: [],
      notificationLogs: [],
      tasks: [],
    };
  }

  async getReminderTargets(clubId: string) {
    const members = await this.getMembers(clubId);
    const events = await this.getEvents(clubId);
    const notices = await this.getNotices(clubId);

    const overdueMembers = members.filter(
      (m) => m.lastFeeStatus === "unpaid",
    );
    const recentNotices = notices.slice(0, 5);
    const unreadMembers = members.filter((m) =>
      recentNotices.some(
        (n) => !n.readers.find((r) => r.memberId === m.id)?.read,
      ),
    );
    const upcomingEvent = events.find((e) => new Date(e.startsAt) > new Date());
    const noResponseMembers = upcomingEvent
      ? members.filter(
          (m) => !upcomingEvent.participants.find((p) => p.memberId === m.id),
        )
      : [];

    return [
      ...(overdueMembers.length > 0
        ? [
            {
              id: "fee_overdue",
              type: "fee_overdue" as const,
              title: "회비 미납 알림",
              description: `회비를 미납한 회원 ${overdueMembers.length}명에게 알림을 보냅니다.`,
              targetCount: overdueMembers.length,
              targets: overdueMembers.map((m) => ({
                memberId: m.id,
                memberName: m.name,
                phoneNumber: m.phoneNumber,
                reason: "회비 미납",
              })),
            },
          ]
        : []),
      ...(unreadMembers.length > 0
        ? [
            {
              id: "notice_unread",
              type: "notice_unread" as const,
              title: "공지 미확인 알림",
              description: `공지를 확인하지 않은 회원 ${unreadMembers.length}명에게 알림을 보냅니다.`,
              targetCount: unreadMembers.length,
              targets: unreadMembers.map((m) => ({
                memberId: m.id,
                memberName: m.name,
                phoneNumber: m.phoneNumber,
                reason: "공지 미확인",
              })),
            },
          ]
        : []),
      ...(noResponseMembers.length > 0
        ? [
            {
              id: "event_no_response",
              type: "event_no_response" as const,
              title: "일정 미응답 알림",
              description: `일정에 응답하지 않은 회원 ${noResponseMembers.length}명에게 알림을 보냅니다.`,
              targetCount: noResponseMembers.length,
              targets: noResponseMembers.map((m) => ({
                memberId: m.id,
                memberName: m.name,
                phoneNumber: m.phoneNumber,
                reason: "일정 미응답",
              })),
            },
          ]
        : []),
    ];
  }

  async sendReminder(
    clubId: string,
    input: SendReminderInput,
  ): Promise<AdminNotificationLogItem> {
    const targets = await this.getReminderTargets(clubId);
    const reminder = targets.find((t) => t.id === input.reminderId);
    if (!reminder) throw new NotFoundException("Reminder target not found");

    for (const target of reminder.targets) {
      await this.prisma.notification.create({
        data: {
          userId: target.memberId,
          clubId,
          type: "fee" as any,
          title: reminder.title,
          body: target.reason,
          sentAt: new Date(),
        },
      });
    }

    return {
      id: `notif-${Date.now()}`,
      type: reminder.type,
      title: reminder.title,
      targetCount: reminder.targetCount,
      sentAt: new Date().toISOString(),
      channel: "app_push" as const,
      deliveredCount: reminder.targetCount,
      skippedCount: 0,
    };
  }

  async createFeedback(input: CreateFeedbackInput): Promise<FeedbackResult> {
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO ?? "jaywapp/Crewith";

    if (!token)
      throw new BadRequestException("GitHub integration is not configured");

    const categoryLabel =
      { bug: "버그", improvement: "개선 제안", other: "기타" }[
        input.category
      ] ?? input.category;
    const sourceLabel = input.source
      ? (
          { "mobile-app": "모바일 앱", "admin-web": "관리자 페이지" } as Record<
            string,
            string
          >
        )[input.source]
      : null;

    const issueBody = [
      `**카테고리**: ${categoryLabel}`,
      ...(sourceLabel ? [`**출처**: ${sourceLabel}`] : []),
      "",
      input.body,
      ...(input.memberId ? ["", "---", `_제출자 ID: ${input.memberId}_`] : []),
    ].join("\n");

    const labels = [
      "feedback",
      "pending-ai",
      ...(input.source ? [input.source] : []),
    ];

    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        title: `[피드백] ${input.title}`,
        body: issueBody,
        labels,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new BadRequestException(`GitHub API ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      number: number;
      html_url: string;
    };
    return { issueNumber: data.number, issueUrl: data.html_url };
  }
}
