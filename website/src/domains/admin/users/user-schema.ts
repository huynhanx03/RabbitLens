import * as z from "zod";

export const userSchema = z.object({
  name: z.string(),
  password_hash: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]).transform(val => {
    if (typeof val === "string") {
      return val.split(",").map(t => t.trim()).filter(t => t.length > 0);
    }
    return val;
  }).optional(),
  limits: z.record(z.string(), z.number()).optional(),
}).catchall(z.unknown());

export type UserResponse = z.infer<typeof userSchema>;

export const userBodySchema = z.object({
  password: z.string().optional(),
  tags: z.string().optional(), // API expects tags as comma separated string
});

export type UserBody = z.infer<typeof userBodySchema>;

export const permissionSchema = z.object({
  user: z.string(),
  vhost: z.string(),
  configure: z.string(),
  write: z.string(),
  read: z.string(),
});

export type PermissionResponse = z.infer<typeof permissionSchema>;

export const permissionBodySchema = z.object({
  configure: z.string(),
  write: z.string(),
  read: z.string(),
});

export type PermissionBody = z.infer<typeof permissionBodySchema>;

export const topicPermissionSchema = z.object({
  user: z.string(),
  vhost: z.string(),
  exchange: z.string(),
  write: z.string(),
  read: z.string(),
});

export type TopicPermissionResponse = z.infer<typeof topicPermissionSchema>;

export const topicPermissionBodySchema = z.object({
  exchange: z.string(),
  write: z.string(),
  read: z.string(),
});

export type TopicPermissionBody = z.infer<typeof topicPermissionBodySchema>;
