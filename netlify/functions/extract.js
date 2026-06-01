// netlify/functions/extract.js
// Función Serverless Segura para procesar estudios socioeconómicos con Gemini

exports.handler = async function(event, context) {
  // Evitar peticiones que no sean POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Soporte para CORS pre-flight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    console.log("=== [SERVERLESS] Nueva petición de extracción recibida ===");

    // Obtener la API Key secreta configurada
    let apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      apiKey = apiKey.trim(); // Limpiar espacios o saltos de línea invisibles
    }

    if (!apiKey) {
      console.error("[SERVERLESS ERROR] GEMINI_API_KEY no está configurada en .env o Netlify.");
      return {
        statusCode: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        },
        body: JSON.stringify({ 
          error: 'Error de Configuración: La variable de entorno GEMINI_API_KEY no está configurada en Netlify.' 
        })
      };
    }

    console.log(`[SERVERLESS] API Key detectada (Longitud: ${apiKey.length}, Empieza con: ${apiKey.substring(0, 5)}...)`);

    const requestBody = JSON.parse(event.body);
    const model = requestBody.model || 'gemini-2.5-flash';
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Calcular tamaño del payload
    const payloadSizeKB = Math.round(event.body.length / 1024);
    console.log(`[SERVERLESS] Modelo seleccionado: ${model}`);
    console.log(`[SERVERLESS] Tamaño del documento enviado: ${payloadSizeKB} KB`);

    // Realizar la petición segura a Google Gemini
    console.log("[SERVERLESS] Enviando petición a Google Gemini...");
    const response = await fetch(googleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: requestBody.contents,
        generationConfig: requestBody.generationConfig
      })
    });

    console.log(`[SERVERLESS] Respuesta de Google Gemini recibida. Código de estado: ${response.status}`);

    const rawText = await response.text();

    if (!response.ok) {
      console.error(`[SERVERLESS ERROR] Google Gemini retornó un código de error ${response.status}.`);
      console.error("[SERVERLESS ERROR] Respuesta cruda de Google:\n", rawText);
      
      let errMsg = 'Error desconocido del servidor de Google.';
      try {
        const errJson = JSON.parse(rawText);
        errMsg = errJson.error?.message || errMsg;
      } catch (e) {
        errMsg = rawText || errMsg;
      }

      return {
        statusCode: response.status,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        },
        body: JSON.stringify({ error: errMsg })
      };
    }

    // Petición exitosa
    console.log("[SERVERLESS SUCCESS] Datos extraídos con éxito desde Google.");
    const responseData = JSON.parse(rawText);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error("[SERVERLESS UNCAUGHT ERROR] Error en la función serverless:", error);
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ 
        error: 'Error del Servidor Netlify: ' + error.message 
      })
    };
  }
};
