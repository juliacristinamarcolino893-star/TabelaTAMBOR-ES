
const CATEGORIAS = [
    { id: "passagem", nome: "Passagem", padrao: 45 },
    { id: "carregamento", nome: "Carregamento", padrao: 45 },
    { id: "moagem", nome: "Moagem", padrao: 500 },
    { id: "correcoes", nome: "Correções", padrao: 25 },
    { id: "ligante", nome: "Ligante", padrao: 8 },
    { id: "descarregamento", nome: "Descarregamento", padrao: 45 },
    { id: "moagem-correcao", nome: "Moagem / Correção", padrao: 500 }
];

const CATEGORIAS_SOMA_MOAGEM_CORRECAO = [
    "passagem",
    "carregamento",
    "moagem",
    "correcoes",
    "ligante",
    "descarregamento"
];

const linhasCategorias = document.getElementById("linhasCategorias");
const categoriasDentroElemento = document.getElementById("categoriasDentro");
const porcentagemFinalElemento = document.getElementById("porcentagemFinal");
const categoriasPreenchidasElemento = document.getElementById("categoriasPreenchidas");
const mensagemElemento = document.getElementById("mensagem");
const dataElemento = document.getElementById("dataAcompanhamento");

function criarTabela() {
    linhasCategorias.innerHTML = "";

    CATEGORIAS.forEach((categoria) => {
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <th scope="row">${categoria.nome}</th>
            <td class="padrao">${formatarTempo(categoria.padrao)}</td>
            <td>
                <input
                    class="campo-numero"
                    id="total-${categoria.id}"
                    data-categoria="${categoria.id}"
                    data-tipo="total"
                    type="text"
                    inputmode="decimal"
                    placeholder="Ex.: 350"
                    aria-label="Tempo total em minutos — ${categoria.nome}"
                    autocomplete="off"
                >
            </td>
            <td>
                <input
                    class="campo-numero"
                    id="fichas-${categoria.id}"
                    data-categoria="${categoria.id}"
                    data-tipo="fichas"
                    type="number"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    placeholder="Ex.: 7"
                    aria-label="Quantidade de fichas — ${categoria.nome}"
                >
            </td>
            <td class="media" id="media-${categoria.id}">—</td>
            <td>
                <span class="status vazio" id="status-${categoria.id}">
                    Sem dados
                </span>
            </td>
        `;

        linhasCategorias.appendChild(linha);
    });

    linhasCategorias.querySelectorAll("input").forEach((campo) => {
        campo.addEventListener("input", calcularTudo);
    });
}

function lerNumero(valor) {
    const texto = String(valor).trim().replace(",", ".");

    if (texto === "") {
        return null;
    }

    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : null;
}

// Exibe números com a quantidade de casas escolhida, sem arredondar.
function formatarNumero(valor, casas = 2) {
    const fator = 10 ** casas;
    const truncado = Math.trunc(valor * fator) / fator;

    return truncado.toFixed(casas).replace(".", ",");
}

// Converte minutos em horas e minutos quando o valor chega a 60 minutos.
function formatarTempo(minutos) {
    if (minutos < 60) {
        return `${formatarNumero(minutos, 2)} min`;
    }

    const horas = Math.floor(minutos / 60);
    const restoMinutos = Math.trunc((minutos - horas * 60) * 100) / 100;

    if (restoMinutos === 0) {
        return `${horas}h`;
    }

    return `${horas}h ${formatarNumero(restoMinutos, 2)}min`;
}

// Exibe somente uma casa decimal na porcentagem, sem arredondar.
function formatarPorcentagem(valor) {
    const truncado = Math.trunc(valor * 10) / 10;

    return `${truncado.toFixed(1).replace(".", ",")}%`;
}

function definirStatus(categoria, media) {
    const status = document.getElementById(`status-${categoria.id}`);

    if (media === null) {
        status.className = "status vazio";
        status.textContent = "Sem dados";
        return false;
    }

    if (media <= categoria.padrao) {
        status.className = "status dentro";
        status.textContent = "Dentro do padrão";
        return true;
    }

    status.className = "status fora";
    status.textContent = "Fora do padrão";
    return false;
}

// Lê o tempo total digitado para uma categoria.
function obterTempoTotal(id) {
    const campo = document.getElementById(`total-${id}`);
    return lerNumero(campo.value);
}

// Calcula a soma dos seis tempos usados em Moagem / Correção.
function calcularSomaMoagemCorrecao() {
    let soma = 0;

    for (const id of CATEGORIAS_SOMA_MOAGEM_CORRECAO) {
        const total = obterTempoTotal(id);

        // Se algum dos seis tempos estiver vazio ou inválido,
        // ainda não é possível calcular a soma completa.
        if (total === null || total < 0) {
            return null;
        }

        soma += total;
    }

    return soma;
}

function calcularTudo() {
    let dentro = 0;
    let preenchidas = 0;
    let mensagem = "";

    // Soma os tempos antes de calcular as médias das categorias.
    const somaMoagemCorrecao = calcularSomaMoagemCorrecao();

    CATEGORIAS.forEach((categoria) => {
        const totalCampo = document.getElementById(`total-${categoria.id}`);
        const fichasCampo = document.getElementById(`fichas-${categoria.id}`);
        const mediaElemento = document.getElementById(`media-${categoria.id}`);

        const totalDigitado = lerNumero(totalCampo.value);
        const fichasTexto = fichasCampo.value.trim();
        const fichas = fichasTexto === "" ? null : Number(fichasTexto);

        totalCampo.setAttribute("aria-invalid", "false");
        fichasCampo.setAttribute("aria-invalid", "false");

        let total = totalDigitado;

        // Em Moagem / Correção, o total é a soma das outras seis categorias.
        if (categoria.id === "moagem-correcao") {
            if (somaMoagemCorrecao === null) {
                total = null;
            } else {
                total = somaMoagemCorrecao;
            }

            // O campo de total dessa categoria não é usado no cálculo.
            totalCampo.readOnly = true;
            totalCampo.placeholder = "Soma automática";
            totalCampo.setAttribute(
                "aria-label",
                "Soma automática dos tempos das seis categorias"
            );

            if (total !== null) {
                totalCampo.value = formatarNumero(total, 2);
            } else {
                totalCampo.value = "";
            }
        }

        // Se os campos necessários estiverem vazios, não conta a categoria.
        if (total === null && fichas === null) {
            mediaElemento.textContent = "—";
            definirStatus(categoria, null);
            return;
        }

        // Moagem / Correção precisa dos seis tempos e de sua quantidade de fichas.
        if (total === null || fichas === null) {
            mediaElemento.textContent = "Preencha os dados";
            definirStatus(categoria, null);

            if (categoria.id === "moagem-correcao" && somaMoagemCorrecao === null) {
                mensagem = "Para calcular Moagem / Correção, preencha os tempos totais de Passagem, Carregamento, Moagem, Correções, Ligante e Descarregamento, além da quantidade de fichas de Moagem / Correção.";
            } else {
                mensagem = "Preencha o tempo total e a quantidade de fichas em cada categoria utilizada.";
            }

            return;
        }

        if (total < 0 || !Number.isInteger(fichas) || fichas <= 0) {
            mediaElemento.textContent = "Confira os valores";
            definirStatus(categoria, null);

            if (total < 0) {
                totalCampo.setAttribute("aria-invalid", "true");
            }

            if (!Number.isInteger(fichas) || fichas <= 0) {
                fichasCampo.setAttribute("aria-invalid", "true");
            }

            mensagem = "O tempo total não pode ser negativo e a quantidade de fichas precisa ser um número inteiro maior que zero.";
            return;
        }

        const media = total / fichas;

        mediaElemento.textContent = formatarTempo(media);
        preenchidas++;

        if (definirStatus(categoria, media)) {
            dentro++;
        }
    });

    categoriasDentroElemento.textContent = `${dentro} de 7`;
    categoriasPreenchidasElemento.textContent = `${preenchidas} de 7`;

    // A tabela inteira vale 100%, divididos igualmente entre as 7 categorias.
    const porcentagem = (dentro / CATEGORIAS.length) * 100;

    porcentagemFinalElemento.textContent = formatarPorcentagem(porcentagem);

    // Vermelho abaixo de 50%, verde acima de 50%, neutro exatamente em 50%.
    porcentagemFinalElemento.classList.remove(
        "porcentagem-baixa",
        "porcentagem-alta",
        "porcentagem-neutra"
    );

    if (porcentagem < 50) {
        porcentagemFinalElemento.classList.add("porcentagem-baixa");
    } else if (porcentagem > 50) {
        porcentagemFinalElemento.classList.add("porcentagem-alta");
    } else {
        porcentagemFinalElemento.classList.add("porcentagem-neutra");
    }

    mensagemElemento.textContent = mensagem;
}

function limparDados() {
    const confirmar = window.confirm(
        "Deseja apagar os dados preenchidos e começar de novo?"
    );

    if (!confirmar) {
        return;
    }

    linhasCategorias.querySelectorAll("input").forEach((campo) => {
        campo.value = "";
        campo.removeAttribute("aria-invalid");
    });

    mensagemElemento.textContent = "";
    calcularTudo();
}

function iniciarData() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    dataElemento.value = `${ano}-${mes}-${dia}`;
}

document.getElementById("limpar").addEventListener("click", limparDados);

document.getElementById("imprimir").addEventListener("click", () => {
    window.print();
});

criarTabela();
iniciarData();
calcularTudo();
