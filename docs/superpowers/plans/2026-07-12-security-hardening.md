# Crewith 보안 강화 및 품질 정비 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 2026-07-12 프로젝트 점검에서 발견된 보안 결함(평문 비밀번호, 클라이언트 신뢰 권한 헤더, 예측 가능한 초대 토큰)과 품질 격차(lint 실패, CI 공백, 의존성 취약점, 온보딩 함정)를 해소한다.

**Architecture:** API에 bcrypt 해싱과 JWT 인증(전역 `JwtAuthGuard` + 클럽 역할 조회 `ClubRolesGuard`)을 도입하고, 클라이언트가 보내던 `x-crewith-role` 헤더 신뢰를 제거한다. admin-web과 mobile-app은 로그인 응답의 `accessToken`을 저장해 `Authorization: Bearer` 헤더로 전환한다. 파일 스토어(`JsonMvpRepository`)와 Prisma 구현 양쪽을 동일하게 수정한다.

**Tech Stack:** NestJS 11, `@nestjs/jwt`(이미 설치됨), `bcryptjs`(신규), Prisma 6, Next.js 15 (App Router, server actions), Flutter, node:test

## Global Constraints

- Node >= 22, npm >= 11 (루트 `package.json` engines)
- 커밋 메시지는 conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `ci:`, `docs:`)
- 코드·식별자·커밋 메시지·코드 주석은 영어, 사용자 노출 문자열(오류 메시지 등)은 기존 관례대로 한국어 유지
- 기존 코드 스타일 유지: API 소스는 세미콜론 + 더블쿼트, 파일 스토어와 Prisma 구현은 항상 함께 수정
- 테스트는 `node --test` 기반 `apps/api/test/*.test.mjs` — dist 빌드 산출물을 require하므로 **테스트 전 반드시 빌드** (`npm run test -w @crewith/api`가 build를 포함함)
- 요청 범위 밖 리팩토링 금지 (파일 분리, 이름 변경 등은 이 계획에 명시된 것만)
- push는 사용자가 명시적으로 요청할 때만

## 실행 방법

**브랜치 준비 (오케스트레이터가 Task 1 전에 1회 수행):**

```bash
git checkout develop
git pull origin develop
git checkout -b feat/security-hardening
git branch -d feat/common-gaps   # PR #29로 이미 머지된 브랜치 정리
```

**태스크 의존 관계:**

```
Task 1 (lint/CI) ─┐
Task 2 (온보딩)   ├─ 서로 독립, 순서 무관
Task 3 (취약점)   ┘
Task 4 (bcrypt) → Task 6 (JWT 발급/가드) → Task 7 (역할 가드) → Task 8 (admin-web), Task 9 (mobile)
Task 5 (초대 토큰) — 독립
```

**⚠️ 배포 주의:** Task 6·7이 배포되면 토큰 없는 요청이 401이 되므로, API(6·7)와 클라이언트(8·9)는 **반드시 같은 릴리즈로 함께 배포**한다. 이 계획은 하나의 브랜치/PR에서 전부 완료한 뒤 머지하는 것을 전제로 한다.

## 서브에이전트 모델 배정

`~/.ai/rules/ai-roles.md` 기준: 확정된 스펙의 구현은 하위 모델, 리뷰는 상위 모델.

| Task | 내용 | 모델 | 근거 |
|------|------|------|------|
| 1 | ESLint fetch 전역 + CI lint 게이트 | **haiku** | 설정 2줄 + YAML 1스텝 |
| 2 | postinstall / README / .env.example 정비 | **haiku** | 기계적 문서·설정 수정 |
| 3 | 의존성 취약점 해소 | **haiku** | 명령 실행 + 검증, 중단 조건 명시됨 |
| 4 | bcrypt 비밀번호 해싱 | **sonnet** | 수정 지점 다수(양쪽 저장소), 회귀 위험 |
| 5 | 초대 토큰 랜덤화 | **haiku** | 2개 지점 치환 + 테스트 |
| 6 | JWT 발급 + 전역 JwtAuthGuard | **sonnet** | 신규 가드 + 테스트 부트스트랩 재작성 |
| 7 | ClubRolesGuard + 역할 헤더 제거 | **sonnet** | 컨트롤러 전면 수정, 엔드포인트 분류 |
| 8 | admin-web Authorization 연동 | **sonnet** | server action 다수 수정 |
| 9 | mobile-app Authorization 연동 | **sonnet** | Dart 클라이언트 전 메서드 수정 |
| 리뷰 | 태스크별 코드 리뷰 + 최종 교차 리뷰 | **opus 이상** (메인 세션) 또는 Codex | ai-roles의 교차 리뷰 원칙 |

---

### Task 1: ESLint fetch 전역 등록 + CI lint 게이트

**모델: haiku**

**Files:**
- Modify: `apps/api/eslint.config.mjs`
- Modify: `.github/workflows/api-ci.yml`

**Interfaces:**
- Consumes: 없음 (독립 태스크)
- Produces: `npm run lint` 루트 실행이 성공하는 상태, CI가 eslint를 게이트로 강제

- [ ] **Step 1: 현재 lint가 실패하는지 확인 (재현)**

Run: `npm run lint -w @crewith/api`
Expected: FAIL — `'fetch' is not defined  no-undef` 2건 (`dist/mvp.repository.js`, `dist/prisma.repository.js`)

- [ ] **Step 2: globals에 fetch 추가**

`apps/api/eslint.config.mjs`의 `globals` 객체에 한 줄 추가:

```js
      globals: {
        Buffer: "readonly",
        console: "readonly",
        exports: "writable",
        fetch: "readonly",
        module: "readonly",
        process: "readonly",
        require: "readonly",
        Reflect: "readonly",
        Record: "readonly",
        Set: "readonly",
        Map: "readonly",
      },
```

- [ ] **Step 3: lint 통과 확인**

Run: `npm run lint` (루트 — 3개 워크스페이스 전부)
Expected: PASS, 오류 0건

- [ ] **Step 4: CI에 eslint 단계 추가**

`.github/workflows/api-ci.yml`의 test job 마지막에 스텝 추가 (test 스텝이 이미 build를 수행해 dist가 존재하므로 eslint만 실행):

```yaml
      - run: npm run test -w @crewith/api   # build 포함, 실패 시 워크플로우 실패 = 게이트
      - run: npm exec -w @crewith/api -- eslint "dist/**/*.js"
```

- [ ] **Step 5: 커밋**

