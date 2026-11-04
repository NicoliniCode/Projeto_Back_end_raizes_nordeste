import { CanalPedido, Perfil, Prisma, StatusPedido } from "@prisma/client";
import { prisma } from "../../infra/banco/prisma";
import { ErroApp } from "../../infra/erros/ErroApp";
import { verificarUnidade } from "../../infra/utils/permissoes";
import type { UsuarioLogado } from "../../infra/tipos";
import { registrarAuditoria } from "../auditoria/auditoria.service";
import type { DadosCriarPedido, FiltrosPedidos, NovoStatus } from "./pedidos.schema";
import {
    INCLUIR_DETALHES,
    PERFIS_QUE_ALTERAM_STATUS,
    PERFIS_QUE_CRIAM_PEDIDO,
    PROXIMO_STATUS,
    STATUS_CANCELAVEIS,
    verificarAcessoPedido,
} from "./pedidos.regras";

export async function criarPedido(entrada: DadosCriarPedido, usuario: UsuarioLogado) {
    if (!PERFIS_QUE_CRIAM_PEDIDO.includes(usuario.perfil)) {
        throw new ErroApp(403, "SEM_PERMISSAO", "Esse Perfil não pode registrar pedidos.");
    }

    const ehCliente = usuario.perfil === Perfil.CLIENTE;

    if (ehCliente && entrada.canalPedido === CanalPedido.BALCAO) {
        throw new ErroApp(403, "CANAL_NAO_AUTORIZADO", "O Canal BALCAO é reservado para a equipe.");
    }

    if (!ehCliente) verificarUnidade(usuario, entrada.unidadeId);

    // Cliente pede para si mesmo; a equipe informa para quem é o pedido
    const clienteId = ehCliente ? usuario.id : entrada.clienteId;

    if (!clienteId) {
        throw new ErroApp(422, "CLIENTE_OBRIGATORIO", "A equipe precisa Informar clienteId.");
    }

    if (ehCliente && entrada.clienteId && entrada.clienteId !== usuario.id) {
        throw new ErroApp(
            403,
            "SEM_PERMISSAO",
            "Não é permitido fazer pedidos em nome de outra pessoa.",
        );
    }

    const [unidade, cliente] = await Promise.all([
        prisma.unidade.findUnique({ where: { id: entrada.unidadeId } }),
        prisma.usuario.findUnique({ where: { id: clienteId } }),
    ]);

    if (!unidade?.ativo) {
        throw new ErroApp(404, "UNIDADE_NAO_ENCONTRADA", "Unidade inexistente ou inativa.");
    }

    if (!cliente?.ativo || cliente.perfil !== Perfil.CLIENTE) {
        throw new ErroApp(404, "CLIENTE_NAO_ENCONTRADO", "Cliente inexistente ou inativo.");
    }

    const produtoIds = entrada.itens.map((item) => item.produtoId);

    const [cardapio, estoques] = await Promise.all([
        prisma.itemCardapio.findMany({
            where: { unidadeId: entrada.unidadeId, produtoId: { in: produtoIds } },
            include: { produto: true },
        }),
        prisma.estoque.findMany({
            where: { unidadeId: entrada.unidadeId, produtoId: { in: produtoIds } },
        }),
    ]);

    // Preço vem do cardápio da unidade, nunca do corpo da requisição
    const itens = entrada.itens.map((item) => {
        const itemCardapio = cardapio.find((linha) => linha.produtoId === item.produtoId);

        if (!itemCardapio?.disponivel || !itemCardapio.produto.ativo) {
            throw new ErroApp(
                404,
                "PRODUTO_NAO_ENCONTRADO",
                `Produto ${item.produtoId} nao consta no cardápio ativo.`,
            );
        }

        // Só confere o saldo aqui; a baixa acontece no pagamento aprovado
        const saldo = estoques.find((linha) => linha.produtoId === item.produtoId)?.quantidade ?? 0;

        if (saldo < item.quantidade) {
            throw new ErroApp(
                409,
                "ESTOQUE_INSUFICIENTE",
                `Estoque insuficiente para esse produto ${item.produtoId}.`,
            );
        }

        return {
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: itemCardapio.preco,
            subtotal: itemCardapio.preco.mul(item.quantidade),
        };
    });

    const total = itens.reduce((soma, item) => soma.add(item.subtotal), new Prisma.Decimal(0));

    return prisma.$transaction(async (tx) => {
        const pedido = await tx.pedido.create({
            data: {
                clienteId,
                unidadeId: entrada.unidadeId,
                canalPedido: entrada.canalPedido,
                total,
                itens: { create: itens },
            },
            include: INCLUIR_DETALHES,
        });

        await registrarAuditoria(tx, {
            atorId: usuario.id,
            acao: "PEDIDO_CRIADO",
            entidade: "PEDIDO",
            entidadeId: pedido.id,
            unidadeId: pedido.unidadeId,
            dados: { canalPedido: pedido.canalPedido, status: pedido.status },
        });

        return pedido;
    });
}

