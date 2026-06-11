import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  silent: true,
  // 소스맵 업로드는 SENTRY_AUTH_TOKEN 등록 후 활성화 (지금은 생략)
});