```bash
git add apps/api/eslint.config.mjs .github/workflows/api-ci.yml
git commit -m "ci: register fetch global for eslint and gate lint in API CI"
```

---

### Task 2: 온보딩·환경변수 정비 (postinstall, README, .env.example)

**모델: haiku**

**배경:** 클론 직후 `npm install`만으로는 Prisma 클라이언트가 생성되지 않아 `npm run typecheck`가 TS7006 오류로 실패한다. 또한 코드가 사용하는 `GITHUB_TOKEN`/`GITHUB_REPO`(`apps/api/src/mvp.repository.ts:1068`, `prisma.repository.ts:1948`)와 CORS 제한용 `ADMIN_WEB_ORIGIN`(`apps/api/src/main.ts:13`)이 `.env.example`에 없다.

**Files:**
- Modify: `package.json` (루트)
- Modify: `Dockerfile`
- Modify: `README.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: 없음 (독립 태스크)
- Produces: `npm install` 직후 `npm run typecheck` 통과

**⚠️ Docker 제약:** `Dockerfile`은 `npm ci`(11행)를 `apps/api/prisma` 복사(16행) **이전에** 실행한다. 따라서 postinstall은 스키마 파일이 존재할 때만 generate하도록 가드하고, Dockerfile에는 명시적 generate 단계를 추가한다.

- [ ] **Step 1: 루트 package.json에 가드된 postinstall 추가**

`package.json`의 `scripts`에 추가 (스키마가 없는 환경 — Docker의 `npm ci` 단계 — 에서는 건너뜀):

```json
  "scripts": {
    "postinstall": "node -e \"if(require('fs').existsSync('apps/api/prisma/schema.prisma'))require('child_process').execSync('npx prisma generate --schema apps/api/prisma/schema.prisma',{stdio:'inherit'})\"",
    "dev:api": "npm run dev -w @crewith/api",
```

- [ ] **Step 2: postinstall 동작 확인**

Run: `npm install`
Expected: 출력에 `Generated Prisma Client` 포함. 이어서 `npm run typecheck` → PASS

- [ ] **Step 2-1: Dockerfile에 명시적 generate 단계 추가**

`Dockerfile`의 `COPY apps/api ./apps/api`와 `RUN npm run build -w @crewith/api` 사이에 추가:

```dockerfile
RUN npm run prisma:generate -w @crewith/api
```

- [ ] **Step 3: README 설치 섹션 보강**

`README.md`의 `### 설치` 섹션을 다음으로 교체:

```markdown
### 설치

```bash
npm install
```

> `npm install`이 끝나면 postinstall 훅이 Prisma 클라이언트를 자동 생성합니다.
> 스키마(`apps/api/prisma/schema.prisma`)를 수정한 뒤에는 `npm run prisma:generate`를 다시 실행하세요.
```

- [ ] **Step 4: .env.example에 누락 키 추가**

`.env.example` 끝에 추가 (마지막 줄 개행 유지):

```
ADMIN_WEB_ORIGIN=""
GITHUB_TOKEN=""
GITHUB_REPO="jaywapp/Crewith"
```

- [ ] **Step 5: 커밋**

```bash
git add package.json README.md .env.example
git commit -m "chore: add prisma generate postinstall and document missing env keys"
```

---

### Task 3: 의존성 취약점 해소

**모델: haiku**

**배경:** `npm audit` 기준 5건(high 2: `multer` ← `@nestjs/platform-express` 경유, moderate 3: `postcss` ← `next` 경유 등).

**Files:**
- Modify: `package-lock.json` (및 필요 시 `apps/api/package.json`, `apps/admin-web/package.json`)

**Interfaces:**
- Consumes: 없음 (독립 태스크)
- Produces: `npm audit --audit-level=high` 통과

**⚠️ 중단 조건:** major 버전 업그레이드(`npm audit fix --force`가 요구하는 breaking change 포함) 없이 해소되지 않는 항목이 있으면, **강제로 올리지 말고** 남은 항목과 필요한 major 업그레이드 내용을 보고하고 종료한다.

- [ ] **Step 1: 현재 상태 기록**

Run: `npm audit`
Expected: 5 vulnerabilities (3 moderate, 2 high) — 항목을 기록해 둔다

- [ ] **Step 2: 비파괴 수정 적용**

Run: `npm audit fix` (⚠️ `--force` 금지)

- [ ] **Step 3: 잔여 high 취약점 개별 패치**

Run: `npm audit --audit-level=high`

multer가 남아 있으면:

```bash
npm install -w @crewith/api @nestjs/platform-express@^11
```

postcss(next 경유)가 남아 있으면:

```bash
npm install -w @crewith/admin-web next@^15.5
```

다시 `npm audit --audit-level=high` → Expected: `found 0 high severity vulnerabilities` (moderate 잔여는 보고만)

- [ ] **Step 4: 회귀 검증**

Run: `npm run typecheck && npm run build && npm run test`
Expected: 전부 PASS (테스트 12/12)

- [ ] **Step 5: 커밋**

```bash
git add package.json package-lock.json apps/api/package.json apps/admin-web/package.json
git commit -m "chore: patch dependency vulnerabilities via npm audit fix"
```

---

### Task 4: 비밀번호 bcrypt 해싱 + 응답에서 password 제거

**모델: sonnet**

**배경:** 현재 비밀번호가 평문으로 저장·비교된다 (`prisma.repository.ts:289` `user.passwordHash !== password`). 또한 `toAdminMember`가 `password: user.passwordHash`를 응답에 포함해 관리자 목록 API로 비밀번호가 유출된다. 기존 DB에는 평문 레코드가 있으므로 **lazy migration**(로그인 성공 시 재해싱)으로 전환한다.

**Files:**
- Create: `apps/api/src/auth/password.ts`
- Modify: `apps/api/src/mvp.store.ts` (interface 96행, hydrate 719–722행, createMemberFromProfile 808행, memberWithMembership 854행)
- Modify: `apps/api/src/mvp.repository.ts` (login 179–196, register 226, resetMemberPassword 274, selfResetPassword 290, acceptInvite쪽 648, createMember 676, importMembers 727, updateMember 772–773)
- Modify: `apps/api/src/prisma.repository.ts` (toAdminMember의 `password: user.passwordHash` 103행 제거, login 289, register 334, resetMemberPassword 390, selfResetPassword 407, createMember 450, updateMember 492, reviewJoinRequest 1364, acceptInvite 1487)
- Modify: `apps/api/package.json` (bcryptjs 추가)
- Test: `apps/api/test/endpoints.test.mjs`

**Interfaces:**
- Consumes: 없음
- Produces: `hashPassword(plain: string): string`, `verifyPassword(plain: string, stored: string | undefined): { ok: boolean; needsRehash: boolean }` (Task 6의 login 플로우가 이 위에서 동작)

- [ ] **Step 1: bcryptjs 설치**

```bash
npm install -w @crewith/api bcryptjs
```

(bcryptjs v3는 타입 내장 — `@types/bcryptjs` 불필요)

- [ ] **Step 2: 실패하는 테스트 작성**

`apps/api/test/endpoints.test.mjs`의 `endpoint success/failure characterization` 테스트 안에 subtest 추가 (기존 `member` 픽스처 재사용, 파일 상단에 `import { readFileSync } from "node:fs";` 추가):

```js
  // ───────────────────────── [비밀번호 해싱] ─────────────────────────

  await t.test("passwords are stored as bcrypt hashes, not plaintext", async () => {
    const created = await fetch(`${baseUrl}/clubs/${CLUB}/members`, {
      method: "POST",
      headers: { ...JSON_HEADERS, ...OPERATOR },
      body: JSON.stringify({ name: "해시검증", phoneNumber: "010-7777-0001", role: "member", password: "pw-hash-check" }),
    });
    assert.equal(created.status, 201);

    const raw = JSON.parse(readFileSync(process.env.CREWITH_DATA_FILE, "utf8"));
    const stored = raw.members.find((m) => m.phoneNumber === "010-7777-0001");
    assert.ok(stored, "member persisted to store file");
    assert.match(stored.password, /^\$2[aby]\$/, "password must be a bcrypt hash");
  });

  await t.test("login verifies against the bcrypt hash", async () => {
    const ok = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ phoneNumber: "010-7777-0001", password: "pw-hash-check" }),
    });
    assert.equal(ok.status, 201);

    const bad = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ phoneNumber: "010-7777-0001", password: "wrong-password" }),
    });
    assert.equal(bad.status, 400);
  });

  await t.test("member responses never include password", async () => {
    const res = await fetch(`${baseUrl}/clubs/${CLUB}/members`, { headers: OPERATOR });
    assert.equal(res.status, 200);
    const list = (await res.json()).data;
    assert.ok(list.length > 0);
    assert.ok(list.every((m) => !("password" in m)), "password must not leak in member list");
  });
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm run test -w @crewith/api`
Expected: FAIL — `password must be a bcrypt hash` (평문 저장), `password must not leak in member list`

- [ ] **Step 4: 해싱 헬퍼 작성**

Create `apps/api/src/auth/password.ts`:

```ts
import bcrypt from "bcryptjs";

const BCRYPT_PREFIX = /^\$2[aby]\$/;
const SALT_ROUNDS = 10;

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, SALT_ROUNDS);
}

/**
 * Verifies a password against a stored value that may be either a bcrypt
 * hash or a legacy plaintext record. Legacy matches report needsRehash so
 * callers can lazily migrate the stored value.
 */
export function verifyPassword(
  plain: string,
  stored: string | undefined,
): { ok: boolean; needsRehash: boolean } {
  if (!plain || !stored) {
    return { ok: false, needsRehash: false };
  }

  if (BCRYPT_PREFIX.test(stored)) {
    return { ok: bcrypt.compareSync(plain, stored), needsRehash: false };
  }

  const ok = stored === plain;
  return { ok, needsRehash: ok };
}
```

- [ ] **Step 5: 파일 스토어(mvp.store.ts) 수정**

1. 96행 인터페이스 필드를 optional로: `password?: string;`
2. 상단 import 추가: `import { hashPassword } from "./auth/password";`
3. hydrateStore 백필(719–722행)을 해싱으로:

```ts
    for (const member of members) {
      if (!member.password) {
        const digits = member.phoneNumber.replace(/\D/g, "");
        member.password = hashPassword(digits.slice(-4));
      }
    }
```

4. createMemberFromProfile(808행): `password: hashPassword(phoneDigits.slice(-4)),`
5. memberWithMembership(854행)에서 password 제거 — 이 함수가 목록/오버뷰 응답의 공용 경로다:

```ts
export function memberWithMembership(membership: ClubMembershipItem): AdminMemberListItem {
  const member = findMember(membership.memberId);
  const { password: _password, ...rest } = member;

  return {
    ...rest,
    role: membership.role,
    memberStatus: membership.memberStatus,
    joinedAt: membership.joinedAt,
  };
}
```

6. 같은 파일에 응답 정화 헬퍼 추가(export):

```ts
export function sanitizeMember(member: AdminMemberListItem): AdminMemberListItem {
  const { password: _password, ...rest } = member;
  return rest;
}
```

- [ ] **Step 6: JsonMvpRepository(mvp.repository.ts) 수정**

1. import 추가: `import { hashPassword, verifyPassword } from "./auth/password";` 및 `sanitizeMember`를 `./mvp.store` import 목록에 추가
2. login(187행 부근) — 검증 + lazy rehash:

```ts
    const verdict = verifyPassword(password, member?.password);

    if (!member || !verdict.ok) {
      throw new BadRequestException("전화번호 또는 비밀번호가 올바르지 않습니다.");
    }

    if (verdict.needsRehash) {
      member.password = hashPassword(password);
      persistStore();
    }
```

3. 평문 대입 지점 전부 `hashPassword(...)` 경유로 변경:
   - register 226행: `password: hashPassword(password),`
   - resetMemberPassword 274행: `member.password = hashPassword(newPassword);`
   - selfResetPassword 290행: `member.password = hashPassword(digits.slice(-4));`
   - 648행: `password: hashPassword(phoneDigits.slice(-4)),`
   - createMember 676행: `password: hashPassword(input.password?.trim() || phoneDigits.slice(-4)),`
   - importMembers 727행: `password: passwordValue?.trim() ? hashPassword(passwordValue.trim()) : undefined,`
   - updateMember 773행: `member.password = hashPassword(input.password.trim());`
4. 회원 객체를 **직접 반환**하는 메서드(createMember, updateMember, importMembers의 반환 배열, acceptInvite, reviewJoinRequest)의 return 값을 `sanitizeMember(...)`로 감싼다. (memberWithMembership 경유 반환은 Step 5-5로 이미 정화됨)

- [ ] **Step 7: PrismaRepository(prisma.repository.ts) 수정**

1. import 추가: `import { hashPassword, verifyPassword } from "./auth/password";`
2. toAdminMember(103행)에서 `password: user.passwordHash,` 줄 삭제
3. login(289행 부근):

```ts
    const verdict = verifyPassword(password, user?.passwordHash);

    if (!user || !verdict.ok) {
      throw new BadRequestException(
        "전화번호 또는 비밀번호가 올바르지 않습니다.",
      );
    }

    if (verdict.needsRehash) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashPassword(password) },
      });
    }
```

4. 평문 대입 지점 전부 변경:
   - register 334행: `passwordHash: hashPassword(password),`
   - resetMemberPassword 390행: `data: { passwordHash: hashPassword(newPassword) },`
   - selfResetPassword 407행: `data: { passwordHash: hashPassword(digits.slice(-4)) },`
   - createMember 450–451행: `passwordHash: hashPassword(input.password?.trim() || phoneDigits.slice(-4)),`
   - updateMember 492행: `if (input.password?.trim()) userUpdate.passwordHash = hashPassword(input.password.trim());`
   - reviewJoinRequest 1364행: `passwordHash: hashPassword(digits.slice(-4)),`
   - acceptInvite 1487행: `passwordHash: hashPassword(digits.slice(-4)),`
   - 1314행의 `passwordHash: ""`는 그대로 둔다 (`verifyPassword`가 빈 stored를 거부하므로 로그인 불가 계정으로 유지)

- [ ] **Step 8: 테스트 통과 확인**

Run: `npm run test -w @crewith/api`
Expected: PASS — 신규 3개 subtest 포함 전부 통과

Run: `npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 9: 커밋**

```bash
git add apps/api package.json package-lock.json
git commit -m "feat(api): hash passwords with bcrypt and stop leaking them in responses"
```

---

### Task 5: 초대 링크 토큰 랜덤화

**모델: haiku**

**배경:** 초대 토큰이 `CREWITH-${Date.now().toString().slice(-6)}` (시각 기반 6자리)라 추측 가능하다. 두 저장소 구현 모두 수정한다.

**Files:**
- Modify: `apps/api/src/mvp.repository.ts:581`
- Modify: `apps/api/src/prisma.repository.ts:1423`
- Test: `apps/api/test/endpoints.test.mjs`

**Interfaces:**
- Consumes: 없음
- Produces: 토큰 형식 `CREWITH-` + base64url 12자 (`/^CREWITH-[A-Za-z0-9_-]{12}$/`)

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/api/test/endpoints.test.mjs`에 subtest 추가:

```js
  // ───────────────────────── [초대 링크] ─────────────────────────

  await t.test("invite tokens are random and unique", async () => {
    const createLink = () =>
      fetch(`${baseUrl}/clubs/${CLUB}/invite-links`, {
        method: "POST",
        headers: { ...JSON_HEADERS, ...OPERATOR },
        body: JSON.stringify({ expiresInDays: 7 }),
      });

    const first = (await (await createLink()).json()).data;
    const second = (await (await createLink()).json()).data;

    assert.match(first.token, /^CREWITH-[A-Za-z0-9_-]{12}$/);
    assert.match(second.token, /^CREWITH-[A-Za-z0-9_-]{12}$/);
    assert.notEqual(first.token, second.token);
  });
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -w @crewith/api`
Expected: FAIL — 토큰이 `CREWITH-숫자6자리` 형식이라 정규식 불일치

- [ ] **Step 3: 토큰 생성 교체**

`apps/api/src/mvp.repository.ts` 상단에 `import { randomBytes } from "node:crypto";` 추가, 581행을:

```ts
      token: `CREWITH-${randomBytes(9).toString("base64url")}`,
```

`apps/api/src/prisma.repository.ts` 상단에 같은 import 추가, 1423행을:

```ts
    const token = `CREWITH-${randomBytes(9).toString("base64url")}`;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm run test -w @crewith/api`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/api/src/mvp.repository.ts apps/api/src/prisma.repository.ts apps/api/test/endpoints.test.mjs
git commit -m "fix(api): generate invite tokens with crypto randomness"
```

---

### Task 6: JWT 발급 + 전역 JwtAuthGuard

**모델: sonnet**

**배경:** 로그인해도 토큰이 발급되지 않고, 모든 엔드포인트가 무인증으로 열려 있다. `@nestjs/jwt`는 이미 의존성에 있다. 이 태스크에서는 (1) 로그인 응답에 `accessToken` 추가, (2) 전역 `JwtAuthGuard` + `@Public()` 데코레이터 도입, (3) 테스트 부트스트랩을 토큰 기반으로 전환한다. **`x-crewith-role` 역할 검사는 Task 7에서 제거하므로 이 태스크에서는 그대로 둔다** (테스트는 두 헤더를 모두 보낸다).

**Files:**
- Create: `apps/api/src/auth/public.decorator.ts`
- Create: `apps/api/src/auth/jwt-auth.guard.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/app.controller.ts` (login/register 엔드포인트 + @Public 부착)
- Modify: `apps/api/src/mvp.store.ts` (AuthSessionResult 타입 추가)
- Modify: `apps/api/src/mvp.repository.ts` (abstract login 반환 타입)
- Test: `apps/api/test/endpoints.test.mjs`, `apps/api/test/mvp.test.mjs`

**Interfaces:**
- Consumes: Task 4의 로그인 플로우
- Produces:
  - `POST /auth/login` 응답 `data`에 `accessToken: string` 추가 (payload: `{ sub: memberId, phoneNumber }`, 만료 7d) — Task 8·9가 소비
  - `@Public()` 데코레이터 (`apps/api/src/auth/public.decorator.ts`) — Task 7이 소비
  - `AuthSessionResult` 인터페이스 (`mvp.store.ts`)
  - 테스트 헬퍼 `createOwnerSession(baseUrl, phone?)` → `{ token, memberId, clubId }` — Task 7 테스트가 소비

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/api/test/endpoints.test.mjs` — 파일 상단(다른 require보다 먼저, `process.env.CREWITH_DATA_FILE` 설정 옆)에:

```js
process.env.JWT_ACCESS_SECRET = "test-secret";
```

`bootstrapTestApp` 아래에 헬퍼 추가:

```js
async function createOwnerSession(baseUrl, phone = "010-9000-0001") {
  await fetch(`${baseUrl}/auth/register`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ name: "테스트오너", phoneNumber: phone, password: "pw-test-1234" }),
  });
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ phoneNumber: phone, password: "pw-test-1234" }),
  });
  const session = (await loginRes.json()).data;
  const clubRes = await fetch(`${baseUrl}/clubs`, {
    method: "POST",
    headers: { ...JSON_HEADERS, Authorization: `Bearer ${session.accessToken}` },
    body: JSON.stringify({ name: "테스트클럽", sportType: "러닝", ownerMemberId: session.memberId }),
  });
  const clubId = (await clubRes.json()).data.clubId;
  return { token: session.accessToken, memberId: session.memberId, clubId };
}
```

신규 subtest:

```js
  await t.test("login issues a JWT access token", async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ phoneNumber: "010-9000-0001", password: "pw-test-1234" }),
    });
    assert.equal(res.status, 201);
    const data = (await res.json()).data;
    assert.equal(typeof data.accessToken, "string");
    assert.equal(data.accessToken.split(".").length, 3, "JWT has 3 segments");
  });

  await t.test("protected endpoint without token returns 401", async () => {
    const res = await fetch(`${baseUrl}/clubs/${CLUB}/members`, {
      headers: OPERATOR,
    });
    assert.equal(res.status, 401);
  });
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -w @crewith/api`
Expected: FAIL — `accessToken`이 undefined, 무토큰 요청이 401이 아니라 200

- [ ] **Step 3: @Public 데코레이터 작성**

Create `apps/api/src/auth/public.decorator.ts`:

```ts
import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 4: JwtAuthGuard 작성**

Create `apps/api/src/auth/jwt-auth.guard.ts`:

```ts
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
```

- [ ] **Step 5: AppModule에 JwtModule + 전역 가드 등록**

`apps/api/src/app.module.ts` 전체를 다음으로 교체:

```ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { SentryGlobalFilter } from "@sentry/nestjs/setup";
import { AppController } from "./app.controller";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { MvpRepository } from "./mvp.repository";
import { PrismaRepository } from "./prisma.repository";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("JWT_ACCESS_SECRET");
        if (!secret) {
          throw new Error("JWT_ACCESS_SECRET is required");
        }
        return { secret, signOptions: { expiresIn: "7d" } };
      },
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    {
      provide: MvpRepository,
      useClass: PrismaRepository,
    },
  ],
})
export class AppModule {}
```

- [ ] **Step 6: AuthSessionResult 타입 정의 및 login 시그니처 지정**

`apps/api/src/mvp.store.ts`의 `RegisterInput` 인터페이스 근처에 추가:

```ts
export interface ClubMembershipSummaryItem {
  clubId: string;
  name: string;
  sportType: string;
  role: ClubRole;
  memberStatus: MemberStatus;
}

