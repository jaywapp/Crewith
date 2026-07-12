import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { CurrentUserPayload } from "./current-user";
import { IS_PUBLIC_KEY } from "./public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined>; user?: CurrentUserPayload }>();
    const [scheme, token] = `${request.headers.authorization ?? ""}`.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Access token is required");
    }

    try {
      request.user = await this.jwtService.verifyAsync<CurrentUserPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }

    return true;
  }
}
