#!/bin/bash
# ============================================================
# VERDIX OS - Script de Despliegue en Vercel
# ============================================================

set -e

echo "============================================"
echo "  🚀 VERDIX - Despliegue en Vercel"
echo "============================================"
echo ""

# Directorio del repo (portable, sin rutas de usuario fijas)
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Verificar que estemos en el directorio correcto
if [ ! -f "$REPO_ROOT/web/index.html" ]; then
    echo "❌ No se encontró el directorio del proyecto web"
    echo "   Se esperaba: $REPO_ROOT/web/index.html"
    exit 1
fi

cd "$REPO_ROOT/web"

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
git push -u origin master

echo ""
echo "🚀 Desplegando en Vercel..."
vercel --prod

echo ""
echo "✅ Despliegue completado"
echo "🌐 Web disponible en: https://verdix-ecosystem.vercel.app"
