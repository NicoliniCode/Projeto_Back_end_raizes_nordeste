import { Router } from "express";
import { rotasAuth } from "./modulos/auth/auth.rotas";
import { rotasUnidades } from "./modulos/unidades/unidades.rotas";
import { rotasPagamentos } from "./modulos/pagamentos/pagamentos.rotas";
import { rotasPedidos } from "./modulos/pedidos/pedidos.rotas";
import { rotasAuditoria } from "./modulos/auditoria/auditoria.rotas";

export const rotas = Router();

rotas.get("/health", (_req, res) => {
    res.json({ status: "ok", servico: "raizes-do-nordeste" });
});

rotas.use("/auth", rotasAuth);
rotas.use("/unidades", rotasUnidades);
// Pagamentos antes de pedidos, para /pedidos/:id/pagamentos cair na rota certa
rotas.use("/pedidos/:id/pagamentos", rotasPagamentos);
rotas.use("/pedidos", rotasPedidos);
rotas.use("/auditoria", rotasAuditoria);
