import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export async function startFixtureApi(port = 0) {
  const directory = mkdtempSync(join(tmpdir(), "crewith-http-integration-"));
  process.env.CREWITH_DATA_FILE = join(directory, "store.json");
  process.env.JWT_ACCESS_SECRET = randomBytes(32).toString("hex");
  process.env.SENTRY_DSN = "";
  let app;
  try {
    require("reflect-metadata");
    const { AppModule } = require("../dist/app.module.js");
    const { MvpRepository, JsonMvpRepository } = require("../dist/mvp.repository.js");
    const { PrismaService } = require("../dist/prisma/prisma.service.js");
    const { Test } = require("@nestjs/testing");
    const { ValidationPipe } = require("@nestjs/common");
    const { JwtService } = require("@nestjs/jwt");
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue({})
      .overrideProvider(MvpRepository).useClass(JsonMvpRepository)
      .compile();
    app = module.createNestApplication({ logger: false });
    app.setGlobalPrefix("api/v1");
    app.enableCors({ origin: "http://localhost:4311", credentials: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.listen(port, "127.0.0.1");
    const baseUrl = `http://127.0.0.1:${app.getHttpServer().address().port}/api/v1`;
    const request = async (path, { method = "GET", token, body, headers = {} } = {}) => {
      const response = await fetch(baseUrl + path, {
        method,
        signal: AbortSignal.timeout(10000),
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, body: await response.json() };
    };
    const login = async (phoneNumber, password) => {
      const response = await request("/auth/login", { method: "POST", body: { phoneNumber, password } });
      assert.equal(response.status, 201, "Fixture login succeeds");
      return response.body.data;
    };
    const register = async (phoneNumber, name) => {
      const response = await request("/auth/register", {
        method: "POST", body: { phoneNumber, name, password: "fixture-only-password" },
      });
      assert.equal(response.status, 201, "Fixture registration succeeds");
      return login(phoneNumber, "fixture-only-password");
    };
    const owner = await register("010-9900-0001", "통합 모임장");
    const outsider = await register("010-9900-0004", "통합 외부인");
    const club = await request("/clubs", {
      method: "POST", token: owner.accessToken,
      body: { name: "통합 검증 모임", sportType: "러닝", ownerMemberId: owner.memberId },
    });
    assert.equal(club.status, 201);
    const clubId = club.body.data.clubId;
    const sessions = { owner, outsider };
    for (const [role, phoneNumber] of [["operator", "010-9900-0002"], ["member", "010-9900-0003"]]) {
      const member = await request(`/clubs/${clubId}/members`, {
        method: "POST", token: owner.accessToken,
        body: { name: `통합 ${role}`, phoneNumber, role, password: "fixture-only-password" },
      });
      assert.equal(member.status, 201);
      sessions[role] = await login(phoneNumber, "fixture-only-password");
    }
    return {
      app, baseUrl, clubId, sessions, request, login,
      storePath: process.env.CREWITH_DATA_FILE,
      expiredToken: () => app.get(JwtService).sign({ sub: owner.memberId }, { expiresIn: -1 }),
      close: async () => { await app.close(); rmSync(directory, { recursive: true, force: true }); },
    };
  } catch (error) {
    if (app) await app.close();
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}
