#!/usr/bin/env node

// Script para configurar google-services.json antes del build en EAS
// Nota importante: En EAS, las variables de entorno de tipo "file" se exponen como
// una RUTA a un archivo temporal en el runner (no como el contenido en texto).

const fs = require("fs");
const path = require("path");

const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON;

function stripBom(text) {
  if (typeof text !== "string") return text;
  // U+FEFF BOM
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function readGoogleServicesJson(value) {
  if (!value) return null;

  // Si EAS nos dio una ruta a archivo (file env var), leer ese archivo.
  try {
    if (fs.existsSync(value) && fs.statSync(value).isFile()) {
      const fileText = fs.readFileSync(value, "utf8");
      return { source: "filePath", text: fileText, filePath: value };
    }
  } catch {
    // Si falla stat/read, seguimos y tratamos value como contenido inline.
  }

  // Si no era ruta válida, asumir que es el contenido inline (string env var).
  return { source: "inline", text: value };
}

if (!GOOGLE_SERVICES_JSON) {
  console.error(
    "❌ Error: La variable de entorno GOOGLE_SERVICES_JSON no está definida"
  );
  console.error(
    'Crea una variable EAS de tipo "file" para google-services.json (recomendado)'
  );
  process.exit(1);
}

try {
  const result = readGoogleServicesJson(GOOGLE_SERVICES_JSON);
  if (!result) throw new Error("No se pudo leer GOOGLE_SERVICES_JSON");

  const jsonText = stripBom(result.text).trim();
  if (!jsonText) {
    throw new Error(
      "El contenido de google-services.json está vacío. " +
        'Si usas EAS env var tipo "file", asegúrate de que apunte a un archivo no vacío.'
    );
  }

  // Validar que sea JSON válido (sin loggear el contenido por seguridad).
  try {
    JSON.parse(jsonText);
  } catch (e) {
    throw new Error(
      'El contenido no es JSON válido. En EAS, las variables tipo "file" entregan una ruta. ' +
        "Este script ya soporta rutas; revisa que el archivo subido sea realmente google-services.json. " +
        `Detalles: ${e.message}`
    );
  }

  const rootTarget = path.join(process.cwd(), "google-services.json");
  const androidAppDir = path.join(process.cwd(), "android", "app");
  const androidTarget = path.join(androidAppDir, "google-services.json");

  console.log("📝 Configurando google-services.json para Android...");
  console.log(
    `- Fuente: ${result.source}${result.filePath ? ` (${result.filePath})` : ""}`
  );
  console.log(`- Tamaño: ${Buffer.byteLength(jsonText, "utf8")} bytes`);

  fs.writeFileSync(rootTarget, jsonText, "utf8");
  fs.mkdirSync(androidAppDir, { recursive: true });
  fs.writeFileSync(androidTarget, jsonText, "utf8");

  console.log("✅ google-services.json configurado correctamente");
  process.exit(0);
} catch (error) {
  console.error("❌ Error al configurar google-services.json:", error.message);
  process.exit(1);
}
