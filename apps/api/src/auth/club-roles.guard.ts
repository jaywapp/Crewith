import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { MvpRepository } from "../mvp.repository";
import type { CurrentUserPayload } from "./current-user";
import { REQUIRE_CLUB_ROLE_KEY } from "./require-club-role.decorator";

@Injectable()
export class ClubRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly repository: MvpRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_CLUB_ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ params?: Record<string, string>; user?: CurrentUserPayload }>();
    const clubId = request.params?.clubId;
    const user = request.user;

    if (!user || !clubId) {
      throw new ForbiddenException("Operator role is required");
    }

    const role = await this.repository.getClubRole(clubId, user.sub);

    if (role !== "owner" && role !== "operator") {
      throw new ForbiddenException("Operator role is required");
    }

    return true;
  }
}
