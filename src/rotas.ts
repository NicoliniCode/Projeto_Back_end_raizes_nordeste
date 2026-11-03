import { Router } from "express";
import { rotasAuth } from "./modulos/auth/auth.rotas";

export const rotas = Router();

rotas.get("/health", (_req, res) => {
    res.json({ status: "ok", servico: "raizes-do-nordeste" });
});

rotas.use("/auth", rotasAuth);
