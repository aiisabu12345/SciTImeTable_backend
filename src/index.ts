import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import { HTTPException } from "hono/http-exception";
import { openAPIRouteHandler } from "hono-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import departmentsRouter from "./router/departmentsRouter.js";
import programsRouter from "./router/programsRouter.js";
import buildingsRouter from "./router/buildingsRouter.js";
import roomsRouter from "./router/roomsRouter.js";
import roomTypesRouter from "./router/roomTypesRouter.js";
import schedulesRouter from "./router/schedulesRouter.js";
import coursesRouter from "./router/coursesRouter.js";

const app = new Hono();

app.get("/", (c) => c.json({ message: "running" }));

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.route("api/buildings", buildingsRouter);
app.route("api/departments", departmentsRouter);
app.route("api/programs", programsRouter);
app.route("api/rooms", roomsRouter);
app.route("api/room_types", roomTypesRouter);
app.route("api/schedules", schedulesRouter);
app.route("api/courses", coursesRouter);

app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "SciTimeTable API",
        version: "1.0.0",
        description: "master data api",
      },
      servers: [
        {
          url: "http://localhost:3000/",
          description: "Cloud Server",
        },
      ],
    },
  })
);

app.get("/docs", Scalar({ url: "/openapi" }));

showRoutes(app);

app.onError((err, c) => {
  console.error(err);
  if (err instanceof HTTPException) {
    return c.json({ error: err.message, cause: err.cause }, err.status);
  }
  return c.json({ error: "Internal server error" }, 500);
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running`);
  }
);
