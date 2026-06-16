const { pedirRespostaAoOllama, limparResposta } = require('./scripts/ollama');

async function test() {
  console.log("Iniciando teste de integração do Ollama...");
  const diffObj = { promptMod: "A pergunta deve ter dificuldade média. Nível de conhecimentos normais." };
  const themeObj = { promptMod: "O tema da pergunta deve ser sobre física, astronomia, biologia, química, matemática ou invenções tecnológicas." };

  const promptOllama = `
Você é o apresentador de um jogo de conhecimentos gerais estilo Show do Milhão.
Diretriz de Tema: ${themeObj.promptMod}
Dificuldade solicitada: ${diffObj.promptMod}
Me retorne EXATAMENTE neste formato de 6 linhas e mais nada:

PERGUNTA: [O texto da pergunta em português (máximo 15 palavras)]
PROMPT_IMAGEM: [Prompt em inglês, detalhado para o Stable Diffusion gerar uma ilustração ou dica visual sobre a pergunta. ATENÇÃO: NÃO inclua texto na imagem. Apenas arte ou cenários.]
VERDADEIRA: [1 resposta correta CURTA (máximo 5 palavras)]
FALSA_1: [1 resposta incorreta CURTA (máximo 5 palavras)]
FALSA_2: [1 resposta incorreta CURTA (máximo 5 palavras)]
FALSA_3: [1 resposta incorreta CURTA (máximo 5 palavras)]
  `.trim();

  try {
    const resposta = await pedirRespostaAoOllama([{ role: "user", content: promptOllama }], { usarPoliticasDono: false, generationOptions: { num_predict: 400 } });
    console.log("=== RAW RESPONSE ===");
    console.log(resposta);
    console.log("====================");
    
    const resLimpa = limparResposta(resposta);
    const pMatch = resLimpa.match(/PERGUNTA:\s*([^\n]+)/i);
    const pImgMatch = resLimpa.match(/PROMPT_IMAGE[MN]?:\s*([^\n]+)/i);
    const vMatch = resLimpa.match(/VERDADEIRA:\s*([^\n]+)/i);
    
    console.log("Regex match para PERGUNTA:", !!pMatch);
    console.log("Regex match para PROMPT_IMAGEM:", !!pImgMatch);
    console.log("Regex match para VERDADEIRA:", !!vMatch);

    if (pMatch && pImgMatch && vMatch) {
      console.log("✅ TESTE BEM SUCEDIDO: A IA gerou a formatação e a lógica com sucesso.");
    } else {
      console.log("❌ TESTE FALHOU: A IA não seguiu a formatação.");
    }
  } catch(e) {
    console.error("Erro ao chamar Ollama:", e);
  }
}

test();
