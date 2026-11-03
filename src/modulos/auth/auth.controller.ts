import { capturarErros } from "../../infra/utils/capturarErros";
import { loginSchema } from "./auth.schema";
import { fazerLogin } from "./auth.service";

export const authController = {
    login: capturarErros(async (req, res) => {
        const dados = loginSchema.parse(req.body);
        res.json(await fazerLogin(dados));
    }),
};
