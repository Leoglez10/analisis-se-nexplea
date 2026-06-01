// ==========================================================================
// CONFIGURACIÓN DE SE-EXTRACT AI
// ==========================================================================
// 👉 Coloca tu API Key de Google Gemini aquí entre las comillas:
const GEMINI_API_KEY = "TU_API_KEY_AQUI";
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Elementos del DOM - Fases
  const uploadStage = document.getElementById('upload-stage');
  const processingStage = document.getElementById('processing-stage');
  const resultStage = document.getElementById('result-stage');
  
  // Cargador / Dropzone
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const loaderPercentage = document.getElementById('loader-percentage');
  const processingFileName = document.getElementById('processing-file-name');
  
  // Línea de tiempo
  const steps = {
    read: document.getElementById('step-read'),
    connect: document.getElementById('step-connect'),
    ai: document.getElementById('step-ai'),
    mapping: document.getElementById('step-mapping'),
    finalize: document.getElementById('step-finalize')
  };
  
  // Ficha de Candidato
  const infoNombre = document.getElementById('info-nombre');
  const infoPuesto = document.getElementById('info-puesto');
  const infoEmpresa = document.getElementById('info-empresa');
  const infoEdad = document.getElementById('info-edad');
  const infoSexo = document.getElementById('info-sexo');
  const infoEstadoCivil = document.getElementById('info-estado-civil');
  const infoTelefonos = document.getElementById('info-telefonos');
  const infoEstudios = document.getElementById('info-estudios');
  const infoDireccion = document.getElementById('info-direccion');
  const infoUltimoEmpleo = document.getElementById('info-ultimo-empleo');
  const infoRefLaborales = document.getElementById('info-ref-laborales');
  const infoRefVecinales = document.getElementById('info-ref-vecinales');
  const infoDictamen = document.getElementById('info-dictamen');
  const candidateInitials = document.getElementById('candidate-initials');
  
  // Workspace Derecho
  const jsonCode = document.getElementById('json-code');
  const outputFilename = document.getElementById('output-filename');
  const btnCopy = document.getElementById('btn-copy');
  const btnCopyText = document.getElementById('btn-copy-text');
  const btnDownload = document.getElementById('btn-download');
  const btnReprocess = document.getElementById('btn-reprocess');
 
  // Estado Global de la App
  const localApiKey = window.LOCAL_GEMINI_API_KEY || '';
  const isKeyHardcoded = (typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY && GEMINI_API_KEY !== 'TU_API_KEY_AQUI');
  
  let appState = {
    apiKey: localApiKey || (isKeyHardcoded ? GEMINI_API_KEY : (localStorage.getItem('gemini_api_key') || '')),
    model: 'gemini-2.5-flash',
    extractedData: null,
    fileName: ''
  };

  // ==========================================================================
  // Eventos Drag and Drop y Carga de Archivo
  // ==========================================================================
  
  // Trigger del file explorer
  dropzone.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  // Drag over y drag leave efectos
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  });

  // Validación y envío del archivo
  function handleFileSelection(file) {
    if (file.type !== 'application/pdf') {
      alert('Por favor, selecciona un archivo en formato PDF.');
      return;
    }

    appState.fileName = file.name.replace('.pdf', '');
    processingFileName.textContent = file.name;
    
    // Iniciar fases
    uploadStage.classList.add('hidden');
    processingStage.classList.remove('hidden');
    
    processFile(file);
  }

  // ==========================================================================
  // Fases de Procesamiento y Consumo de la API de Gemini
  // ==========================================================================
  
  // Actualizar indicador de hitos en la pantalla de carga
  function updateStep(stepName, status) {
    const el = steps[stepName];
    if (!el) return;
    
    if (status === 'active') {
      el.className = 'timeline-item active';
      el.querySelector('.timeline-icon').innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" class="icon-pending">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      `;
    } else if (status === 'completed') {
      el.className = 'timeline-item completed';
      el.querySelector('.timeline-icon').innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" class="icon-completed">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      `;
    }
  }

  // Controlar progreso numérico simulado
  function simulatePercentage(target, duration, callback) {
    let current = parseInt(loaderPercentage.textContent);
    const stepTime = Math.max(Math.floor(duration / (target - current)), 10);
    
    const interval = setInterval(() => {
      current++;
      loaderPercentage.textContent = current + '%';
      if (current >= target) {
        clearInterval(interval);
        if (callback) callback();
      }
    }, stepTime);
    
    return interval;
  }

  function processFile(file) {
    let progressInterval;
    
    // Paso 1: Lectura local
    updateStep('read', 'active');
    loaderPercentage.textContent = '0%';
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
      progressInterval = simulatePercentage(20, 800, () => {
        updateStep('read', 'completed');
        
        // Paso 2: Conexión con API
        updateStep('connect', 'active');
        
        const base64Data = e.target.result.split(',')[1];
        
        progressInterval = simulatePercentage(40, 1500, () => {
          updateStep('connect', 'completed');
          
          // Paso 3: Análisis con Inteligencia Artificial
          updateStep('ai', 'active');
          
          callGeminiAPI(base64Data, progressInterval);
        });
      });
    };
    
    reader.onerror = function() {
      clearInterval(progressInterval);
      alert('Ocurrió un error al leer el archivo PDF localmente.');
      resetToUpload();
    };
    
    reader.readAsDataURL(file);
  }

  // Llamada asíncrona a la API de Gemini
  async function callGeminiAPI(base64Data, currentInterval) {
    // Construcción del Prompt Inteligente especializado en ESE
    const promptText = `
Eres un experto en lectura y extracción de datos de Estudios Socioeconómicos en PDF.
Tu tarea es analizar detalladamente el PDF proporcionado y extraer absolutamente toda la información posible, mapeándola exactamente al formato estructurado JSON de la siguiente plantilla.

PLANTILLA JSON BASE:
${JSON.stringify(ESE_TEMPLATE, null, 2)}

REGLAS DE EXTRACCIÓN CRÍTICAS:
1. Mantén de manera obligatoria las llaves del JSON exactamente iguales a la plantilla. No agregues llaves nuevas ni renombres ninguna.
2. Conserva estrictamente los tipos de datos: si un campo contiene un arreglo de objetos (como "familiares", "empleos", "ingresos", "referenciasVecinales"), genera múltiples objetos en ese arreglo si existen. Conserva los campos "id" como números secuenciales (1, 2, 3...) para cada elemento dentro de dichos arreglos.
3. Para la sección "docs" (como ine, curp, actaNacimiento, imss, compDomicilio): si el documento se indica como entregado, aprobado o presente en el estudio PDF, pon "checked": true y extrae su número, folio o clave en el campo "folio" si está disponible. Si no está, pon "checked": true y "folio": "". Si no está presente, pon "checked": false y "folio": "".
4. En las secciones como "deporte", "sindicato", "partidoPolitico", "alcohol", "tabaco", "cirugias": si hay respuesta afirmativa en el texto, coloca "respuesta": "Sí" y detalla la información o el cargo según corresponda. Si es negativo o no se menciona, deja los valores por defecto de la plantilla ("No" y "").
5. Para el campo "dictamen", extrae palabras como "APROBADO", "NO APROBADO", "RECOMENDABLE CON RESERVAS" o "CONDICIONADO" si se menciona una resolución en la conclusión del PDF.
6. Extrae cada empleo del historial laboral del candidato detalladamente en el arreglo "empleos", rellenando la mayor cantidad de campos posible (empresa, puesto, periodo, sueldo, jefes, motivos de salida y campos validados).
7. Escribe fechas en formato YYYY-MM-DD si es posible.
8. Retorna ÚNICAMENTE la cadena del objeto JSON resultante. No agregues explicaciones adicionales, introducciones ni bloques de código con marcas triples (\`\`\`json). Entrega un objeto JSON válido y limpio.
`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    let url;
    let bodyToSend;

    // Si la llave está configurada localmente en app.js, llamamos directo a Google
    if (appState.apiKey) {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${appState.model}:generateContent?key=${appState.apiKey}`;
      bodyToSend = JSON.stringify(requestBody);
    } else {
      // Si no hay llave local, llamamos a la función Serverless segura de Netlify
      url = `/.netlify/functions/extract`;
      bodyToSend = JSON.stringify({
        model: appState.model,
        contents: requestBody.contents,
        generationConfig: requestBody.generationConfig
      });
    }

    // Acelerar porcentaje a 75% simulando la espera de la IA
    clearInterval(currentInterval);
    let aiInterval = simulatePercentage(75, 5000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: bodyToSend
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson.error?.message || 'Error desconocido del servidor de Google.';
        throw new Error(`Error en API (${response.status}): ${errMsg}`);
      }

      const responseData = await response.json();
      const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        throw new Error('La IA no devolvió contenido útil para este PDF.');
      }

      // Paso 4: Mapeando campos
      clearInterval(aiInterval);
      updateStep('ai', 'completed');
      updateStep('mapping', 'active');
      
      let mappingInterval = simulatePercentage(90, 800, () => {
        try {
          // Intentar parsear el JSON
          const cleanedText = rawText.trim();
          const parsedJSON = JSON.parse(cleanedText);
          appState.extractedData = parsedJSON;
          
          updateStep('mapping', 'completed');
          
          // Paso 5: Formatear y Finalizar
          updateStep('finalize', 'active');
          
          simulatePercentage(100, 500, () => {
            updateStep('finalize', 'completed');
            
            // Cargar datos en la UI y pasar al Workspace
            setTimeout(() => {
              renderResults(parsedJSON);
            }, 400);
          });
        } catch (parseErr) {
          console.error("Error al parsear el JSON de la IA: ", rawText);
          throw new Error('La respuesta de la IA no contiene un JSON válido. Revisa que el documento contenga un estudio socioeconómico legible.');
        }
      });

    } catch (error) {
      clearInterval(aiInterval);
      alert(`Fallo en la extracción: ${error.message}`);
      resetToUpload();
    }
  }

  // Restablecer el flujo inicial
  function resetToUpload() {
    processingStage.classList.add('hidden');
    resultStage.classList.add('hidden');
    uploadStage.classList.remove('hidden');
    fileInput.value = '';
    loaderPercentage.textContent = '0%';
  }

  btnReprocess.addEventListener('click', resetToUpload);

  // ==========================================================================
  // Renderizado del Dashboard y Visor de Código JSON
  // ==========================================================================
  
  // Coloreado de sintaxis JSON personalizado (eficiente y robusto)
  function syntaxHighlight(json) {
    if (typeof json != 'string') {
      json = JSON.stringify(json, null, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

  // Rellenar Ficha del Candidato en base al JSON
  function renderResults(data) {
    // 1. Cabecera e Identificación
    const nombre = data.nombre || 'Candidato sin nombre';
    infoNombre.textContent = nombre;
    infoNombre.title = nombre;
    
    infoPuesto.textContent = data.puesto || 'Puesto no especificado';
    infoEmpresa.textContent = data.empresa || 'Empresa no especificada';
    
    const edad = data.edad || '--';
    infoEdad.textContent = edad !== '--' ? `${edad} años` : 'Edad no especificada';
    
    // Iniciales
    const nameParts = nombre.split(' ').filter(n => n.length > 0);
    let initials = '--';
    if (nameParts.length >= 2) {
      initials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      initials = nameParts[0].substring(0, 2).toUpperCase();
    }
    candidateInitials.textContent = initials;

    // 2. Información General
    infoSexo.textContent = data.sexo || 'No especificado';
    infoEstadoCivil.textContent = data.estadoCivil || 'No especificado';
    infoTelefonos.textContent = data.telefonos || 'Sin números';
    
    // Dirección
    const direccionParts = [];
    if (data.calle) direccionParts.push(data.calle);
    if (data.colonia) direccionParts.push(data.colonia);
    if (data.municipio) direccionParts.push(data.municipio);
    if (data.estado) direccionParts.push(data.estado);
    if (data.cp) direccionParts.push(`C.P. ${data.cp}`);
    infoDireccion.textContent = direccionParts.length > 0 ? direccionParts.join(', ') : 'No especificada';
    
    // Estudios Máximos
    infoEstudios.textContent = data.gradoEstudios || 'No especificado';
    
    // Historial Laboral (Último empleo)
    if (data.empleos && data.empleos.length > 0 && data.empleos[0].empresa) {
      const ultimo = data.empleos[0];
      infoUltimoEmpleo.textContent = `${ultimo.puesto || 'Puesto'} en ${ultimo.empresa} (${ultimo.periodo || 'Periodo'})`;
    } else {
      infoUltimoEmpleo.textContent = 'Sin historial registrado';
    }

    // Contadores de referencias
    const refCount = data.referencias ? data.referencias.filter(r => r.nombre).length : 0;
    infoRefLaborales.textContent = `${refCount} referencias registradas`;

    const refVecCount = data.referenciasVecinales ? data.referenciasVecinales.filter(rv => rv.nombre).length : 0;
    infoRefVecinales.textContent = `${refVecCount} referencias vecinales`;

    // 3. Dictamen final visual
    const dictamen = (data.dictamen || '').toUpperCase();
    infoDictamen.className = 'dictamen-badge'; // Reset classes
    
    if (dictamen.includes('APROBADO') && !dictamen.includes('NO APROBADO') && !dictamen.includes('CONDICIONADO')) {
      infoDictamen.textContent = data.dictamen;
      infoDictamen.classList.add('dictamen-aprobado');
    } else if (dictamen.includes('NO APROBADO') || dictamen.includes('RECHAZADO') || dictamen.includes('NO RECOMENDABLE')) {
      infoDictamen.textContent = data.dictamen;
      infoDictamen.classList.add('dictamen-no-aprobado');
    } else if (dictamen.includes('CONDICIONADO') || dictamen.includes('RESERVAS') || dictamen.includes('PENDIENTE')) {
      infoDictamen.textContent = data.dictamen;
      infoDictamen.classList.add('dictamen-condicionado');
    } else {
      infoDictamen.textContent = data.dictamen || 'SIN EVALUACIÓN DIRECTA';
      infoDictamen.classList.add('dictamen-condicionado');
    }

    // 4. Formatear y Colorear el código JSON
    const jsonString = JSON.stringify(data, null, 2);
    jsonCode.innerHTML = syntaxHighlight(jsonString);

    // 5. Configurar Nombre del Archivo Dinámico
    // Limpiar nombre quitando acentos y caracteres especiales
    const normalizedName = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/__+/g, "_")
      .substring(0, 30);
    
    outputFilename.value = `ESE_${normalizedName || 'candidato'}`;
    
    // Pasar a la fase de resultados
    processingStage.classList.add('hidden');
    resultStage.classList.remove('hidden');
  }

  // ==========================================================================
  // Botones de Copiar y Descargar
  // ==========================================================================
  
  // Copiar al Portapapeles
  btnCopy.addEventListener('click', () => {
    if (!appState.extractedData) return;
    
    const rawJson = JSON.stringify(appState.extractedData, null, 2);
    
    navigator.clipboard.writeText(rawJson)
      .then(() => {
        btnCopyText.textContent = '¡Copiado!';
        btnCopy.classList.add('btn-primary'); // Feedback visual temporal
        btnCopy.classList.remove('btn-secondary');
        
        setTimeout(() => {
          btnCopyText.textContent = 'Copiar JSON';
          btnCopy.classList.remove('btn-primary');
          btnCopy.classList.add('btn-secondary');
        }, 2000);
      })
      .catch(err => {
        console.error('Error al copiar el texto: ', err);
        alert('No se pudo copiar el archivo al portapapeles.');
      });
  });

  // Descarga directa del archivo .json
  btnDownload.addEventListener('click', () => {
    if (!appState.extractedData) return;
    
    const rawJson = JSON.stringify(appState.extractedData, null, 2);
    const blob = new Blob([rawJson], { type: 'application/json' });
    
    // Personalizar nombre de archivo final
    let customName = outputFilename.value.trim();
    if (!customName) {
      customName = 'ESE_estudio';
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `${customName}.json`;
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // Ajustar ancho dinámico del input del nombre del archivo al escribir
  outputFilename.addEventListener('input', function() {
    this.style.width = Math.max(this.value.length * 8.5, 80) + 'px';
  });


});
