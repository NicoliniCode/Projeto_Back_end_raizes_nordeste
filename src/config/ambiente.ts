import "dotenv/config";
import { z } from "zod";

const variaveis = z.object({
    DATABASE_URL: z.string({ required_error: "Configure DATABASE_URL no arquivo .env" }).min(1),
    JWT_SECRET: z
        .string({ required_error: "Configure JWT_SECRET no arquivo .env" })
        .min(32, "JWT_SECRET deve ter pelo menos 32 caracteres."),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    MOCK_PAYMENTS_ENABLED: z
        .string()
        .default("false")
        .transform((valor) => valor === "true"),
});

export const ambiente = variaveis.parse(process.env);
