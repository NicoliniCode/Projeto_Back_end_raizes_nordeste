import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { rotas } from "./rotas";
import { rotaNaoEncontrada, tratarErros } from "./infra/middlewares/tratarErros";

export function criarApp() {
    
    const app = express();

    app.use(helmet({ contentSecurityPolicy: false })); // sem CSP para o Swagger UI carregar
    app.use(cors());
    app.use(express.json({ limit: "32kb" }));

    const documentacao = YAML.parse(
        readFileSync(resolve(process.cwd(), "docs", "openapi.yaml"), "utf8"),
    );

    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(documentacao));
    app.get("/api/openapi.json", (_req, res) => res.json(documentacao));

    app.use("/api", rotas);
    app.use(rotaNaoEncontrada);
    app.use(tratarErros); // sempre por último

    return app;
}
