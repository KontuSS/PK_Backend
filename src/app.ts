import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import matchRoutes from "./routes/match.route.js";
import plagiarismRoutes from "./routes/plagiarism.route.js";
import simpleFileRoutes from "./routes/simple-file.route.js";

const app = new Hono();
// Middlewares
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"], // Your frontend URLs
    credentials: true,
  })
);

// Routes
app.route("/auth", authRoutes);
app.route("/user", userRoutes);
app.route("/chat", chatRoutes);
app.route("/matching", matchRoutes);
app.route("/plagiarism", plagiarismRoutes);
app.route("/files", simpleFileRoutes); // Simple file upload/download

// Health check
app.get("/", (c) => c.text("API is running"));

export default app;
