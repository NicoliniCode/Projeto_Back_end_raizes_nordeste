import { z } from "zod";

// IDs chegam como texto na URL; converte e exige inteiro positivo
export const idSchema = z.coerce.number().int().positive();
