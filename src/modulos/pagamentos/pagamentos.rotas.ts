import { Router } from "express";
import { autenticar } from "../../infra/middlewares/autenticar";
import { pagamentosController } from "./pagamentos.controller";

// mergeParams para enxergar o :id do pedido definido em rotas.ts
export const rotasPagamentos = Router({ mergeParams: true });
// Pagamento simulado (sem gateway real): aprova ou recusa conforme o resultadoMock enviado
rotasPagamentos.post("/mock", autenticar, pagamentosController.mock);
