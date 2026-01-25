#!/usr/bin/env bash

# Script para configurar google-services.json antes del build en EAS
# Este archivo se ejecuta automáticamente durante el proceso de build

set -e

if [ -n "$GOOGLE_SERVICES_JSON" ]; then
  echo "📝 Configurando google-services.json desde variable de entorno..."
  
  # Crear el archivo google-services.json desde la variable de entorno
  echo "$GOOGLE_SERVICES_JSON" > google-services.json
  
  # Crear el directorio android/app si no existe y copiar el archivo
  mkdir -p android/app
  echo "$GOOGLE_SERVICES_JSON" > android/app/google-services.json
  
  echo "✅ google-services.json configurado correctamente"
else
  echo "❌ Error: La variable de entorno GOOGLE_SERVICES_JSON no está definida"
  echo "Por favor, configúrala en EAS Secrets"
  exit 1
fi
