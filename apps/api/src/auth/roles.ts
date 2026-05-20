import { SetMetadata } from "@nestjs/common";

type ClubRole = "owner" | "operator" | "member";

export const CLUB_ROLES_KEY = "clubRoles";

export const ClubRoles = (...roles: ClubRole[]) =>
  SetMetadata(CLUB_ROLES_KEY, roles);
