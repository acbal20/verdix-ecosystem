#!/bin/bash
# ============================================================
# VERDIX OS - SCRIPT MAESTRO DE DESPLIEGUE COMPLETO
# ============================================================
# Este script despliega TODO el ecosistema Verdix:
# 1. Verifica que todo esté listo
# 2. Sube cambios a GitHub
# 3. Despliega en Vercel
# 4. Verifica que todo funcione
# ============================================================

set -e

# Colores
VERDE='\033[0;32m'
ROJO='\033[0;31m'
AMARILLO='\033[1;33m'
AZUL='\033[0;34m'
NC='\033[0m'

echo_color() {
    echo -e "${1}${2}${NC}"
}

echo_color $AZUL ""
echo_color $AZUL "============================================"
echo_color $AZUL "  🚀 VERDIX OS - DESPLIEGUE COMPLETO"
echo_color $AZUL "============================================"
echo ""

# Paso 1: Verificar que estamos en el directorio correcto
echo_color $AZUL "📋 Paso 1: Verificando entorno..."
if [ ! -f "/home/yeremy/verdix-web-deploy/index.html" ]; then
    echo_color $ROJO "❌ No se encontró el directorio vercel-web-deploy"
    echo "   Asegúrate de estar en el directorio correcto"
    exit 1
fi
echo_color $VERDE "✅ Directorio vercel-web-deploy encontrado"

# Paso 2: Verificar archivos críticos
echo_color $AZUL "📋 Paso 2: Verificando archivos críticos..."
ARCHIVOS_CRITICOS=(
    "/home/yeremy/verdix-web-deploy/index.html"
    "/home/yeremy/verdix-web-deploy/ai.html"
    "/home/yeremy/verdix-web-deploy/search.html"
    "/home/yeremy/verdix-web-deploy/browser.html"
    "/home/yeremy/verdix-web-deploy/download.html"
    "/home/yeremy/verdix-web-deploy/api/chat.js"
    "/home/yeremy/verdix-web-deploy/api/search.js"
    "/home/yeremy/Ben10_Web/index.html"
)

ARCHIVOS_FALTANTES=0
for archivo in "${ARCHIVOS_CRITICOS[@]}"; do
    if [ -f "$archivo" ]; then
        echo_color $VERDE "   ✅ $archivo"
    else
        echo_color $ROJO "   ❌ $archivo - NO ENCONTRADO"
        ARCHIVOS_FALTANTES=$((ARCHIVOS_FALTANTES + 1))
    fi
done

if [ $ARCHIVOS_FALTANTES -gt 0 ]; then
    echo_color $ROJO "❌ $ARCHIVOS_FALTANTES archivo(s) faltante(s)"
    exit 1
fi
echo_color $VERDE "✅ Todos los archivos críticos están presentes"

# Paso 3: Subir a GitHub
echo_color $AZUL "📋 Paso 3: Subiendo cambios a GitHub..."
cd /home/yeremy/verdix-web-deploy
git add .
git commit -m "Actualización automática del ecosistema Verdix $(date +%Y-%m-%d\ %H:%M:%S)"
git push -u origin master --force

if [ $? -eq 0 ]; then
    echo_color $VERDE "✅ Código subido a GitHub exitosamente"
else
    echo_color $ROJO "❌ Error al subir a GitHub"
    echo "   Asegúrate de tener configurado el remoto y credenciales"
    exit 1
fi

# Paso 4: Desplegar en Vercel
echo_color $AZUL "📋 Paso 4: Desplegando en Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo_color $VERDE "✅ Despliegue en Vercel exitoso"
else
    echo_color $ROJO "❌ Error en el despliegue de Vercel"
    exit 1
fi

# Paso 5: Verificar que todo funcione
echo_color $AZUL "📋 Paso 5: Verificando despliegue..."

# Esperar un momento para que Vercel termine de desplegar
echo_color $AMARILLO "   Esperando 10 segundos para que Vercel termine de desplegar..."
sleep 10

# Verificar páginas críticas
URLS_VERIFICAR=(
    "https://verdix-ecosystem.vercel.app/index.html"
    "https://verdix-ecosystem.vercel.app/ai.html"
    "https://verdix-ecosystem.vercel.app/search.html"
    "https://verdix-ecosystem.vercel.app/browser.html"
    "https://verdix-ecosystem.vercel.app/download.html"
    "https://verdix-ecosystem.vercel.app/apk/juego/index.html"
)

TODAS_OK=true
for url in "${URLS_VERIFICAR[@]}"; do
    CODIGO=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$CODIGO" = "200" ]; then
        echo_color $VERDE "   ✅ $url - HTTP 200 OK"
    else
        echo_color $ROJO "   ❌ $url - HTTP $CODIGO"
        TODAS_OK=false
    fi
done

echo ""
echo_color $AZUL "============================================"
if [ "$TODAS_OK" = true ]; then
    echo_color $VERDE "  ✅ TODO DESPLEGADO Y FUNCIONANDO"
else
    echo_color $ROJO "  ❌ ALGUNAS PÁGINAS NO RESPONDEN"
fi
echo_color $AZUL "============================================"
echo ""

echo_color $AZUL "📋 RESUMEN DEL DESPLIEGUE:"
echo_color $AZUL "   🌐 Web: https://verdix-ecosystem.vercel.app"
echo_color $AZUL "   🧠 IA: https://verdix-ecosystem.vercel.app/ai.html"
echo_color $AZUL "   🔍 Buscador: https://verdix-ecosystem.vercel.app/search.html"
echo_color $AZUL "   🌐 Navegador: https://verdix-ecosystem.vercel.app/browser.html"
echo_color $AZUL "   📦 Descargas: https://verdix-ecosystem.vercel.app/download.html"
echo_color $AZUL "   🎮 Juego: https://verdix-ecosystem.vercel.app/apk/juego/index.html"
echo_color $AZUL "   🛡️ Pruebas: https://verdix-ecosystem.vercel.app/test-errors.html"
echo ""
echo_color $AZUL "📱 APKs en /home/yeremy/Escritorio/:"
echo_color $AZUL "   - Bn 10 - Normal.apk"
echo_color $AZUL "   - Bn 10 - Modo Dios.apk"
echo_color $AZUL "   - Ben10_Omnitrix_Battle.zip"
echo_color $AZUL "💿 ISO en /home/yeremy/Escritorio/Verdix_OS_Debian.iso"
echo ""

echo_color $VERDE "¡ECOSISTEMA VERDIX COMPLETAMENTE DESPLEGADO! 🟢"