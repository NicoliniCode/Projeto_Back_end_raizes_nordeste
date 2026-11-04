import { Router } from "express";
import { autenticar } from "../../infra/middlewares/autenticar";
import { pedidosController } from "./pedidos.controller";

export const rotasPedidos = Router();

// Todas exigem login; o perfil é conferido no service
rotasPedidos.post("/", autenticar, pedidosController.criar);
rotasPedidos.get("/", autenticar, pedidosController.listar);
rotasPedidos.get("/:id", autenticar, pedidosController.buscar);
rotasPedidos.patch("/:id/status", autenticar, pedidosController.atualizarStatus);
rotasPedidos.post("/:id/cancelamento", autenticar, pedidosController.cancelar);
