import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  threads: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("archived")),
  }).index("by_user", ["userId"]),
});
