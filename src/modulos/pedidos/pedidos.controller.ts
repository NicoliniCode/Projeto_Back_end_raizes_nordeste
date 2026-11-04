import { usuarioLogado } from "../../infra/middlewares/autenticar";
import { capturarErros } from "../../infra/utils/capturarErros";
import { idSchema } from "../../infra/utils/validacoes";
import { atualizarStatusSchema, criarPedidoSchema, listarPedidosSchema } from "./pedidos.schema";
import {
    atualizarStatus,
    buscarPedido,
    cancelarPedido,
    criarPedido,
    listarPedidos,
} from "./pedidos.service";

export const pedidosController = {
    // POST /pedidos
    criar: capturarErros(async (req, res) => {

        const dados = criarPedidoSchema.parse(req.body);

        res.status(201).json(await criarPedido(dados, usuarioLogado(req)));
    }),
    // GET /pedidos?canalPedido=&status=&page=&limit=
    listar: capturarErros(async (req, res) => {

        const filtros = listarPedidosSchema.parse(req.query);

        res.json(await listarPedidos(filtros, usuarioLogado(req)));
    }),
    // GET /pedidos/:id
    buscar: capturarErros(async (req, res) => {

        const id = idSchema.parse(req.params.id);

        res.json(await buscarPedido(id, usuarioLogado(req)));
    }),
    // PATCH /pedidos/:id/status
    atualizarStatus: capturarErros(async (req, res) => {

        const id = idSchema.parse(req.params.id);
        const { status } = atualizarStatusSchema.parse(req.body);

        res.json(await atualizarStatus(id, status, usuarioLogado(req)));
    }),
    // POST /pedidos/:id/cancelar
    cancelar: capturarErros(async (req, res) => {

        const id = idSchema.parse(req.params.id);

        res.json(await cancelarPedido(id, usuarioLogado(req)));
    }),
};
