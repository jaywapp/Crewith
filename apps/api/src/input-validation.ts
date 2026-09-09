import { BadRequestException, Logger } from "@nestjs/common";

const logger = new Logger("InputValidation");

function reject(operation: string, field: string): never {
  logger.warn({ operation, field, reason: "invalid_input" });
  throw new BadRequestException(`Invalid ${field}`);
}

export function requireTextFields(input: unknown, fields: readonly string[], operation: string): void {
  if (!input || typeof input !== "object" || Array.isArray(input)) reject(operation, "body");
  const body = input as Record<string, unknown>;
  for (const field of fields) {
    if (typeof body[field] !== "string" || !(body[field] as string).trim()) reject(operation, field);
  }
}

export function requireEnumField(input: unknown, field: string, values: readonly string[], operation: string): void {
  requireTextFields(input, [field], operation);
  if (!values.includes((input as Record<string, string>)[field])) reject(operation, field);
}
