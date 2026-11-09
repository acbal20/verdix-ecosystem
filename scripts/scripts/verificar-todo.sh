#!/bin/bash
# ============================================================
# VERDIX OS - Script Maestro de Validación y Corrección
# ============================================================

set -e

echo "============================================"
echo "  🟢 VERDIX OS - Validación y Corrección"
echo "============================================"
echo ""

# Colores
VERDE='\033[0;32m'
ROJO='\033[0;31m'
AMARILLO='\033[1;33m'
AZUL='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
echo_color() {
    echo -e "${1}${2}${NC}"
}

echo_color $AZUL "🔍 Iniciando validación completa del ecosistema Verdix..."
echo ""

# Paso 1: Verificar que existan los archivos críticos
echo_color $AZUL "📋 Paso 1: Verificando archivos críticos..."
ARCHIVOS_CRITICOS=(
    "/home/yeremy/verdix-web/index.html"
    "/home/yeremy/verdix-web/ai.html"
    "/home/yeremy/verdix-web/search.html"
    "/home/yeremy/verdix-web/browser.html"
    "/home/yeremy/verdix-web/api/chat.js"
    "/home/yeremy/verdix-web/api/search.js"
    "/home/yeremy/Ben10_Web/index.html"
    "/home/yeremy/Escritorio/Bn 10 - Normal.apk"
    "/home/yeremy/Escritorio/Bn 10 - Modo Dios.apk"
    "/home/yeremy/Escritorio/Ben10_Omnitrix_Battle.zip"
    "/home/yeremy/Escritorio/Verdix_OS_Debian.iso"
)

ARCHIVOS_FALTANTES=0
for archivo in "${ARCHIVOS_CRITICOS[@]}"; do
    if [ -f "$archivo" ]; then
        echo_color $VERDE "  ✅ $archivo"
    else
        echo_color $ROJO "  ❌ $archivo - NO ENCONTRADO"
        ARCHIVOS_FALTANTES=$((ARCHIVOS_FALTANTES + 1))
    fi
done

if [ $ARCHIVOS_FALTANTES -gt 0 ]; then
    echo_color $ROJO "❌ $ARCHIVOS_FALTANTES archivo(s) crítico(s) faltante(s)"
    exit 1
else
    echo_color $VERDE "✅ Todos los archivos críticos están presentes"
fi

echo ""

# Paso 2: Ejecutar el autobot de Python
echo_color $AZUL "🤖 Paso 2: Ejecutando autobot de validación..."
cd /home/yeremy/verdix-automation/scripts
python3 verdix-autobot.py
CODIGO_SALIDA=$?

echo ""
echo_color $AZUL "============================================"
if [ $CODIGO_SALIDA -eq 0 ]; then
    echo_color $VERDE "✅ TODO EL ECOSISTEMA FUNCIONA CORRECTAMENTE"
elif [ $CODIGO_SALIDA -eq 1 ]; then
    echo_color $AMARILLO "⚠️ HAY ADVERTENCIAS PERO EL SISTEMA FUNCIONA"
else
    echo_color $ROJO "❌ HAY ERRORES CRÍTICOS QUE REQUIEREN ATENCIÓN"
fi
echo_color $AZUL "============================================"

exit $CODIGO_SALIDA