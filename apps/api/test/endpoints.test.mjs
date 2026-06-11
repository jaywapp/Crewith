// 도메인별 엔드포인트 성공/실패 특성화 테스트 (characterization tests).
// 현재 구현(JsonMvpRepository)이 실제로 반환하는 상태코드를 기록한다.
// mvp.test.mjs의 부트스트랩 패턴을 복제: 임시 데이터 파일 + Prisma 오버라이드 + app.listen(0).
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tempDir = mkdtempSync(join(tmpdir(), "crewith-api-endpoints-test-"));

process.env.CREWITH_DATA_FILE = join(tempDir, "endpoints-store.json");

require("reflect-metadata");

const { AppModule } = require("../dist/app.module.js");
const { MvpRepository, JsonMvpRepository } = require("../dist/mvp.repository.js");
const { PrismaService } = require("../dist/prisma/prisma.service.js");
const { Test } = require("@nestjs/testing");

const CLUB = "club-seoul-runners";
const OPERATOR = { "x-crewith-role": "operator" };
const JSON_HEADERS = { "Content-Type": "application/json" };

async function bootstrapTestApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .overrideProvider(MvpRepository)
    .useClass(JsonMvpRepository)
    .compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api/v1");
  await app.listen(0);
  return app;
}

test("endpoint success/failure characterization", async (t) => {
  const app = await bootstrapTestApp();
  t.after(async () => {
    await app.close();
  });

  const address = app.getHttpServer().address();
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

  // 공용 픽스처: 회원 1명 생성 (회비/일정/공지 대상)
  const createdMember = await fetch(`${baseUrl}/clubs/${CLUB}/members`, {
    method: "POST",
    headers: { ...JSON_HEADERS, ...OPERATOR },
    body: JSON.stringify({ name: "검증회원", phoneNumber: "010-5555-0001", role: "member" }),
  });
  assert.equal(createdMember.status, 201);
  const member = (await createdMember.json()).data;

  // ───────────────────────── [회비] ─────────────────────────

  await t.test("PATCH fees payments — 존재하지 않는 feeId는 404", async () => {
    const res = await fetch(`${baseUrl}/clubs/${CLUB}/fees/unknown-fee/payments`, {
      method: "PATCH",
      headers: { ...JSON_HEADERS, ...OPERATOR },
      body: JSON.stringify({ memberId: member.id, status: "paid" }),
    });
    assert.equal(res.status, 404);
  });

  await t.test("POST fees — operator 역할 없이 호출하면 403", async () => {
    const res = await fetch(`${baseUrl}/clubs/${CLUB}/fees`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ title: "6월 회비", amount: 30000, dueDate: "2026-06-25" }),
    });
    assert.equal(res.status, 403);
  });

  // ───────────────────────── [일정] ─────────────────────────

  await t.test("POST events — 필수 필드(title) 누락 시 현재 500 반환 (특성화)", async () => {
    const res = await fetch(`${baseUrl}/clubs/${CLUB}/events`, {
      method: "POST",
      headers: { ...JSON_HEADERS, ...OPERATOR },
      body: JSON.stringify({
        startsAt: "2026-07-01T19:00:00+09:00",
        locationName: "테스트 장소",
        visibility: "all_members",
      }),
    });
    // 기대는 400이지만 현재 구현은 title.trim()에서 TypeError → 500.
    // 에러 처리 개선 필요(별도 트랙): 입력 검증을 추가해 400을 반환해야 한다.
    assert.equal(res.status, 500);
  });

  await t.test("PATCH event responses — 잘못된 response 값도 현재 200 반환 (특성화)", async () => {
    const created = await fetch(`${baseUrl}/clubs/${CLUB}/events`, {
      method: "POST",
      headers: { ...JSON_HEADERS, ...OPERATOR },
      body: JSON.stringify({
        title: "응답 검증 일정",
        startsAt: "2026-07-01T19:00:00+09:00",
        locationName: "테스트 장소",
        visibility: "all_members",
      }),
    });
    assert.equal(created.status, 201);
    const event = (await created.json()).data;

    const res = await fetch(`${baseUrl}/clubs/${CLUB}/events/${event.id}/responses`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ memberId: member.id, response: "definitely-not-a-valid-response" }),
    });
    // 기대는 400이지만 현재 구현은 response 값을 검증하지 않고 그대로 저장 → 200.
    // 에러 처리 개선 필요(별도 트랙): 허용 값(attending/absent 등) 검증을 추가해야 한다.
    assert.equal(res.status, 200);
  });

  await t.test("DELETE events — 존재하지 않는 eventId는 404", async () => {
    const res = await fetch(`${baseUrl}/clubs/${CLUB}/events/unknown-event`, {
      method: "DELETE",
      headers: OPERATOR,
    });
    assert.equal(res.status, 404);
  });

  // ───────────────────────── [공지] ─────────────────────────

  await t.test("POST notices — operator로 생성 후 GET에 노출된다", async () => {
    const created = await fetch(`${baseUrl}/clubs/${CLUB}/notices`, {
      method: "POST",
      headers: { ...JSON_HEADERS, ...OPERATOR },
      body: JSON.stringify({
        title: "엔드포인트 검증 공지",
        body: "공지 본문",
        visibility: "all_members",
      }),
    });
    assert.equal(created.status, 201);
    const notice = (await created.json()).data;

    const list = await fetch(`${baseUrl}/clubs/${CLUB}/notices`, { headers: OPERATOR });
    assert.equal(list.status, 200);
    const notices = (await list.json()).data;
    assert.equal(
      notices.some((n) => n.id === notice.id && n.title === "엔드포인트 검증 공지"),
      true,
    );
  });

  await t.test("PATCH notices read — 비회원 memberId는 4xx", async () => {
    const created = await fetch(`${baseUrl}/clubs/${CLUB}/notices`, {
      method: "POST",
      headers: { ...JSON_HEADERS, ...OPERATOR },
      body: JSON.stringify({ title: "읽음 검증 공지", body: "본문", visibility: "all_members" }),
    });
    assert.equal(created.status, 201);
    const notice = (await created.json()).data;

    const res = await fetch(`${baseUrl}/clubs/${CLUB}/notices/${notice.id}/read`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ memberId: "unknown-member" }),
    });
    assert.equal(res.status, 404);
  });

  // ───────────────────────── [인증] ─────────────────────────

  await t.test("POST auth/login — 미등록 전화번호는 4xx", async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ phoneNumber: "010-0000-9999", password: "whatever" }),
    });
    assert.equal(res.status, 400);
  });

  await t.test("POST auth/register — 중복 전화번호는 409", async () => {
    const first = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: "중복검증", phoneNumber: "010-8888-7777", password: "pass1234" }),
    });
    assert.equal(first.status, 201);

    const dup = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: "중복검증2", phoneNumber: "010-8888-7777", password: "other" }),
    });
    assert.equal(dup.status, 409);
  });
});
