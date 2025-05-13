import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

// Define types for request data
type RequestData = {
  message: string;
};

type TextResponse = {
  formatted: string;
  tone: string;
  clarity: string;
  grammarIssues: string;
};

type ClaudeContent = {
  formatted?: string;
  tone?: string;
  clarity?: string;
  grammarIssues?: string;
};

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Define the available tools using Anthropic's Tool type
const tools: Tool[] = [
  {
    name: "analyzeMessage",
    description: `Analyze the given message and provide improvements in the following areas:
1. Formatting: Improve the message structure and formatting
2. Tone: Suggest appropriate tone adjustments
3. Clarity: Identify and fix clarity issues
4. Grammar: Point out any grammar issues

Provide your analysis in JSON format with these exact keys:
{
  "formatted": "formatted message here",
  "tone": "tone analysis here",
  "clarity": "clarity improvements here",
  "grammarIssues": "grammar issues here"
}`,
    input_schema: {
      type: "object",
      properties: {
        formatted: { type: "string", description: "Formatted message" },
        tone: { type: "string", description: "Tone analysis" },
        clarity: { type: "string", description: "Clarity improvements" },
        grammarIssues: { type: "string", description: "Grammar issues" },
      },
      required: ["formatted", "tone", "clarity", "grammarIssues"],
    },
  },
  {
    name: "writeEmail",
    description: `Write an email to the given recipient with the given subject and body. Make sure to follow a friendly and professional tone. Don't use -- in the email and avoid using complex words.`,
    input_schema: {
      type: "object",
      properties: {
        recipient: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Subject of the email" },
        body: { type: "string", description: "Body of the email" },
      },
      required: ["recipient", "subject", "body"],
    },
  },
  {
    name: "writeSocialMediaPost",
    description: `Write a social media post for X, LinkedIn, and BlueSky. Make sure to follow the algorithm rules for each platform. Don't sound cringey.`,
    input_schema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          description: "Platform to write the post for (X, LinkedIn, or BlueSky)",
          enum: ["X", "LinkedIn", "BlueSky"],
        },
        message: { type: "string", description: "Message" },
      },
      required: ["platform", "message"],
    },
  },
];

// System prompt
const systemPrompt = `You are an expert AI assistant for Omkar. Your goal is to help him complete his tasks. These tasks include writing emails, messages, social media posts, and blog posts.

When using the analyzeMessage tool, you MUST provide all required fields:
- formatted: The improved version of the message
- tone: Analysis of the message's tone and suggestions for improvement
- clarity: Specific clarity improvements
- grammarIssues: Any grammar issues found and their corrections

Do not skip any of these fields when using the analyzeMessage tool.`;

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as Partial<RequestData>;

    if (!data.message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("Missing Anthropic API key");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const response = await anthropicClient.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: data.message }],
      tools,
    });

    console.log("content", response.content);

    if (!response.content || typeof response.content !== "object") {
      return NextResponse.json({ error: "Empty or invalid response from Claude" }, { status: 500 });
    }

    const content = response.content as ClaudeContent;

    const textResponse: TextResponse = {
      formatted: content.formatted || "",
      tone: content.tone || "",
      clarity: content.clarity || "",
      grammarIssues: content.grammarIssues || "",
    };

    return NextResponse.json(textResponse);
  } catch (error: unknown) {
    console.error("Error processing request:", error);

    let statusCode = 500;
    let errorMessage = "Internal server error";

    if (error instanceof Error && typeof error.message === "string") {
      if (error.message.includes("rate limit")) {
        statusCode = 429;
        errorMessage = "Rate limit exceeded";
      } else if (error.message.includes("unauthorized")) {
        statusCode = 401;
        errorMessage = "Authentication error";
      } else if (error.message.includes("invalid request")) {
        statusCode = 400;
        errorMessage = "Invalid request";
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode }
    );
  }
}
