import { z } from "zod";
import { CanalPedido, StatusPedido } from "@prisma/client";

const itemPedidoSchema = z
    .object({
        produtoId: z.number().int().positive(),
        quantidade: z.number().int().min(1).max(100),
    })
    .strict();

export const criarPedidoSchema = z
    .object({
        unidadeId: z.number().int().positive(),
        clienteId: z.number().int().positive().optional(),
        canalPedido: z.nativeEnum(CanalPedido),
        formaPagamento: z.literal("MOCK"),
        itens: z
            .array(itemPedidoSchema)
            .min(1)
            .max(30)
            .refine(
                (itens) => new Set(itens.map((item) => item.produtoId)).size === itens.length,
                "Produtos repetidos no pedido.",
            ),
    })
    .strict();

export const listarPedidosSchema = z.object({
    canalPedido: z.nativeEnum(CanalPedido).optional(),
    status: z.nativeEnum(StatusPedido).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
});

// Só os status operacionais; PAGO e CANCELADO têm rotas próprias
export const atualizarStatusSchema = z
    .object({
        status: z.enum(["EM_PREPARO", "PRONTO", "ENTREGUE"]),
    })
    .strict();

export type DadosCriarPedido = z.infer<typeof criarPedidoSchema>;
export type FiltrosPedidos = z.infer<typeof listarPedidosSchema>;
export type NovoStatus = z.infer<typeof atualizarStatusSchema>["status"];
