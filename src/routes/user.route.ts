import { Hono } from "hono";
import { UserController } from "../controllers/user.controllers.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const usersRoutes = new Hono();

usersRoutes.use("*", authMiddleware);

usersRoutes.get("/profile", UserController.getProfile);
usersRoutes.post("/update", UserController.updateProfile);
usersRoutes.get("/interests", UserController.getAllInterests);

export default usersRoutes;
