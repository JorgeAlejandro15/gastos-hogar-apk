#!/usr/bin/env node

// Script para configurar google-services.json antes del build en EAS
// Este archivo se ejecuta automáticamente durante el proceso de build

const fs = require('fs');
const path = require('path');

const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON;

if (!GOOGLE_SERVICES_JSON) {
  console.error('❌ Error: La variable de entorno GOOGLE_SERVICES_JSON no está definida');
  console.error('Por favor, configúrala en EAS Secrets');
  process.exit(1);
}

try {
  console.log('📝 Configurando google-services.json desde variable de entorno...');

  // Crear el archivo google-services.json en la raíz del proyecto
  fs.writeFileSync(
    path.join(process.cwd(), 'google-services.json'),
    GOOGLE_SERVICES_JSON,
    'utf8'
  );

  // Crear el directorio android/app si no existe
  const androidAppDir = path.join(process.cwd(), 'android', 'app');
  fs.mkdirSync(androidAppDir, { recursive: true });

  // Copiar el archivo al directorio android/app
  fs.writeFileSync(
    path.join(androidAppDir, 'google-services.json'),
    GOOGLE_SERVICES_JSON,
    'utf8'
  );

  console.log('✅ google-services.json configurado correctamente');
} catch (error) {
  console.error('❌ Error al configurar google-services.json:', error.message);
  process.exit(1);
}