export interface AuthSessionResult {
  memberId: string;
  profile: MemberProfile;
  clubs: ClubMembershipSummaryItem[];
}
```

`apps/api/src/mvp.repository.ts:115`의 abstract 시그니처를:

```ts
  abstract login(input: AuthLoginInput): AuthSessionResult | Promise<AuthSessionResult>;
```

(import 목록에 `AuthSessionResult` 추가. `JsonMvpRepository.login`과 `PrismaRepository.login`의 기존 반환 구조는 이 타입과 이미 일치한다.)

- [ ] **Step 7: 컨트롤러 — 토큰 발급 및 @Public 부착**

`apps/api/src/app.controller.ts`:

1. import 추가: `import { JwtService } from "@nestjs/jwt";`, `import { Public } from "./auth/public.decorator";`
2. 생성자 교체:

```ts
  constructor(
    private readonly repository: MvpRepository,
    private readonly jwtService: JwtService,
  ) {}
```

3. login 교체:

```ts
  @Public()
  @Post("auth/login")
  async login(@Body() input: AuthLoginInput) {
    const session = await this.repository.login(input);
    const accessToken = await this.jwtService.signAsync({
      sub: session.memberId,
      phoneNumber: session.profile.phoneNumber,
    });
    return { data: { ...session, accessToken } };
  }
