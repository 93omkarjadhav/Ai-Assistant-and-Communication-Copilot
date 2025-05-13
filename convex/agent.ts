import { groq } from "@ai-sdk/groq";
import { Agent } from "@convex-dev/agent";
import { tool } from "ai";
import { z } from "zod";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { action, query } from "./_generated/server";


// System prompt
const systemPrompt = `You are an expert AI assistant for Omkar. These tasks include writing emails, messages, social media posts, and blog posts.`;

// Tools
const tools = {
  analyzeMessage: tool({
    description: `Analyze a message and improve formatting, tone, clarity, and grammar.`,
    parameters: z.object({
      formatted: z.string(),
      tone: z.string(),
      clarity: z.string(),
      grammarIssues: z.string(),
      rewrittenMessage: z.string(),
      type: z.literal("analyze"),
    }),
    execute: async (args) => args,
  }),
  writeEmail: tool({
    description: `Write an email in a friendly and professional tone.`,
    parameters: z.object({
      recipient: z.string(),
      subject: z.string(),
      body: z.string(),
      type: z.literal("email"),
    }),
    execute: async (args) => args,
  }),
};

// Agent instance
const aiAgentAssistant = new Agent(components.agent, {
  chat: groq("llama3-8b-8192"),
  instructions: systemPrompt,
  tools,
});

// Create or continue a thread
export const createAgentAssistantThread = action({
  args: {
    prompt: v.string(),
    userId: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let threadId = args.threadId;
    let thread;

    if (!threadId) {
      const result = await aiAgentAssistant.createThread(ctx, {
        userId: args.userId,
      });
      thread = result.thread;
      threadId = result.threadId;
    } else {
      const result = await aiAgentAssistant.continueThread(ctx, {
        threadId,
        userId: args.userId,
      });
      thread = result.thread;
    }

    const result = await thread?.generateText({ prompt: args.prompt });

    return {
      threadId,
      text: result?.text,
      toolResults: result?.toolResults?.[0]?.result,
    };
  },
});

// Get threads by user
export const getThreadsByUserId = query({
  args: {
    userId: v.string(),
    paginationOpts: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("threads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
