import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { createOpenApiExpressMiddleware } from "trpc-openapi";

import { appRouter, createTRPCContext, metricsHandler } from "@blobscan/api";
import {
  setUpPropagationWorkers,
  tearDownBlobPropagationWorkers,
} from "@blobscan/blob-propagator";
import { logger } from "@blobscan/logger";
import { collectDefaultMetrics } from "@blobscan/open-telemetry";

import { env } from "./env";
import { morganMiddleware } from "./middlewares/morgan";
import { openApiDocument } from "./openapi";

collectDefaultMetrics();

const app = express();

setUpPropagationWorkers();

app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(morganMiddleware);

// eslint-disable-next-line @typescript-eslint/no-misused-promises
app.get("/metrics", metricsHandler);

// Handle incoming OpenAPI requests
app.use(
  "/api",
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  createOpenApiExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext("rest-api"),
    onError({ error }) {
      logger.error(error);
    },
  })
);

// Serve Swagger UI with our OpenAPI schema
app.use("/", swaggerUi.serve);
app.get("/", swaggerUi.setup(openApiDocument));

const server = app.listen(env.BLOBSCAN_API_PORT, () => {
  logger.info(
    `REST API server started on http://0.0.0.0:${env.BLOBSCAN_API_PORT}`
  );
});

async function gracefulShutdown(signal: string) {
  logger.debug(`Received ${signal}. Shutting down...`);

  await tearDownBlobPropagationWorkers();

  server.close(() => {
    logger.debug("REST API server shut down successfully");
  });
}

// Listen for TERM signal .e.g. kill
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));

// Listen for INT signal e.g. Ctrl-C
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