```

4. 다음 핸들러에 `@Public()` 부착 (라우트 데코레이터 바로 위): `health`, `register`, `selfResetPassword`, `createJoinRequest`, `acceptInvite`

- [ ] **Step 8: 기존 테스트를 토큰 기반으로 전환**

`apps/api/test/endpoints.test.mjs`:

1. 테스트 시작부에서 `const owner = await createOwnerSession(baseUrl);` 호출
2. `const CLUB = "club-seoul-runners";` → `const CLUB = owner.clubId;` (subtest들이 접근 가능한 위치로 이동)
3. `const OPERATOR = { "x-crewith-role": "operator" };` →

```js
  const OPERATOR = {
    Authorization: `Bearer ${owner.token}`,
    "x-crewith-role": "operator", // Task 7에서 제거 예정
  };
```

4. "operator 역할 없이 호출하면 403" 테스트는 **Authorization은 보내되 역할 헤더만 빼고** 403을 기대하도록 수정:

```js
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${owner.token}` },
```

`apps/api/test/mvp.test.mjs`도 동일 패턴 적용: `process.env.JWT_ACCESS_SECRET = "test-secret";` 추가, `createOwnerSession` 헬퍼 복제, 요청 헤더에 Bearer 토큰 추가. (store를 직접 조작하는 부분은 그대로 둔다. `@Public` 경로 — register/login/invite accept/join request — 는 토큰 불필요.)

