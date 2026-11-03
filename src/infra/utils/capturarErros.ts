import type { RequestHandler } from "express";

// O Express 4 não pega erro de função async sozinho; aqui o erro é repassado ao next()
export function capturarErros(handler: RequestHandler): RequestHandler {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}
