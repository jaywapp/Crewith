import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

test("feedback removes controls while preserving tabs, newlines and Unicode", async () => {
  process.env.GITHUB_TOKEN = "test-token";
  resetFeedbackRateLimitsForTest();
  const controls = Array.from({ length: 32 }, (_, code) => String.fromCharCode(code)).join("");
  let payload;
  await createGitHubFeedbackIssue({
    title: "fixture",
    body: `start${controls}\u007f한글😀\r\nend`,
    category: "bug",
    source: "admin-web",
    memberId: "control-fixture",
    appVersion: "1.0.0",
  }, async (_url, init) => {
    payload = JSON.parse(init.body);
    return Response.json({ number: 1, html_url: "https://example.test/1" });
  });
  assert.ok(payload.body.endsWith("start\t\n\n한글😀\nend"));
});

const require = createRequire(import.meta.url);
const {
  createGitHubFeedbackIssue,
  resetFeedbackRateLimitsForTest,
} = require("../dist/feedback.js");

test("feedback is sent to the fixed repository with the 제보 label", async () => {
  process.env.GITHUB_TOKEN = "test-token";
  resetFeedbackRateLimitsForTest();
  let request;
  const result = await createGitHubFeedbackIssue(
    {
      title: "버튼 오류",
      body: "저장 버튼이 동작하지 않습니다.",
      category: "bug",
      source: "admin-web",
      memberId: "member-1",
      contact: "user@example.com",
      appVersion: "0.1.0",
    },
    async (url, init) => {
      request = { url, init };
      return new Response(JSON.stringify({ number: 42, html_url: "https://example.test/42" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    },
  );

  assert.equal(request.url, "https://api.github.com/repos/jaywapp/Crewith/issues");
  const payload = JSON.parse(request.init.body);
  assert.equal(payload.title, "[제보] 버튼 오류");
  assert.deepEqual(payload.labels, ["제보"]);
  assert.match(payload.body, /관리자 웹/);
  assert.equal(result.issueNumber, 42);
});

test("feedback validates lengths and limits repeated submissions", async () => {
  process.env.GITHUB_TOKEN = "test-token";
  resetFeedbackRateLimitsForTest();
  const fetchStub = async () =>
    new Response(JSON.stringify({ number: 1, html_url: "https://example.test/1" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  const input = {
    title: "제목",
    body: "내용",
    category: "other",
    source: "mobile-app",
    memberId: "member-rate-limit",
    appVersion: "0.2.4",
  };

  await createGitHubFeedbackIssue(input, fetchStub);
  await createGitHubFeedbackIssue(input, fetchStub);
  await createGitHubFeedbackIssue(input, fetchStub);
  await assert.rejects(() => createGitHubFeedbackIssue(input, fetchStub), /10분/);
  await assert.rejects(
    () => createGitHubFeedbackIssue({ ...input, memberId: "other", title: "x".repeat(121) }, fetchStub),
    /120자/,
  );
});
