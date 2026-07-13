import { SetMetadata } from "@nestjs/common";

export const REQUIRE_CLUB_ROLE_KEY = "requireClubRole";

export const RequireClubRole = () => SetMetadata(REQUIRE_CLUB_ROLE_KEY, true);
