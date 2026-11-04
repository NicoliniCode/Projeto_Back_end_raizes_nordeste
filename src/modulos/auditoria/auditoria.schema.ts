import { z } from "zod";

export const listarAuditoriaSchema = z.object({
    unidadeId: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type FiltrosAuditoria = z.infer<typeof listarAuditoriaSchema>;