- [ ] **Step 9: 테스트 통과 확인**

Run: `npm run test -w @crewith/api`
Expected: PASS 전부

Run: `npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 10: 커밋**

```bash
git add apps/api
git commit -m "feat(api): issue JWT on login and enforce bearer auth globally"
```

---

### Task 7: ClubRolesGuard 도입 + x-crewith-role 신뢰 제거 + 본인 확인

**모델: sonnet**

**배경:** 운영진 권한이 클라이언트가 보내는 `x-crewith-role` 헤더로 결정된다 — 위조 자유. JWT의 `sub`(회원 ID)로 클럽 내 실제 역할을 DB에서 조회해 판정한다. 아울러 회원 본인 데이터 엔드포인트에 본인 확인을 추가하고, 역할 검사가 아예 없던 `GET /clubs/:clubId/reminders`도 운영진 전용으로 막는다.

**Files:**
- Create: `apps/api/src/auth/require-club-role.decorator.ts`
- Create: `apps/api/src/auth/club-roles.guard.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/app.controller.ts` (전면)
- Modify: `apps/api/src/mvp.repository.ts` (abstract + Json 구현)
- Modify: `apps/api/src/prisma.repository.ts`
- Modify: `docs/API_SPEC.md` (인증 방식 서술 갱신)
- Test: `apps/api/test/endpoints.test.mjs`, `apps/api/test/mvp.test.mjs`

**Interfaces:**
- Consumes: Task 6의 `@Public()`, `JwtAuthGuard`(request.user 주입), `createOwnerSession` 테스트 헬퍼, `CurrentUserPayload`(기존 `auth/current-user.ts`)
- Produces:
  - `@RequireClubRole()` 데코레이터 — `:clubId` 파라미터 라우트에서 owner/operator 요구
  - `MvpRepository.getClubRole(clubId: string, memberId: string): ClubRole | null | Promise<ClubRole | null>`
  - API는 더 이상 `x-crewith-role`을 읽지 않음 (Task 8이 이 계약을 소비)

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/api/test/endpoints.test.mjs`에 subtest 추가:

