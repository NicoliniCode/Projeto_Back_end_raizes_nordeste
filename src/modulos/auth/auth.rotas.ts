import { Router } from "express";
import { authController } from "./auth.controller";

export const rotasAuth = Router();

rotasAuth.post("/login", authController.login);
