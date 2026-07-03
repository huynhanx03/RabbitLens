import { z } from "zod";

export const limitValuesSchema = z.record(z.string(), z.number());

export const vhostLimitSchema = z
  .object({
    vhost: z.string(),
    value: limitValuesSchema,
  })
  .passthrough();

export const userLimitSchema = z
  .object({
    user: z.string(),
    value: limitValuesSchema,
  })
  .passthrough();

export const limitBodySchema = z.object({ value: z.number().int() });

export type VhostLimit = z.infer<typeof vhostLimitSchema>;
export type UserLimit = z.infer<typeof userLimitSchema>;
export type LimitBody = z.infer<typeof limitBodySchema>;
export type LimitScope = "vhost" | "user";

export type LimitRow = {
  scope: LimitScope;
  owner: string;
  name: string;
  value: number;
};

export function flattenLimits(
  scope: LimitScope,
  limits: Array<VhostLimit | UserLimit>,
): LimitRow[] {
  return limits.flatMap((limit) => {
    const owner =
      scope === "vhost"
        ? (limit as VhostLimit).vhost
        : (limit as UserLimit).user;
    return Object.entries(limit.value).map(([name, value]) => ({
      scope,
      owner,
      name,
      value,
    }));
  });
}