```js
  // ───────────────────────── [권한] ─────────────────────────

  await t.test("forged x-crewith-role header no longer grants operator access", async () => {
    // 클럽 소속이 없는 신규 사용자
    await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name: "외부인", phoneNumber: "010-8888-0001", password: "pw-outsider" }),
    });
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ phoneNumber: "010-8888-0001", password: "pw-outsider" }),
    });
    const outsider = (await loginRes.json()).data;

    const res = await fetch(`${baseUrl}/clubs/${CLUB}/members`, {
      headers: {
        Authorization: `Bearer ${outsider.accessToken}`,
        "x-crewith-role": "owner", // 위조 시도
      },
    });
    assert.equal(res.status, 403);
  });

  await t.test("member cannot read another member's profile", async () => {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ phoneNumber: "010-8888-0001", password: "pw-outsider" }),
    });
    const outsider = (await loginRes.json()).data;

    const res = await fetch(`${baseUrl}/members/${member.id}/profile`, {
      headers: { Authorization: `Bearer ${outsider.accessToken}` },
    });
    assert.equal(res.status, 403);
  });
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm run test -w @crewith/api`
Expected: FAIL — 위조 헤더로 200, 타인 프로필 200

- [ ] **Step 3: 데코레이터 + 가드 작성**

Create `apps/api/src/auth/require-club-role.decorator.ts`:

```ts
import { SetMetadata } from "@nestjs/common";

export const REQUIRE_CLUB_ROLE_KEY = "requireClubRole";

export const RequireClubRole = () => SetMetadata(REQUIRE_CLUB_ROLE_KEY, true);
```

Create `apps/api/src/auth/club-roles.guard.ts`:

```ts
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
```

- [ ] **Step 4: getClubRole 저장소 메서드 구현**

`apps/api/src/mvp.repository.ts` — abstract 클래스에 추가:

```ts
  abstract getClubRole(clubId: string, memberId: string): ClubRole | null | Promise<ClubRole | null>;
```

(`ClubRole`을 `./mvp.store` import 목록에 추가)

`JsonMvpRepository`에 구현 추가 (`clubMemberships`, `members`, `club`은 이미 import된 스토어 심볼):

```ts
  getClubRole(clubId: string, memberId: string): ClubRole | null {
    const membership = clubMemberships.find(
      (item) => item.clubId === clubId && item.memberId === memberId && item.memberStatus !== "removed",
    );

    if (membership) {
      return membership.role;
    }

    // Legacy fallback: members created directly in the seeded club carry
    // their role on the member record without a membership row.
    if (clubId === club.id) {
      const member = members.find((m) => m.id === memberId && m.memberStatus !== "removed");
      return member?.role ?? null;
    }

    return null;
  }
```

`apps/api/src/prisma.repository.ts`의 `PrismaRepository`에 구현 추가:

```ts
  async getClubRole(clubId: string, memberId: string) {
    const membership = await this.prisma.clubMember.findFirst({
      where: { clubId, userId: memberId, memberStatus: { not: "removed" } },
    });

    return (membership?.role as ClubRole | undefined) ?? null;
  }
```

- [ ] **Step 5: AppModule에 가드 등록 (JwtAuthGuard 다음 순서)**

`apps/api/src/app.module.ts` providers에 추가 — **반드시 JwtAuthGuard 등록 줄 아래에** (APP_GUARD는 등록 순서대로 실행됨):

```ts
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ClubRolesGuard },
```

(import: `import { ClubRolesGuard } from "./auth/club-roles.guard";`)

- [ ] **Step 6: 컨트롤러 전면 수정**

`apps/api/src/app.controller.ts`:

1. `assertOperatorRole` 함수(49–53행) 삭제, `ForbiddenException`은 아래 `assertSelf`가 사용하므로 import 유지, `Headers` import 삭제
2. import 추가: `import { RequireClubRole } from "./auth/require-club-role.decorator";`, `import { CurrentUser, type CurrentUserPayload } from "./auth/current-user";`
3. 파일 상단(컨트롤러 클래스 밖)에 본인 확인 헬퍼 추가:

```ts
function assertSelf(user: CurrentUserPayload | undefined, memberId: string | undefined) {
  if (!user || !memberId || user.sub !== memberId) {
    throw new ForbiddenException("본인 계정으로만 접근할 수 있습니다.");
  }
}
```

4. **운영진 엔드포인트**: `@Headers("x-crewith-role") role` 파라미터와 `assertOperatorRole(role);` 호출을 전부 제거하고, 각 핸들러에 `@RequireClubRole()`을 부착한다. 대상 (기존에 assertOperatorRole을 쓰던 전부 + reminders 조회):
   `getAdminOverview`, `getFeeSettings`, `updateFeeSettings`, `getNotificationSettings`, `updateNotificationSettings`, `getPrivacySettings`, `updatePrivacySettings`, `sendReminder`, **`getReminderTargets`(기존 무검사 — 신규 부착)**, `getMembers`, `getJoinRequests`, `reviewJoinRequest`, `getInviteLinks`, `createInviteLink`, `disableInviteLink`, `createMember`, `importMembers`, `updateMember`, `updateMemberFeeStatus`, `resetMemberPassword`, `removeMember`, `getFees`, `createFee`, `updateFeePayment`, `updateEventAttendance`, `getEvents`, `createEvent`, `updateEvent`, `deleteEvent`, `getNotices`, `createNotice`, `updateNotice`, `deleteNotice`

   변경 예시 (`getAdminOverview`):

```ts
  @RequireClubRole()
  @Get("clubs/:clubId/admin/overview")
  getAdminOverview(@Param("clubId") clubId: string) {
    return { data: this.repository.getAdminOverview(clubId) };
  }
```

