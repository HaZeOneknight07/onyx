import type { ZodSchema } from "zod";
import { ValidationError } from "./errors";

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join(", ");
    throw new ValidationError(message);
  }
  return result.data;
}
