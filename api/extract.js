// api/extract.js
// Función Serverless Segura para Vercel para procesar estudios socioeconómicos con Gemini

export default async function handler(request, response) {
  // Evitar peticiones que no sean POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Obtener la API Key secreta configurada en el panel de Vercel
    let apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      apiKey = apiKey.trim();
    }

    if (!apiKey) {
      console.error("[VERCEL ERROR] GEMINI_API_KEY no está configurada en las variables de entorno.");
      return response.status(500).json({ 
        error: 'Error de Configuración: La variable de entorno GEMINI_API_KEY no está configurada en el panel de Vercel.' 
      });
    }

    const requestBody = request.body;
    const model = requestBody.model || 'gemini-2.5-flash';
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`[VERCEL] Redireccionando a Google Gemini (${model})...`);

    // Realizar la petición segura a Google Gemini
    const googleResponse = await fetch(googleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: requestBody.contents,
        generationConfig: requestBody.generationConfig
      })
    });

    const rawText = await googleResponse.text();

    if (!googleResponse.ok) {
      console.error(`[VERCEL ERROR] Google Gemini retornó un código de error ${googleResponse.status}.`);
      let errMsg = 'Error desconocido del servidor de Google.';
      try {
        const errJson = JSON.parse(rawText);
        errMsg = errJson.error?.message || errMsg;
      } catch (e) {
        errMsg = rawText || errMsg;
      }
      return response.status(googleResponse.status).json({ error: errMsg });
    }

    // Respuesta exitosa de Google Gemini
    const responseData = JSON.parse(rawText);
    
    // Devolver respuesta con CORS headers para seguridad
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return response.status(200).json(responseData);

  } catch (error) {
    console.error("[VERCEL UNCAUGHT ERROR] Error en la función serverless:", error);
    return response.status(500).json({ error: 'Error del Servidor Vercel: ' + error.message });
  }
}