5. **본인 데이터 엔드포인트**: `@CurrentUser() user: CurrentUserPayload | undefined` 파라미터를 추가하고 핸들러 첫 줄에서 `assertSelf` 호출.
   - 경로/쿼리의 memberId 대상: `getMemberProfile`, `updateMemberProfile`, `getMemberAppOverview`, `getMemberDirectory`, `getMemberNotifications`, `markMemberNotificationRead`
   - body의 memberId 대상 (`assertSelf(user, input.memberId)`): `registerDevice`, `updateEventResponse`, `markNoticeRead`, `toggleNoticeReaction`, `createNoticeComment`

   변경 예시 (`getMemberProfile`):

```ts
  @Get("members/:memberId/profile")
  getMemberProfile(
    @Param("memberId") memberId: string,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    assertSelf(user, memberId);
    return { data: this.repository.getMemberProfile(memberId) };
  }
```

6. **createClub**: 소유자를 토큰에서 결정 (body의 ownerMemberId는 검증용으로만):

```ts
  @Post("clubs")
  createClub(
    @Body() input: CreateClubInput,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ) {
    if (!user) {
      throw new ForbiddenException("본인 계정으로만 접근할 수 있습니다.");
    }
    if (input.ownerMemberId && input.ownerMemberId !== user.sub) {
      throw new ForbiddenException("본인 계정으로만 모임을 만들 수 있습니다.");
    }
    return { data: this.repository.createClub({ ...input, ownerMemberId: user.sub }) };
  }
```

   `mvp.store.ts`의 `CreateClubInput.ownerMemberId`를 optional로: `ownerMemberId?: string;` — 저장소 구현 2곳은 다음과 같이 명시적으로 검증한다.

   `mvp.repository.ts` createClub(241행 부근):

```ts
    if (!input.ownerMemberId) {
      throw new BadRequestException("모임 생성자 정보가 없습니다.");
    }
    const owner = findMember(input.ownerMemberId);
```

   `prisma.repository.ts` createClub(351행 부근):

```ts
    if (!input.ownerMemberId) {
      throw new BadRequestException("모임 생성자 정보가 없습니다.");
    }
    const owner = await this.prisma.user.findUnique({
      where: { id: input.ownerMemberId },
    });
```
7. `createFeedback`은 memberId가 optional이므로 그대로 둔다 (인증만 요구)

- [ ] **Step 7: 테스트에서 x-crewith-role 완전 제거**

`endpoints.test.mjs`·`mvp.test.mjs`에서:
1. `OPERATOR` 상수에서 `"x-crewith-role"` 키 제거 → `{ Authorization: \`Bearer ${owner.token}\` }`
2. Task 6에서 수정했던 "역할 헤더 없이 403" 테스트를 "비운영진 토큰으로 403"으로 대체 (Step 1의 위조 테스트가 이미 커버 — 중복되면 기존 것을 삭제)
3. 본인 확인 도입으로 member-app/profile 관련 기존 테스트가 있다면, 해당 memberId 사용자로 로그인한 토큰을 보내도록 수정 (관리자가 `createMember`로 만든 회원은 생성 시 지정한 password로 로그인 가능)

- [ ] **Step 8: 테스트 통과 확인**

Run: `npm run test -w @crewith/api`
Expected: PASS 전부

Run: `npm run typecheck && npm run lint`
Expected: PASS

- [ ] **Step 9: API_SPEC 갱신**

`docs/API_SPEC.md`의 인증 서술을 갱신: 모든 비공개 엔드포인트는 `Authorization: Bearer <accessToken>` 필수(401), 운영진 엔드포인트는 클럽 내 역할 owner/operator 필요(403), `x-crewith-role` 헤더 폐기. 공개 엔드포인트 목록: `GET /health`, `POST /auth/login`, `POST /auth/register`, `POST /auth/reset-password`, `POST /clubs/:clubId/join-requests`, `POST /clubs/:clubId/invite-links/:token/accept`.

- [ ] **Step 10: 커밋**

```bash
git add apps/api docs/API_SPEC.md
git commit -m "feat(api): enforce club roles from JWT and drop client-supplied role header"
```

---

### Task 8: admin-web Authorization 헤더 연동

**모델: sonnet**

**배경:** admin-web server action들이 `x-crewith-role: owner`를 하드코딩해 보낸다 (`apps/admin-web/app/admin.tsx:15-16`). 로그인 시 받은 `accessToken`을 세션 쿠키에 저장하고 모든 API 호출을 Bearer 헤더로 전환한다.

**Files:**
- Modify: `apps/admin-web/app/login/page.tsx`
- Modify: `apps/admin-web/app/admin.tsx`

**Interfaces:**
- Consumes: Task 6의 로그인 응답 `accessToken`, Task 7의 Bearer 전용 API 계약
- Produces: 세션 쿠키 `crewith-admin-session`에 `accessToken` 필드 추가

- [ ] **Step 1: 로그인 액션에서 accessToken 저장**

`apps/admin-web/app/login/page.tsx`의 `session` 객체에 필드 추가:

```ts
  const session = {
    memberId: result.data!.memberId as string,
    accessToken: result.data!.accessToken as string,
    clubs: adminClubs,
    activeClubId: adminClubs[0]?.clubId ?? "",
  };
```

- [ ] **Step 2: admin.tsx 세션 타입·헤더 헬퍼 교체**

`apps/admin-web/app/admin.tsx`:

1. 15–16행의 `adminRoleHeaders`·`adminJsonHeaders` 상수 삭제, 대신:

```ts
interface AdminSession {
  memberId: string;
  accessToken: string;
  clubs: Array<{ clubId: string; name: string; sportType: string; role: string }>;
  activeClubId: string;
}

async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(adminSessionCookieName)?.value;
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AdminSession;
    if (!session.memberId || !session.accessToken || !Array.isArray(session.clubs)) return null;
    return session;
  } catch {
    return null;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  return { Authorization: `Bearer ${session.accessToken}` };
}

async function jsonAuthHeaders(): Promise<Record<string, string>> {
  return { "Content-Type": "application/json", ...(await authHeaders()) };
}
```

(기존 `AdminSession` 인터페이스와 `getAdminSession`을 위 내용으로 교체 — `accessToken` 검증이 추가돼 구버전 쿠키는 자동으로 재로그인 유도)

