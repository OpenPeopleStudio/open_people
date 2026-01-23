#!/usr/bin/env node

import { startJobProcessing, stopJobProcessing } from "@/lib/jobs/processor";

startJobProcessing();

const shutdown = (signal: string) => {
  console.log(`[jobs-worker] Received ${signal}, shutting down...`);
  stopJobProcessing();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
