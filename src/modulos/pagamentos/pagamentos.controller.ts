import { usuarioLogado } from "../../infra/middlewares/autenticar";
import { capturarErros } from "../../infra/utils/capturarErros";
import { idSchema } from "../../infra/utils/validacoes";
import { pagamentoMockSchema } from "./pagamentos.schema";
import { pagarMock } from "./pagamentos.service";

export const pagamentosController = {
    //W req = requisição recebida, res = resposta a devolver
    mock: capturarErros(async (req, res) => {

        const pedidoId = idSchema.parse(req.params.id);
        const dados = pagamentoMockSchema.parse(req.body);
        
        res.json(await pagarMock(pedidoId, dados, usuarioLogado(req)));
    }),
};
