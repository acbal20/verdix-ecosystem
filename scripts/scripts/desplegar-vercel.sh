#!/bin/bash
# ============================================================
# VERDIX OS - Script de Despliegue en Vercel
# ============================================================

set -e

echo "============================================"
echo "  🚀 VERDIX - Despliegue en Vercel"
echo "============================================"
echo ""

# Verificar que estemos en el directorio correcto
if [ ! -f "/home/yeremy/verdix-web-deploy/package.json" ] && [ ! -f "/home/yeremy/verdix-web-deploy/index.html" ]; then
    echo "❌ No se encontró el directorio del proyecto web"
    echo "   Asegúrate de estar en /home/yeremy/verdix-web-deploy"
    exit 1
fi

cd /home/yeremy/verdix-web-deploy

echo "📋 Verificando archivos..."
if [ ! -f "index.html" ]; then
    echo "❌ No se encontró index.html"
    exit 1
fi

echo "✅ index.html encontrado"

echo ""
echo "📦 Subiendo cambios a GitHub..."
git add .
git commit -m "Actualización automática del ecosistema Verdix $(date +%Y-%m-%d\ %H:%M:%S)"
git push -u origin master --force

echo ""
echo "🚀 Desplegando en Vercel..."
vercel --prod

echo ""
echo "✅ Despliegue completado"
echo "🌐 Web disponible en: https://verdix-oficial.vercel.app"