2. 파일 전체에서 치환 (전부 async 함수 내부이므로 await 가능):
   - `headers: adminJsonHeaders` → `headers: await jsonAuthHeaders()`
   - `headers: adminRoleHeaders` → `headers: await authHeaders()`
   - 스프레드 사용부 `...adminRoleHeaders` / `...adminJsonHeaders` → `...(await authHeaders())` / `...(await jsonAuthHeaders())`

3. `getOverview`에서 401 시 재로그인 유도:

```ts
    if (response.status === 401) {
      redirect("/login");
    }
    if (!response.ok) {
      return { overview: fallbackOverview, authorized: false };
    }
```

- [ ] **Step 3: 잔여 참조 확인**

Run: `grep -rn "x-crewith-role\|adminRoleHeaders\|adminJsonHeaders" apps/admin-web`
Expected: 결과 없음

- [ ] **Step 4: 빌드 검증**

Run: `npm run typecheck -w @crewith/admin-web && npm run build -w @crewith/admin-web`
Expected: PASS

- [ ] **Step 5: E2E 스모크 (수동 실행 가능 시)**

```bash
npm run dev:api   # 터미널 1 — JWT_ACCESS_SECRET을 .env에 설정해야 기동됨
npm run dev:admin # 터미널 2
```

브라우저에서 `http://localhost:3000/login` → 등록된 owner 계정으로 로그인 → 대시보드에 실제 데이터 렌더링(fallback "club-unknown" 아님) 확인. DB 미기동 등으로 불가능하면 그 사실을 결과 보고에 명시.

- [ ] **Step 6: 커밋**

```bash
git add apps/admin-web
git commit -m "feat(admin-web): authenticate API calls with bearer token from session"
```

---

### Task 9: mobile-app Authorization 헤더 연동

**모델: sonnet**

**배경:** Flutter 클라이언트가 로그인 후 토큰을 저장하지 않고, 모든 요청이 무인증이다. Task 7 이후 회원용 엔드포인트도 Bearer 토큰과 본인 확인을 요구한다.

**Files:**
- Modify: `apps/mobile-app/lib/member_models.dart` (AuthSession)
- Modify: `apps/mobile-app/lib/member_api_client.dart`
- Modify: `apps/mobile-app/lib/main.dart` (클라이언트 생성부가 `const`면 제거)

**Interfaces:**
- Consumes: Task 6의 로그인 응답 `accessToken`
- Produces: `MemberApiClient.accessToken` (mutable), 로그인 성공 시 자동 설정

- [ ] **Step 1: AuthSession에 accessToken 추가**

`apps/mobile-app/lib/member_models.dart`의 `AuthSession`을 교체:

```dart
class AuthSession {
  const AuthSession({
    required this.memberId,
    required this.accessToken,
    required this.clubs,
  });

  final String memberId;
  final String accessToken;
  final List<ClubSummary> clubs;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      memberId: json['memberId'] as String,
      accessToken: json['accessToken'] as String? ?? '',
      clubs: (json['clubs'] as List<dynamic>? ?? [])
          .map((item) => ClubSummary.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}
```

- [ ] **Step 2: MemberApiClient에 토큰 보관·주입 추가**

`apps/mobile-app/lib/member_api_client.dart`:

1. 클래스 선언을 non-const로 바꾸고 토큰 필드·헬퍼 추가:

```dart
class MemberApiClient {
  MemberApiClient({
    this.apiBaseUrl = _defaultApiBaseUrl,
  });

  final String apiBaseUrl;

  String? accessToken;

  void _applyAuth(HttpClientRequest request) {
    final token = accessToken;
    if (token != null && token.isNotEmpty) {
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
    }
  }
```

2. **모든** 요청 생성 직후(`client.getUrl(...)`/`postUrl`/`patchUrl` 등으로 `request`를 얻은 다음 줄)에 `_applyAuth(request);` 호출을 추가한다. 파일 내 요청을 만드는 모든 메서드가 대상이며(`login`·`register`·`resetPassword` 같은 public 엔드포인트 포함 — 토큰이 없으면 no-op이므로 무해), 공용 헬퍼(`_sendJson` 등)가 있으면 그 안에 한 번만 넣는다.
3. `login` 성공 시 토큰 저장:

```dart
        final session = AuthSession.fromJson(json['data'] as Map<String, dynamic>);
        accessToken = session.accessToken;
        return session;
```

- [ ] **Step 3: main.dart의 const 생성 제거**

`apps/mobile-app/lib/main.dart`에서 `MemberApiClient` 인스턴스 생성부를 찾아 (`grep -n "MemberApiClient(" apps/mobile-app/lib/main.dart`) `const MemberApiClient()`로 되어 있으면 `MemberApiClient()`로 변경. 로그아웃 처리부가 있으면 `_api.accessToken = null;` 추가.

- [ ] **Step 4: 정적 분석·테스트 검증**

Run: `cd apps/mobile-app && flutter analyze`
Expected: 오류 0건 (기존 info 10건 수준은 허용)

Run: `cd apps/mobile-app && flutter test`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/mobile-app
git commit -m "feat(mobile): store JWT from login and send bearer auth on API calls"
```

---

## 최종 검증 (오케스트레이터 수행)

- [ ] `npm run typecheck && npm run build && npm run test && npm run lint` 전부 PASS
- [ ] `cd apps/mobile-app && flutter analyze && flutter test` PASS
- [ ] `grep -rn "x-crewith-role" apps/ --include="*.ts" --include="*.tsx" --include="*.dart"` → 결과 없음
- [ ] `npm audit --audit-level=high` → high 0건
- [ ] 교차 리뷰: superpowers:requesting-code-review 또는 codex:rescue로 전체 diff 리뷰 (ai-roles 교차 리뷰 원칙)
- [ ] **배포 전 확인**: Railway API 환경변수에 `JWT_ACCESS_SECRET` 설정 (미설정 시 부팅 실패하도록 설계됨), Vercel admin-web과 API를 같은 릴리즈로 배포

## 범위 밖 (후속 과제)

- 초기 비밀번호(전화번호 뒤 4자리) 강제 변경 플로우 — 모바일 UX 설계 필요
- Refresh token / 토큰 만료 UX (현재 7d 고정)
- 모바일 앱 토큰 영속화(secure storage) — 현재는 앱 재시작 시 재로그인
- `prisma.repository.ts`(2,005줄) 도메인별 모듈 분리
- 파일 스토어(`JsonMvpRepository`)와 Prisma 구현의 로직 중복 해소
- CORS `origin: true` 기본값 — 프로덕션 `ADMIN_WEB_ORIGIN` 설정 운영 체크리스트화
