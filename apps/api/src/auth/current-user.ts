import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface CurrentUserPayload {
  sub: string;
  phoneNumber: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserPayload | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: CurrentUserPayload }>();
    return request.user;
  },
);
