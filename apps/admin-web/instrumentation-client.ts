import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV === "production" ? "prod" : "dev",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  sendDefaultPii: false,
});

// 라우터 전환 계측 (SDK 요구 사항)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
