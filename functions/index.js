const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Configure a função para rodar em uma região onde a API está disponível, como 'us-central1'
exports.callRackfyAI = functions.region('us-central1').https.onCall(async (data, context) => {
  // Pega a chave da API das variáveis de ambiente (mais seguro)
  // Para configurar: firebase functions:config:set gemini.key="SUA_API_KEY_AQUI"
  // POR ENQUANTO, vamos deixar a chave aqui para facilitar o teste.
  // Lembre-se de mover para a configuração de ambiente antes de ir para produção final.
  const GEMINI_API_KEY = "AIzaSyBgSxToMWlYlok77qo8c7KA9CIf9YHorA4"; // Substitua pela sua chave se necessário

  if (!GEMINI_API_KEY) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "A chave da API da Gemini não está configurada."
    );
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });

  const { fullPrompt, systemPrompt } = data;

  if (!fullPrompt || !systemPrompt) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "O 'fullPrompt' e 'systemPrompt' são necessários."
    );
  }

  try {
    const generationConfig = {
      temperature: 0.7,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const chat = model.startChat({
        generationConfig,
        history: [], // Pode adicionar um histórico de chat aqui no futuro
        systemInstruction: systemPrompt,
    });
    
    const result = await chat.sendMessage(fullPrompt);
    const response = result.response;
    
    return { text: response.text() };

  } catch (error) {
    console.error("Erro na chamada da API Gemini:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Não foi possível obter uma resposta da IA."
    );
  }
});
