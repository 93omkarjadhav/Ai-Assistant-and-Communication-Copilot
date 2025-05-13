// convex/convex.config.ts
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config"; // Import the agent

const app = defineApp();

app.use(agent); // Add the agent to handle the assistant functionality

// Export the app for deployment
export default app;
