import { describe, expect, it } from "vitest";
import { loginSchema } from "../src/modulos/auth/auth.schema";
import {
    atualizarStatusSchema,
    criarPedidoSchema,
    listarPedidosSchema,
} from "../src/modulos/pedidos/pedidos.schema";
import { pagamentoMockSchema } from "../src/modulos/pagamentos/pagamentos.schema";
import { listarAuditoriaSchema } from "../src/modulos/auditoria/auditoria.schema";
import { idSchema } from "../src/infra/utils/validacoes";

const pedidoValido = {
    unidadeId: 1,
    canalPedido: "TOTEM",
    formaPagamento: "MOCK",
    itens: [{ produtoId: 101, quantidade: 2 }],
};

describe("login", () => {

    it("aceita e-mail e senha", () => {
        expect(loginSchema.safeParse({ email: "a@raizes.local", senha: "x" }).success).toBe(true);
    });

    it("rejeita e-mail inválido", () => {
        expect(loginSchema.safeParse({ email: "sem-arroba", senha: "x" }).success).toBe(false);
    });

    it("rejeita campo extra", () => {
        const dados = { email: "a@raizes.local", senha: "x", perfil: "ADMIN" };
        expect(loginSchema.safeParse(dados).success).toBe(false);
    });

});

describe("criar pedido", () => {
    
    it("aceita pedido TOTEM válido", () => {
        expect(criarPedidoSchema.safeParse(pedidoValido).success).toBe(true);
    });

    it("rejeita canalPedido ausente", () => {
        const { canalPedido, ...semCanal } = pedidoValido;
        expect(criarPedidoSchema.safeParse(semCanal).success).toBe(false);
    });

    it("rejeita canalPedido fora do enum", () => {
        const dados = { ...pedidoValido, canalPedido: "WHATSAPP" };
        expect(criarPedidoSchema.safeParse(dados).success).toBe(false);
    });

    it("rejeita forma de pagamento diferente de MOCK", () => {
        const dados = { ...pedidoValido, formaPagamento: "CARTAO" };
        expect(criarPedidoSchema.safeParse(dados).success).toBe(false);
    });

    it("rejeita quantidade negativa", () => {
        const dados = { ...pedidoValido, itens: [{ produtoId: 101, quantidade: -1 }] };
        expect(criarPedidoSchema.safeParse(dados).success).toBe(false);
    });

    it("rejeita lista de itens vazia", () => {
        expect(criarPedidoSchema.safeParse({ ...pedidoValido, itens: [] }).success).toBe(false);
    });

    it("rejeita produto repetido no pedido", () => {
        const itens = [
            { produtoId: 101, quantidade: 1 },
            { produtoId: 101, quantidade: 2 },
        ];
        expect(criarPedidoSchema.safeParse({ ...pedidoValido, itens }).success).toBe(false);
    });

    it("rejeita preço enviado pelo cliente", () => {
        const itens = [{ produtoId: 101, quantidade: 1, preco: 0.01 }];
        expect(criarPedidoSchema.safeParse({ ...pedidoValido, itens }).success).toBe(false);
    });
});

describe("listar pedidos", () => {
    it("converte paginação vinda da query", () => {
        const filtros = listarPedidosSchema.parse({ canalPedido: "APP", page: "2", limit: "5" });
        expect(filtros).toMatchObject({ canalPedido: "APP", page: 2, limit: 5 });
    });

    it("usa page 1 e limit 10 por padrão", () => {
        expect(listarPedidosSchema.parse({})).toMatchObject({ page: 1, limit: 10 });
    });

    it("rejeita limit acima de 50", () => {
        expect(listarPedidosSchema.safeParse({ limit: "51" }).success).toBe(false);
    });
});

describe("atualizar status", () => {
    it("aceita EM_PREPARO", () => {
        expect(atualizarStatusSchema.safeParse({ status: "EM_PREPARO" }).success).toBe(true);
    });

    it("rejeita PAGO no corpo da requisição", () => {
        expect(atualizarStatusSchema.safeParse({ status: "PAGO" }).success).toBe(false);
    });

    it("rejeita CANCELADO no corpo da requisição", () => {
        expect(atualizarStatusSchema.safeParse({ status: "CANCELADO" }).success).toBe(false);
    });
});

describe("pagamento mock", () => {
    it("aceita chave e resultado válidos", () => {
        const dados = { chaveIdempotencia: "chave-teste-001", resultadoMock: "APROVADO" };
        expect(pagamentoMockSchema.safeParse(dados).success).toBe(true);
    });

    it("rejeita chave de idempotência curta", () => {
        const dados = { chaveIdempotencia: "abc", resultadoMock: "APROVADO" };
        expect(pagamentoMockSchema.safeParse(dados).success).toBe(false);
    });

    it("rejeita resultado fora do enum", () => {
        const dados = { chaveIdempotencia: "chave-teste-001", resultadoMock: "TALVEZ" };
        expect(pagamentoMockSchema.safeParse(dados).success).toBe(false);
    });
});

describe("auditoria e ids", () => {
    it("usa limit 50 por padrão", () => {
        expect(listarAuditoriaSchema.parse({})).toMatchObject({ limit: 50 });
    });

    it("rejeita limit acima de 100", () => {
        expect(listarAuditoriaSchema.safeParse({ limit: "101" }).success).toBe(false);
    });

    it("converte id da URL", () => {
        expect(idSchema.parse("7")).toBe(7);
    });

    it("rejeita id zero, negativo ou texto", () => {
        for (const valor of ["0", "-1", "abc", "1.5"]) {
            expect(idSchema.safeParse(valor).success).toBe(false);
        }
    });
});
