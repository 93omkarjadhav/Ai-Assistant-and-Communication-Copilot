import { groq } from "@ai-sdk/groq";
import { Agent } from "@convex-dev/agent";
import { tool } from "ai";
import { z } from "zod";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { action, query } from "./_generated/server"; // ✅ Import query

// System prompt that defines the AI assistant's behavior
const systemPrompt = `You are an expert AI assistant for Omkar. These tasks include writing emails, messages, social media posts, and blog posts.`;

// Setup the Tools that the AI assistant can use
const tools = {
  analyzeMessage: tool({
    description: `Analyze the given message and provide improvements in the following areas:
1. Formatting: Improve the message structure and formatting
2. Tone: Suggest appropriate tone adjustments
3. Clarity: Identify and fix clarity issues
4. Grammar: Point out any grammar issues and re-write the message based on these criteria and share it with me. Make sure to follow the tone and format of the message.`,
    parameters: z.object({
      formatted: z.string(),
      tone: z.string(),
      clarity: z.string(),
      grammarIssues: z.string(),
      rewrittenMessage: z.string(),
      type: z.literal("analyze"),
    }),
    execute: async (args) => {
      return args;
    },
  }),
  writeEmail: tool({
    description: `Write an email to the given recipient with the given subject and body. Make sure to follow a friendly and professional tone. Don't use -- in the email and avoid using complex words.`,
    parameters: z.object({
      recipient: z.string(),
      subject: z.string(),
      body: z.string(),
      type: z.literal("email"),
    }),
    execute: async (args) => {
      return args;
    },
  }),
};

// Define an agent
const aiAgentAssistant = new Agent(components.agent, {
  chat: groq("llama3-8b-8192"),
  instructions: systemPrompt,
  tools,
});

// ✅ Mutation to handle assistant conversation
export const createAgentAssistantThread = action({
  args: {
    prompt: v.string(),
    userId: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let thread;
    let threadId = args.threadId;

    if (!threadId) {
      const result = await aiAgentAssistant.createThread(ctx, {
        userId: args.userId,
      });
      thread = result.thread;
      threadId = result.threadId;
    } else {
      const result = await aiAgentAssistant.continueThread(ctx, {
        threadId: threadId,
        userId: args.userId,
      });
      thread = result.thread;
    }

    const result = await thread?.generateText({
      prompt: args.prompt,
    });

    return {
      threadId,
      text: result?.text,
      toolResults: result?.toolResults?.[0]?.result,
    };
  },
});

// ✅ Query to get all threads for a user
export const getThreadsByUserId = query({
  args: {
    userId: v.string(),
    paginationOpts: v.optional(v.any()), // optional pagination
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("threads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