export async function listarPedidos(filtros: FiltrosPedidos, usuario: UsuarioLogado) {
    const where: Prisma.PedidoWhereInput = {
        ...(filtros.canalPedido ? { canalPedido: filtros.canalPedido } : {}),
        ...(filtros.status ? { status: filtros.status } : {}),
    };

    if (usuario.perfil === Perfil.CLIENTE) {
        where.clienteId = usuario.id;
    } else if (usuario.perfil !== Perfil.ADMIN) {
        if (!usuario.unidadeId) {
            throw new ErroApp(403, "SEM_UNIDADE", "Funcionário não vinculado a uma unidade.");
        }

        where.unidadeId = usuario.unidadeId;
    }

    const [total, dados] = await Promise.all([
        prisma.pedido.count({ where }),
        prisma.pedido.findMany({
            where,
            include: INCLUIR_DETALHES,
            orderBy: { criadoEm: "desc" },
            skip: (filtros.page - 1) * filtros.limit,
            take: filtros.limit,
        }),
    ]);

    return { dados, paginacao: { page: filtros.page, limit: filtros.limit, total } };
}

export async function buscarPedido(id: number, usuario: UsuarioLogado) {
    const pedido = await prisma.pedido.findUnique({ where: { id }, include: INCLUIR_DETALHES });

    if (!pedido) throw new ErroApp(404, "PEDIDO_NAO_ENCONTRADO", "Pedido inexistente.");

    verificarAcessoPedido(pedido, usuario);

    return pedido;
}

export async function atualizarStatus(id: number, novoStatus: NovoStatus, usuario: UsuarioLogado) {
    if (!PERFIS_QUE_ALTERAM_STATUS.includes(usuario.perfil)) {
        throw new ErroApp(403, "SEM_PERMISSAO", "Perfil não pode alterar status.");
    }

    return prisma.$transaction(async (tx) => {
        const pedido = await tx.pedido.findUnique({ where: { id } });

        if (!pedido) throw new ErroApp(404, "PEDIDO_NAO_ENCONTRADO", "Pedido inexistente.");

        verificarAcessoPedido(pedido, usuario);

        if (PROXIMO_STATUS[pedido.status] !== novoStatus) {
            throw new ErroApp(409, "TRANSICAO_INVALIDA", "Transição de status não permitida.");
        }

        if (usuario.perfil === Perfil.COZINHA && novoStatus === StatusPedido.ENTREGUE) {
            throw new ErroApp(403, "SEM_PERMISSAO", "Cozinha não pode concluir entrega.");
        }

        if (usuario.perfil === Perfil.ATENDENTE && novoStatus !== StatusPedido.ENTREGUE) {
            throw new ErroApp(403, "SEM_PERMISSAO", "Atendente apenas conclui entrega.");
        }

        // Só atualiza se ninguém mudou o status entre a leitura e a escrita
        const atualizado = await tx.pedido.updateMany({
            where: { id, status: pedido.status },
            data: { status: novoStatus },
        });

        if (atualizado.count !== 1) {
            throw new ErroApp(409, "CONCORRENCIA", "Status atualizado por outra operação.");
        }

        await registrarAuditoria(tx, {
            atorId: usuario.id,
            acao: "PEDIDO_STATUS_ALTERADO",
            entidade: "PEDIDO",
            entidadeId: id,
            unidadeId: pedido.unidadeId,
            dados: { de: pedido.status, para: novoStatus },
        });

        return tx.pedido.findUniqueOrThrow({ where: { id }, include: INCLUIR_DETALHES });
    });
}

export async function cancelarPedido(id: number, usuario: UsuarioLogado) {
    // tx: cliente da transação. Cria o pedido e baixa o estoque juntos;
    // se algo falhar, nada é salvo.
    return prisma.$transaction(async (tx) => {

        const pedido = await tx.pedido.findUnique({ where: { id } });

        if (!pedido) throw new ErroApp(404, "PEDIDO_NAO_ENCONTRADO", "Pedido inexistente.");

        verificarAcessoPedido(pedido, usuario);

        if (!STATUS_CANCELAVEIS.includes(pedido.status)) {
            throw new ErroApp(
                409,
                "CANCELAMENTO_INVALIDO",
                "MVP permite cancelar somente pedido não pago.",
            );
        }

        const atualizado = await tx.pedido.updateMany({
            where: { id, status: pedido.status },
            data: { status: StatusPedido.CANCELADO },
        });

        if (atualizado.count !== 1) {
            
            throw new ErroApp(409, "CONCORRENCIA", "Pedido alterado durante cancelamento.");
        }

        await registrarAuditoria(tx, {
            atorId: usuario.id,
            acao: "PEDIDO_CANCELADO",
            entidade: "PEDIDO",
            entidadeId: id,
            unidadeId: pedido.unidadeId,
        });

        return tx.pedido.findUniqueOrThrow({ where: { id }, include: INCLUIR_DETALHES });
    });
}
