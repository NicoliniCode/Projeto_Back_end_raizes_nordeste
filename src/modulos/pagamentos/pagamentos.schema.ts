import { z } from "zod";

export const pagamentoMockSchema = z
    .object({
        chaveIdempotencia: z.string().min(8).max(120),
        resultadoMock: z.enum(["APROVADO", "RECUSADO", "ERRO"]),
    })
    .strict();

export type DadosPagamentoMock = z.infer<typeof pagamentoMockSchema>;
