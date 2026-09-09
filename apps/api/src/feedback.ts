import {
  BadRequestException,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from "@nestjs/common";
import type {
  CreateFeedbackInput,
  FeedbackCategory,
  FeedbackResult,
} from "./mvp.store";

const TARGET_REPOSITORY = "jaywapp/Crewith";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const feedbackAttempts = new Map<string, number[]>();

type FetchLike = typeof fetch;

const categoryLabels: Record<FeedbackCategory, string> = {
  bug: "버그",
  improvement: "개선 제안",
  other: "기타",
};

const sourceLabels = {
  "mobile-app": "모바일 앱",
  "admin-web": "관리자 웹",
} as const;

function normalizeText(value: unknown, maxLength: number, fieldName: string) {
  if (typeof value !== "string") {
    throw new BadRequestException(`${fieldName}을(를) 입력해 주세요.`);
  }

  const normalized = value
    .replace(/\r\n?/g, "\n")
    // eslint-disable-next-line no-control-regex -- Intentionally remove control characters from user feedback.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();

  if (!normalized) {
    throw new BadRequestException(`${fieldName}을(를) 입력해 주세요.`);
  }
  if (normalized.length > maxLength) {
    throw new BadRequestException(`${fieldName}은(는) ${maxLength}자 이하여야 합니다.`);
  }

  return normalized;
}

function normalizeOptionalText(value: unknown, maxLength: number, fieldName: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return normalizeText(value, maxLength, fieldName);
}

function enforceRateLimit(actorId: string, now = Date.now()) {
  const recentAttempts = (feedbackAttempts.get(actorId) ?? []).filter(
    (attemptedAt) => now - attemptedAt < RATE_LIMIT_WINDOW_MS,
  );

  if (recentAttempts.length >= RATE_LIMIT_MAX_REQUESTS) {
    throw new HttpException(
      "제보를 너무 자주 전송했습니다. 10분 후 다시 시도해 주세요.",
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  recentAttempts.push(now);
  feedbackAttempts.set(actorId, recentAttempts);
}

export async function createGitHubFeedbackIssue(
  input: CreateFeedbackInput,
  fetchImpl: FetchLike = fetch,
): Promise<FeedbackResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new ServiceUnavailableException("제보 기능이 아직 설정되지 않았습니다.");
  }

  const title = normalizeText(input.title, 120, "제목");
  const description = normalizeText(input.body, 5000, "내용");
  const contact = normalizeOptionalText(input.contact, 200, "연락처");
  const appVersion = normalizeText(input.appVersion, 64, "앱 버전");
  const category = input.category;
  const source = input.source;

  if (!category || !(category in categoryLabels)) {
    throw new BadRequestException("올바른 제보 유형을 선택해 주세요.");
  }
  if (!source || !(source in sourceLabels)) {
    throw new BadRequestException("올바른 제보 출처가 아닙니다.");
  }
  if (!input.memberId) {
    throw new BadRequestException("제보 제출자를 확인할 수 없습니다.");
  }

  enforceRateLimit(input.memberId);

  const issueBody = [
    `**유형**: ${categoryLabels[category]}`,
    `**플랫폼**: ${sourceLabels[source]}`,
    `**앱 버전**: ${appVersion}`,
    ...(contact ? [`**회신 연락처**: ${contact}`] : []),
    "",
    description,
  ].join("\n");

  const response = await fetchImpl(
    `https://api.github.com/repos/${TARGET_REPOSITORY}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title: `[제보] ${title}`,
        body: issueBody,
        labels: ["제보"],
      }),
    },
  );

  if (!response.ok) {
    throw new ServiceUnavailableException(
      "제보를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  const data = (await response.json()) as {
    number?: unknown;
    html_url?: unknown;
  };
  if (typeof data.number !== "number" || typeof data.html_url !== "string") {
    throw new ServiceUnavailableException(
      "제보 등록 결과를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  return { issueNumber: data.number, issueUrl: data.html_url };
}

export function resetFeedbackRateLimitsForTest() {
  feedbackAttempts.clear();
}
