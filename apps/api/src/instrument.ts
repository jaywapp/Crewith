import * as Sentry from "@sentry/nestjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN, // 미설정 시 비활성
  environment: process.env.NODE_ENV === "production" ? "prod" : "dev",
  release: process.env.npm_package_version,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  beforeSend(event) {
    delete event.user; // 공통 규칙 4: user 식별 정보 차단
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
      delete event.request.data; // 요청 본문(비밀번호·카드번호 등) 차단
    }
    return event;
  },
});
