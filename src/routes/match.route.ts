import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { MatchController } from "../controllers/match.controllers.js";

const matchRoutes = new Hono();

matchRoutes.use("*", authMiddleware);

matchRoutes.get("/matchGet", MatchController.getMatches);

matchRoutes.get("/random", MatchController.getRandomUsersForMatching);

matchRoutes.post("/create", MatchController.createMatch);

export default matchRoutes;
