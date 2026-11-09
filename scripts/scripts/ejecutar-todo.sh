#!/bin/bash
# ============================================================
# VERDIX OS - Script Maestro de Ejecución Completa
# ============================================================

set -e

echo "============================================"
echo "  🟢 VERDIX OS - EJECUCIÓN COMPLETA"
echo "============================================"
echo ""

# Paso 1: Verificar y corregir
echo_color() {
    echo -e "${1}${2}${NC}
}
NC='\033[0m'
VERDE='\033[0;32m'
ROJO='\033[0;31m'
AMARILLO='\033[1;33m'

echo_color $AMARILLO "📋 Paso 1: Ejecutando autobot de validación..."
cd /home/yeremy/verdix-automation/scripts
python3 verdix-autobot.py
CODIGO_VALIDACION=$?

echo ""

if [ $CODIGO_VALIDACION -eq 0 ]; then
    echo_color $VERDE "✅ Todo funciona correctamente"
elif [ $CODIGO_VALIDACION -eq 1 ]; then
    echo_color $AMARILLO "⚠️ Hay advertencias pero el sistema funciona"
else
    echo_color $ROJO "❌ Hay errores críticos"
fi

echo ""

# Paso 2: Desplegar en Vercel
echo_color $AMARILLO "📋 Paso 2: Desplegando en Vercel..."
cd /home/yeremy/verdix-web-deploy
git add .
git commit -m "Actualización automática $(date +%Y-%m-%d\ %H:%M:%S)"
git push -u origin master --force
vercel --prod

echo ""
echo_color $VERDE "============================================"
echo_color $VERDE "  ✅ TODO COMPLETADO"
echo_color $VERDE "============================================"
echo ""
echo_color $AZUL "🌐 Web: https://verdix-oficial.vercel.app"
echo_color $AZUL "📱 APKs: /home/yeremy/Escritorio/"
echo_color $AZUL "💿 ISO: /home/yeremy/Escritorio/Verdix_OS_Debian.iso"
echo_color $AZUL "📦 ZIP: /home/yeremy/Escritorio/Ben10_Omnitrix_Battle.zip"
echo ""

exit 0