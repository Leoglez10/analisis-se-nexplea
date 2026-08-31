<div align="center">

# SE-Extract AI

### Extractor Socioeconómico Nexplea: convierte estudios socioeconómicos en PDF a JSON estructurado

![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=flat-square)
![Gemini](https://img.shields.io/badge/IA-Google%20Gemini-4285F4?style=flat-square)
![Vercel](https://img.shields.io/badge/deploy-Vercel-000000?style=flat-square)
![Netlify](https://img.shields.io/badge/deploy-Netlify-00C7B7?style=flat-square)
![Build](https://img.shields.io/badge/build-sin%20dependencias-555555?style=flat-square)

</div>

> Este README sirve a tres públicos: quien va a **usar** la herramienta, quien va a **desplegarla** y quien va a **modificar el código**.
> Para usarla, ve a [Cómo se usa](#-cómo-se-usa). Para publicarla, ve a [Despliegue](#-despliegue). Para programar, ve a [Desarrollo](#-desarrollo).

---

## 📑 Índice

- [¿Qué es?](#-qué-es)
- [Cómo funciona](#-cómo-funciona)
- [Cómo se usa](#-cómo-se-usa)
- [Formato de salida: el esquema ESE](#-formato-de-salida-el-esquema-ese)
- [Reglas de extracción](#-reglas-de-extracción)
- [Configuración](#-configuración)
- [Despliegue](#-despliegue)
- [Desarrollo](#-desarrollo)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Datos y privacidad](#-datos-y-privacidad)
- [Seguridad](#-seguridad)
- [Limitaciones conocidas](#-limitaciones-conocidas)
- [Problemas frecuentes](#-problemas-frecuentes)
- [Preguntas frecuentes](#-preguntas-frecuentes)
- [Licencia](#-licencia)

---

## 🎯 ¿Qué es?

Un **estudio socioeconómico** es el informe que las empresas encargan antes de contratar a alguien: datos personales, domicilio, historial laboral, referencias, situación familiar, ingresos, egresos, vivienda y un dictamen final. Suele llegar como un PDF de decenas de páginas.

**SE-Extract AI** toma ese PDF y devuelve toda su información como un **archivo JSON con una estructura fija**, lista para cargar en otro sistema, en una base de datos o en una plantilla de documentos. Lo que normalmente sería media hora de copiar y pegar campo por campo se resuelve en una carga de archivo.

La aplicación muestra además una **ficha visual del candidato** con los datos clave (nombre, puesto, edad, domicilio, último empleo, referencias y dictamen) para revisar de un vistazo si la extracción salió bien antes de descargar el JSON.

### ¿Para quién es?

| Perfil | Caso de uso |
|---|---|
| Equipos de Recursos Humanos | Digitalizar estudios socioeconómicos recibidos en PDF |
| Empresas de investigación laboral | Convertir sus propios informes a un formato reutilizable |
| Desarrolladores | Alimentar un sistema interno con datos estructurados de candidatos |

---

## ⚙️ Cómo funciona

```text
PDF del estudio
   │  (se lee en el navegador y se codifica en base64)
   ▼
Función serverless  /api/extract
   │  añade la GEMINI_API_KEY del servidor
   ▼
Google Gemini  (por defecto gemini-2.5-flash)
   │  recibe el PDF + la plantilla ESE + las reglas de extracción
   │  responde en JSON (responseMimeType: application/json)
   ▼
Navegador
   ├─ Ficha visual del candidato
   └─ Visor de JSON con copiado y descarga
```

La interfaz recorre cinco hitos visibles durante el proceso: lectura del archivo, conexión con la API, análisis con IA, mapeo de campos y preparación del archivo descargable.

El PDF se envía completo al modelo (no se extrae texto previamente), de modo que también se aprovecha la lectura de tablas, casillas marcadas y estructura visual del documento.

---

## 🚶 Cómo se usa

### Requisitos

- Un navegador moderno.
- Una instancia desplegada de la aplicación con su clave de Gemini configurada (ver [Configuración](#-configuración)).
- El archivo debe ser un **PDF**. Cualquier otro formato se rechaza con un aviso.

### Pasos

1. Abre la aplicación.
2. Arrastra el PDF sobre la zona de carga, o haz clic para buscarlo en tu equipo.
3. Espera a que termine el procesamiento. La pantalla muestra el porcentaje y el hito en curso.
4. Revisa la **Ficha del Candidato** de la izquierda: nombre, puesto, empresa, edad, género, estado civil, teléfonos, grado de estudios, dirección completa, último empleo, número de referencias laborales y vecinales, y el dictamen.
5. En el panel derecho tienes el **JSON completo** con resaltado de sintaxis.
6. Cambia el nombre del archivo si quieres y pulsa **Descargar JSON**, o **Copiar JSON** para llevártelo al portapapeles.
7. **Cargar otro** vuelve a la pantalla inicial.

### Nombre del archivo descargado

Por defecto se propone `ESE_<nombre_del_candidato>.json`, normalizado a minúsculas, sin acentos ni caracteres especiales y recortado a 30 caracteres. Es editable antes de descargar. Si no hay nombre detectado, se usa `ESE_candidato`.

### El dictamen

La ficha resalta el dictamen con un color según lo que encuentre en el texto:

| Contiene | Se muestra como |
|---|---|
| `APROBADO` (sin "NO" ni "CONDICIONADO") | Aprobado |
| `NO APROBADO`, `RECHAZADO`, `NO RECOMENDABLE` | No aprobado |
| `CONDICIONADO`, `RESERVAS`, `PENDIENTE` | Condicionado |
| Nada reconocible | *SIN EVALUACIÓN DIRECTA* |

---

## 📦 Formato de salida: el esquema ESE

La salida sigue la plantilla definida en **`template.js`** (constante `ESE_TEMPLATE`). El archivo **`ESE.json`** de la raíz contiene exactamente esa misma estructura vacía y sirve como documento de referencia del esquema.

> 💡 La plantilla es el contrato: la IA recibe la instrucción explícita de **no crear, renombrar ni eliminar llaves**. El JSON de salida tiene siempre la misma forma, aunque algunos campos queden vacíos.

Son **60 llaves de primer nivel**. Agrupadas por bloques:

| Bloque | Llaves principales | Forma |
|---|---|---|
| Identificación | `fecha`, `puesto`, `empresa`, `nombre`, `lugarNacimiento`, `fechaNacimiento`, `edad`, `sexo`, `estadoCivil` | Texto |
| Domicilio | `calle`, `colonia`, `municipio`, `cp`, `estado`, `entreCalles` | Texto |
| Contacto y estudios | `telefonos`, `gradoEstudios`, `estudiosActuales` | Texto |
| Documentos | `docs` | Objeto con 15 documentos (`ine`, `curp`, `rfc`, `imss`, `actaNacimiento`, `compDomicilio`, …), cada uno con `checked` y `folio` |
| Escolaridad | `estudios` | Objeto por nivel (primaria, secundaria, bachillerato, licenciatura, …) con `periodo`, `escuela`, `certificado` y `promedio` |
| Perfil personal | `deporte`, `sindicato`, `partidoPolitico`, `religion`, `alcohol`, `tabaco`, `cirugias`, `enfermedadesFamilia`, `planes` | Objetos `respuesta` / `detalles` (y `cargo` donde aplica) |
| Familia | `familiares`, `laboralesFamiliares`, `notasLaboralesFamiliares` | Arreglos de objetos con `id` |
| Economía | `ingresos`, `egresos`, `solucionDeficit`, `bienes` | Arreglos de objetos con `id` |
| Vivienda | `tiempoResidencia`, `nivelZona`, `tipoVivienda`, `distribucion`, `mobiliarioCalidad`, `mobiliarioCantidad`, `tamanoVivienda`, `condicionesVivienda` | Mixto |
| Referencias | `referencias`, `referenciasVecinales` | Arreglos de objetos con `id` |
| Historial laboral | `empleos` | Arreglo de objetos con ~35 campos por empleo, incluidos los datos **validados** con la empresa anterior |
| Conclusiones | `conclusionPersonal`, `conclusionLaboral`, `conclusionSocio`, `dictamen` | Texto |
| Salida documental | `fotos`, `fotosNotas`, `fotosExtras`, `documentosExtras`, `marcaDeAguaEnExtras`, `incluirPortada`, `pageFormat` | Mixto |

Fragmento ilustrativo (recortado):

```json
{
  "nombre": "",
  "puesto": "",
  "docs": {
    "ine": { "checked": false, "folio": "" }
  },
  "empleos": [
    {
      "id": 1,
      "empresa": "",
      "puesto": "",
      "periodo": "",
      "sueldoInicial": "",
      "motivoSalida": "",
      "recontratable": ""
    }
  ],
  "dictamen": "",
  "pageFormat": "Letter"
}
```

La estructura completa está en [`ESE.json`](ESE.json).

---

## 📋 Reglas de extracción

El prompt que se envía al modelo (dentro de `app.js`, en `callGeminiAPI`) fija ocho reglas. Conviene conocerlas para interpretar la salida:

1. Las llaves del JSON se mantienen **idénticas** a la plantilla: no se añaden ni se renombran.
2. Los tipos se respetan. En los arreglos (`familiares`, `empleos`, `ingresos`, `referenciasVecinales`, …) se generan tantos objetos como existan, con `id` numérico secuencial.
3. En `docs`, un documento entregado se marca `"checked": true` y se rellena su `folio` si aparece; si no está presente, queda en `false` con `folio` vacío.
4. En los apartados de sí/no (`deporte`, `sindicato`, `partidoPolitico`, `alcohol`, `tabaco`, `cirugias`) solo se cambia el valor por defecto `"No"` cuando el documento lo afirma explícitamente.
5. En `dictamen` se busca la resolución final: `APROBADO`, `NO APROBADO`, `RECOMENDABLE CON RESERVAS` o `CONDICIONADO`.
6. Cada empleo del historial se extrae al detalle, incluidos jefes, sueldos, motivos de salida y campos validados.
7. Las fechas se escriben en formato `YYYY-MM-DD` cuando es posible.
8. La respuesta es **únicamente** el objeto JSON, sin explicaciones ni bloques de código.

---

## 🔧 Configuración

### Variables de entorno

| Variable | Obligatoria | Dónde se usa | Descripción |
|---|---|---|---|
| `GEMINI_API_KEY` | Sí | `api/extract.js` y `netlify/functions/extract.js` | Clave de la API de Google Gemini. Se configura en el panel del proveedor de hosting, nunca en el código. |

La plantilla está en [`.env.example`](.env.example). Cópiala como `.env` para desarrollo local (`.env` está en `.gitignore`).

Si la variable no está configurada, la función responde con un error 500 explicando exactamente eso.

### Modo local con clave en el navegador

`app.js` contempla un camino alternativo pensado **solo para pruebas locales**: si encuentra una clave en el navegador, llama directamente a Google en lugar de pasar por la función serverless. La busca en tres sitios, por este orden:

1. `window.LOCAL_GEMINI_API_KEY`, definida en un archivo `config.js` en la raíz (ignorado por Git y cargado por `index.html`).
2. La constante `GEMINI_API_KEY` al inicio de `app.js`, si se cambió su valor por defecto `"TU_API_KEY_AQUI"`.
3. La clave `gemini_api_key` de `localStorage` (la aplicación la lee, pero no ofrece ninguna pantalla para escribirla).

Ejemplo de `config.js` para desarrollo:

```js
window.LOCAL_GEMINI_API_KEY = "tu_api_key_de_gemini";
```

> ⚠️ **Nunca despliegues una instancia con la clave en el navegador.** En ese modo la clave viaja al cliente y queda visible para cualquiera que abra el código fuente. En producción debe usarse siempre la ruta serverless, que mantiene la clave en el servidor.

> 💡 `config.js` no existe en el repositorio y está en `.gitignore`. `index.html` lo carga de todos modos; si falta, el navegador registra un 404 en la consola y la aplicación sigue funcionando por la ruta serverless. Es el comportamiento esperado.

---

## 🚀 Despliegue

El proyecto es un sitio estático más **una** función serverless, duplicada para dos proveedores. Se elige uno de los dos; no hace falta mantener ambos.

### Vercel

Configuración en [`vercel.json`](vercel.json):

- La función [`api/extract.js`](api/extract.js) queda expuesta en `/api/extract` por convención de la carpeta `api/`.
- `maxDuration`: **60 segundos**.

Pasos:

1. Importa el repositorio en Vercel. No hay comando de build ni carpeta de salida que configurar.
2. En *Settings → Environment Variables*, añade `GEMINI_API_KEY`.
3. Despliega.

### Netlify

Configuración en [`netlify.toml`](netlify.toml):

- `publish = "."` — la raíz del repositorio es el sitio estático.
- `functions = "netlify/functions"` — allí vive [`netlify/functions/extract.js`](netlify/functions/extract.js).
- Timeout de la función `extract`: **90 segundos**.
- Una redirección envía `/api/*` a `/.netlify/functions/:splat`, de modo que el frontend puede llamar siempre a `/api/extract` sin saber en qué proveedor está.

Pasos:

1. Conecta el repositorio en Netlify.
2. En *Site configuration → Environment variables*, añade `GEMINI_API_KEY`.
3. Despliega.

> 💡 Las dos funciones hacen lo mismo y aceptan el mismo cuerpo de petición. La diferencia es la firma: Vercel usa `export default async function handler(request, response)` y Netlify usa `exports.handler = async function(event, context)`. Cualquier cambio en la lógica debe aplicarse **en los dos archivos**.

### El endpoint

```text
POST /api/extract
Content-Type: application/json

{
  "model": "gemini-2.5-flash",
  "contents": [...],
  "generationConfig": { "responseMimeType": "application/json" }
}
```

La función añade la clave, reenvía la petición a `generativelanguage.googleapis.com` y devuelve la respuesta de Google tal cual. Si `model` no viene, usa `gemini-2.5-flash`. Cualquier método distinto de `POST` recibe un 405.

### SEO y dominio

`index.html`, [`robots.txt`](robots.txt) y [`sitemap.xml`](sitemap.xml) apuntan al dominio `https://se-extract.ai/`. Si despliegas en otro dominio, actualiza la etiqueta `canonical`, las etiquetas Open Graph, el `sitemap.xml` y la línea `Sitemap:` de `robots.txt`. `robots.txt` ya excluye de la indexación las rutas `/api/`, `/netlify/` y `/.netlify/functions/`.

---

## 👨‍💻 Desarrollo

### Stack

- **Frontend en HTML, CSS y JavaScript sin framework ni compilación**: `index.html`, `styles.css`, `template.js` y `app.js`, cargados con etiquetas `<script>` clásicas.
- **Backend**: una función serverless por proveedor, sin dependencias. Usan el `fetch` global del runtime, por lo que requieren **Node.js 18 o superior**.
- Tipografías Plus Jakarta Sans y Fira Code desde Google Fonts.

No hay `package.json`, ni `npm install`, ni bundler, ni paso de build.

### Ejecutar en local

**Opción A — con la función serverless** (recomendada, reproduce producción):

```bash
# Vercel
npx vercel dev

# Netlify
npx netlify dev
```

Ambas herramientas sirven los archivos estáticos y la función, y leen la `GEMINI_API_KEY` del archivo `.env`.

**Opción B — sin función serverless**: sirve la carpeta con cualquier servidor estático y usa una clave en el navegador (ver [Modo local con clave en el navegador](#modo-local-con-clave-en-el-navegador)):

```bash
python3 -m http.server 8080
```

Sin clave local y sin función serverless, la llamada a `/api/extract` fallará: es el comportamiento esperado.

> ⚠️ Este repositorio **no incluye tests automatizados, linters ni workflows de CI.**

### Dónde tocar el código

| Qué quieres cambiar | Dónde |
|---|---|
| Estructura del JSON de salida | `ESE_TEMPLATE` en [`template.js`](template.js) (y actualiza [`ESE.json`](ESE.json) para que sigan coincidiendo) |
| Reglas que sigue la IA | La variable `promptText` en `callGeminiAPI()`, en [`app.js`](app.js) |
| Modelo de Gemini | `appState.model` en [`app.js`](app.js), y el valor por defecto en las dos funciones |
| Campos de la ficha del candidato | `renderResults()` en [`app.js`](app.js) y el marcado de `index.html` |
| Clasificación del dictamen | `renderResults()` en [`app.js`](app.js) |
| Nombre propuesto para el archivo | Final de `renderResults()` en [`app.js`](app.js) |
| Estilos y paleta | [`styles.css`](styles.css) |
| Lógica del proxy hacia Google | [`api/extract.js`](api/extract.js) **y** [`netlify/functions/extract.js`](netlify/functions/extract.js) |

> ⚠️ `template.js` y `ESE.json` contienen hoy exactamente la misma estructura, pero no están enlazados: `ESE.json` no lo carga ningún código, es documentación del esquema. Si cambias uno, cambia el otro a mano.

---

## 🗺 Estructura del proyecto

```text
analisis-se-nexplea/
├── index.html                  # Interfaz: carga, procesamiento y workspace de resultados
├── styles.css                  # Estilos de la aplicación
├── app.js                      # Lógica: lectura del PDF, prompt, llamada a la API y render
├── template.js                 # ESE_TEMPLATE: el esquema que se envía a la IA
├── ESE.json                    # Copia del esquema como documento de referencia
├── api/
│   └── extract.js              # Función serverless para Vercel
├── netlify/
│   └── functions/
│       └── extract.js          # Función serverless para Netlify
├── vercel.json                 # Configuración de Vercel (maxDuration 60 s)
├── netlify.toml                # Configuración de Netlify (publish, functions, redirección /api/*)
├── .env.example                # Plantilla de variables de entorno
├── robots.txt                  # Indexación, con /api/ excluido
├── sitemap.xml                 # Sitemap del sitio
└── skills-lock.json            # Registro de skills de asistente usadas en el desarrollo
```

`config.js` (clave local para desarrollo) está ignorado por Git y no forma parte del repositorio.

---

## 🔐 Datos y privacidad

Este punto importa más que en la mayoría de proyectos, porque un estudio socioeconómico contiene **datos personales sensibles**: domicilio exacto, teléfonos, salarios, composición familiar, religión, afiliación sindical y política, y datos de salud.

Qué ocurre con el archivo que cargas:

- **No se almacena.** No hay base de datos, ni sistema de archivos, ni caché. El PDF se lee en el navegador, se codifica y se envía en la petición; ni el frontend ni la función serverless guardan nada.
- **Sí sale de tu equipo.** El PDF completo se envía a la API de **Google Gemini** para su análisis. La función serverless actúa solo de intermediaria para no exponer la clave.
- **El resultado vive en la pestaña.** El JSON extraído solo existe en memoria hasta que lo copias o lo descargas. Recargar la página lo pierde.
- **Los registros del servidor** guardan el modelo usado y el tamaño del documento, no su contenido.

> ⚠️ Antes de usar esta herramienta con estudios reales, verifica que el envío de esos datos a un proveedor de IA externo cumple con la política de protección de datos de tu organización y con la normativa que te aplique.

---

## 🛡 Seguridad

Notas relevantes para operar la aplicación:

- **La clave de Gemini vive únicamente en el servidor.** En el repositorio no hay ninguna clave real: el valor de `app.js` es el marcador `"TU_API_KEY_AQUI"` y `.env` está ignorado por Git. Mantenlo así.
- **El endpoint `/api/extract` es público y responde con `Access-Control-Allow-Origin: *`.** No hay autenticación ni límite de peticiones: cualquiera que conozca la URL puede usarlo y consumir tu cuota de Gemini. Si vas a publicarlo, considera añadir autenticación, un límite de peticiones o una restricción de origen.
- **No subas la clave al navegador.** El modo de clave local descrito arriba es exclusivamente para desarrollo.
- **Registros**: la función de Netlify escribe en el log la longitud y los primeros caracteres de la clave para diagnóstico. Si tus registros son accesibles por terceros, conviene eliminar esa línea.
- **No hay límite de tamaño de archivo** en el cliente. Un PDF muy grande puede superar el límite de cuerpo de petición del proveedor de hosting antes de llegar a Google.

---

## ⚠️ Limitaciones conocidas

- **Un archivo a la vez.** No hay procesamiento por lotes.
- **Solo PDF.** Imágenes escaneadas sueltas u otros formatos no se aceptan.
- **La extracción es probabilística.** El modelo puede omitir o interpretar mal campos de un documento poco legible. La ficha del candidato existe precisamente para revisar antes de descargar. **Revisa siempre el resultado antes de darlo por bueno.**
- **El porcentaje de progreso es simulado.** Los saltos hasta el 75 % son animaciones temporizadas, no el avance real del modelo.
- **Los errores se muestran con `alert()`**, sin reintento automático. Un fallo obliga a volver a cargar el archivo.
- **Sin historial.** La aplicación no recuerda extracciones anteriores.
- **La rama de CORS pre-flight de la función de Netlify es inalcanzable**: la comprobación de método devuelve 405 antes de llegar a ella. No afecta al uso desde el propio sitio (misma URL de origen), pero sí impediría llamadas desde otro dominio.
- **La lógica está duplicada** en las dos funciones serverless, sin código compartido.
- **Sin tests ni CI.**

---

## 🔧 Problemas frecuentes

| Problema | Causa probable | Solución |
|---|---|---|
| "Por favor, selecciona un archivo en formato PDF" | El archivo no es un PDF | Convierte el documento a PDF antes de cargarlo |
| "Error de Configuración: La variable de entorno GEMINI_API_KEY no está configurada" | Falta la variable en el panel del hosting | Añade `GEMINI_API_KEY` y vuelve a desplegar |
| "La respuesta de la IA no contiene un JSON válido" | El PDF no es legible, no es un estudio socioeconómico, o el modelo devolvió texto adicional | Comprueba que el PDF tenga texto o imágenes legibles; reintenta |
| "La IA no devolvió contenido útil para este PDF" | El modelo no encontró nada extraíble, o el documento fue bloqueado por sus filtros | Revisa el contenido del PDF y reintenta |
| Error 429 o de cuota | Se agotó la cuota de la API de Gemini | Revisa los límites de tu clave en Google AI Studio |
| El proceso se corta antes de terminar | El PDF es grande y superó el tiempo máximo de la función (60 s en Vercel, 90 s en Netlify) | Reduce el tamaño del PDF o sube el límite si tu plan lo permite |
| Error 404 de `config.js` en la consola | `config.js` no existe: es lo normal fuera de desarrollo local | Ignóralo; no afecta al funcionamiento |
| La llamada a `/api/extract` devuelve 404 en local | Estás sirviendo solo los archivos estáticos | Usa `npx vercel dev` o `npx netlify dev`, o configura una clave local |

---

## ❓ Preguntas frecuentes

**¿Se guarda el PDF que subo?**
No. Ni el navegador ni la función serverless lo almacenan. Se procesa en la petición y desaparece.

**Pero entonces, ¿mis datos salen de mi equipo?**
Sí. El PDF se envía a la API de Google Gemini para el análisis. La herramienta no puede extraer nada sin ese envío.

**¿Necesito una clave de Google para usarla?**
Para usar una instancia ya publicada, no. Para desplegar la tuya, sí: necesitas una clave de la API de Gemini configurada como `GEMINI_API_KEY`.

**¿Qué modelo usa?**
`gemini-2.5-flash` por defecto, tanto en el cliente como en las funciones serverless.

**¿Puedo cambiar los campos que extrae?**
Sí. Edita `ESE_TEMPLATE` en `template.js`: la plantilla se envía al modelo dentro del prompt, así que la salida se adapta automáticamente. Actualiza también `ESE.json` para que la documentación del esquema siga coincidiendo.

**¿Puedo procesar varios estudios de golpe?**
No en esta versión. Es un archivo a la vez.

**¿El JSON siempre trae todos los campos?**
Sí. La estructura es siempre la misma, aunque los campos que el documento no aporte queden vacíos.

**¿Hay que elegir entre Vercel y Netlify?**
Sí, se despliega en uno de los dos. La configuración de ambos está incluida para no atar el proyecto a un proveedor concreto.

---

## 📄 Licencia

Este repositorio **no incluye un archivo de licencia**. Todos los derechos quedan reservados por su autor mientras no se añada una.

---

<div align="center">

### Desarrollado por **Leonardo González** para **Nexplea**

[![GitHub](https://img.shields.io/badge/GitHub-Leoglez10-181717?style=flat-square&logo=github)](https://github.com/Leoglez10)

</div>
