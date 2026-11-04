import { usuarioLogado } from "../../infra/middlewares/autenticar";
import { capturarErros } from "../../infra/utils/capturarErros";
import { listarAuditoriaSchema } from "./auditoria.schema";
import { listarAuditoria } from "./auditoria.service";

export const auditoriaController = {

    listar: capturarErros(async (req, res) => {

        const filtros = listarAuditoriaSchema.parse(req.query);
        
        res.json(await listarAuditoria(filtros, usuarioLogado(req)));
    }),
};
