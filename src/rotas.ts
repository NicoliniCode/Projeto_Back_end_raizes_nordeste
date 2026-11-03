import { Router } from "express";

export const rotas = Router();

rotas.get("/health", (_req, res) => {
    res.json({ status: "ok", servico: "raizes-do-nordeste" });
});
