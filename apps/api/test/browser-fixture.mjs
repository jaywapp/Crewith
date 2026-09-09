import { startFixtureApi } from "./integration-harness.mjs";

const fixture = await startFixtureApi(4310);
console.log("Fixture API ready at http://127.0.0.1:4310/api/v1 (temporary JSON, no database)");
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await fixture.close();
  process.exit(0);
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
process.stdin.resume();
process.stdin.on("data", (input) => {
  if (input.toString().trim() === "stop") void close();
});
