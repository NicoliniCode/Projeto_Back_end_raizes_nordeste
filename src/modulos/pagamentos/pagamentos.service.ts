import { Perfil, Prisma, StatusPedido } from "@prisma/client";
import { ambiente } from "../../config/ambiente";
import { prisma } from "../../infra/banco/prisma";
import { ErroApp } from "../../infra/erros/ErroApp";
import type { UsuarioLogado } from "../../infra/tipos";
import { registrarAuditoria } from "../auditoria/auditoria.service";
import { STATUS_PAGAVEIS, verificarAcessoPedido } from "../pedidos/pedidos.regras";
import type { DadosPagamentoMock } from "./pagamentos.schema";

const PERFIS_QUE_PAGAM: Perfil[] = [Perfil.CLIENTE, Perfil.ATENDENTE, Perfil.GERENTE, Perfil.ADMIN];

// Resultado do mock que muda o status do pedido; ERRO não muda nada
const NOVO_STATUS: Partial<Record<DadosPagamentoMock["resultadoMock"], StatusPedido>> = {
    APROVADO: StatusPedido.PAGO,
    RECUSADO: StatusPedido.PAGAMENTO_RECUSADO,
};

export async function pagarMock(
    pedidoId: number,
    entrada: DadosPagamentoMock,
    usuario: UsuarioLogado,
) {
    // Pagamento simulado nunca pode rodar em produção
    if (!ambiente.MOCK_PAYMENTS_ENABLED || ambiente.NODE_ENV === "production") {
        throw new ErroApp(
            403,
            "PAGAMENTO_MOCK_DESABILITADO",
            "Simulação de pagamento desabilitada neste ambiente.",
        );
    }

    if (!PERFIS_QUE_PAGAM.includes(usuario.perfil)) {
        throw new ErroApp(403, "SEM_PERMISSAO", "Perfil não pode solicitar pagamento.");
    }

    return prisma.$transaction(
        /* tx: cliente Prisma da transação. Tudo feito por ele é confirmado junto
               ou desfeito junto se algum passo der erro. */
        async (tx) => {
            const repetido = await tx.pagamento.findUnique({
                where: {
                    pedidoId_chaveIdempotencia: {
                        pedidoId,
                        chaveIdempotencia: entrada.chaveIdempotencia,
                    },
                },
            });

            const pedido = await tx.pedido.findUnique({
                where: { id: pedidoId },
                include: { itens: true },
            });

            if (!pedido) throw new ErroApp(404, "PEDIDO_NAO_ENCONTRADO", "Pedido inexistente.");

            verificarAcessoPedido(pedido, usuario);

            // Mesma chave e mesmo resultado: devolve o que já foi feito, sem nova baixa
            if (repetido) {

                if (repetido.resultadoSimulado !== entrada.resultadoMock) {

                    throw new ErroApp(
                        409,
                        "CHAVE_IDEMPOTENCIA_REUTILIZADA",
                        "A chave foi usada com outro resultado mock.",
                    );
                }

                return {
                    repetido: true,
                    pagamento: repetido,
                    pedido: await tx.pedido.findUniqueOrThrow({ where: { id: pedidoId } }),
                };
            }

            if (!STATUS_PAGAVEIS.includes(pedido.status)) {

                throw new ErroApp(
                    409,
                    "PEDIDO_NAO_PAGAVEL",
                    "Pedido já pago, cancelado ou em atendimento.",
                );
            }

            if (entrada.resultadoMock === "APROVADO") {
                // Baixa condicional: só desconta se ainda houver saldo suficiente
                for (const item of pedido.itens) {

                    const baixa = await tx.estoque.updateMany({
                        where: {
                            unidadeId: pedido.unidadeId,
                            produtoId: item.produtoId,
                            quantidade: { gte: item.quantidade },
                        },
                        data: { quantidade: { decrement: item.quantidade } },
                    });

                    if (baixa.count !== 1) {
                        throw new ErroApp(
                            409,
                            "ESTOQUE_INSUFICIENTE",
                            `Sem estoque para produto ${item.produtoId} no momento da confirmação.`,
                        );
                    }
                }
            }

            const novoStatus = NOVO_STATUS[entrada.resultadoMock];

            if (novoStatus) {
                
                const atualizado = await tx.pedido.updateMany({
                    where: { id: pedidoId, status: { in: STATUS_PAGAVEIS } },
                    data: { status: novoStatus },
                });

                if (atualizado.count !== 1) {
                    
                    throw new ErroApp(
                        409,
                        "CONCORRENCIA",
                        "O pedido foi alterado por outra operação.",
                    );
                }
            }

            const pagamento = await tx.pagamento.create({
                data: {
                    pedidoId,
                    chaveIdempotencia: entrada.chaveIdempotencia,
                    status: entrada.resultadoMock,
                    resultadoSimulado: entrada.resultadoMock,
                    valor: pedido.total,
                },
            });

            await registrarAuditoria(tx, {
                atorId: usuario.id,
                acao: `PAGAMENTO_MOCK_${entrada.resultadoMock}`,
                entidade: "PEDIDO",
                entidadeId: pedidoId,
                unidadeId: pedido.unidadeId,
                dados: { pagamentoId: pagamento.id, resultado: entrada.resultadoMock },
            });

            return {
                repetido: false,
                pagamento,
                pedido: await tx.pedido.findUniqueOrThrow({ where: { id: pedidoId } }),
            };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15000 },
    );
}
