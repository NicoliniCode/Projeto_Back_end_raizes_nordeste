import { usuarioLogado } from "../../infra/middlewares/autenticar";
import { capturarErros } from "../../infra/utils/capturarErros";
import { idSchema } from "../../infra/utils/validacoes";
import { buscarCardapio, buscarEstoque, listarUnidades } from "./unidades.service";

export const unidadesController = {

    listar: capturarErros(async (_req, res) => {
        res.json(await listarUnidades());
    }),

    cardapio: capturarErros(async (req, res) => {

        const id = idSchema.parse(req.params.id);

        res.json(await buscarCardapio(id));
    }),

    estoque: capturarErros(async (req, res) => {
        
        const id = idSchema.parse(req.params.id);

        res.json(await buscarEstoque(id, usuarioLogado(req)));
    }),
};
