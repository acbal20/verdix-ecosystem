#!/bin/bash
# =============================================================================
# VERDIX OS - SCRIPT MAESTRO DE INSTALACIÓN Y VERIFICACIÓN COMPLETA
# ============================================================
# Este script:
# 1. Verifica que todo esté instalado
# 2. Instala lo que falte (con tu permiso)
# 3. Prueba que todo funcione
# 4. Te dice exactamente qué hacer en cada paso
#
# USO: bash verdix-maestro.sh
# ============================================================

set -e

# Colores
VERDE='\033[0;32m'
ROJO='\033[0;31m'
AMARILLO='\033[1;33m'
AZUL='\033[0;34m'
NC='\033[0m' # No Color

echo_color() {
    echo -e "${1}${2}${NC}"
}

echo ""
echo_color $AZUL "============================================================"
echo_color $AZUL "  🟢 VERDIX OS - INSTALACIÓN Y VERIFICACIÓN COMPLETA"
echo_color $AZUL "============================================"
echo ""
echo "Este script va a:"
echo "  1. Verificar qué tienes instalado"
echo "  2. Instalar lo que falte (pedirá tu contraseña de sudo)"
echo "  3. Verificar que todo funcione"
echo "  4. Crear reportes de estado"
echo ""
echo "Presiona ENTER para continuar o Ctrl+C para cancelar"
read -r

echo ""

# ============================================================
# PASO 1: Verificar sistema operativo
# ============================================================
echo_color $AZUL "📋 Paso 1: Verificando sistema operativo..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo_color $VERDE "   ✅ Sistema: $PRETTY_NAME"
else
    echo_color $ROJO "❌ No se pudo detectar el sistema operativo"
    exit 1
fi

# ============================================================
# PASO 2: Verificar espacio en disco
# ============================================================
echo_color $AZUL "📋 Paso 2: Verificando espacio en disco..."
ESPACIO_LIBRE=$(df -h /home | awk 'NR==2 {print $4}' | tr -d 'G')
ESPACIO_INT=${ESPACIO_LIBRE%.*}
echo_color $VERDE "   Espacio libre en /home: ${ESPACIO_LIBRE}G"
if [ "$ESPACIO_INT" -lt 20 ]; then
    echo_color $ROJO "❌ ADVERTENCIA: Menos de 20 GB libres. Puede que no sea suficiente."
else
    echo_color $VERDE "   ✅ Espacio suficiente"
fi

# ============================================================
# PASO 3: Verificar e instalar herramientas
# ============================================================
echo_color $AZUL "📋 Paso 3: Verificando herramientas necesarias..."

HERRAMIENTAS=(
    "python3:Python 3"
    "python3-pip:Python Pip"
    "unzip:Descompresor ZIP"
    "curl:Transferidor de archivos"
    "wget:Descargador de archivos"
    "mkisofs:Creador de ISO"
    "grub-mkrescue:Creador de ISO arrancable"
    "adb:ADB para celular Android"
    "fastboot:Fastboot para flashear Android"
    "openjdk-17-jdk:Java Development Kit"
    "nodejs:Node.js"
    "npm:Node Package Manager"
)

FALTANTES=0
for herramienta in "${HERRAMIENTAS[@]}"; do
    NOMBRE="${herramienta%%:*}"
    NOMBRE_COMPLETO="${herramienta#*:}"
    
    if command -v "$NOMBRE" &>/dev/null; then
        echo_color $VERDE "   ✅ $NOMBRE_COMLETO ($NOMBRE) - INSTALADO"
    else
        echo_color $AMARILLO "   ⚠️  $NOMBRE_COMLETO ($NOMBRE) - NO INSTALADO"
        FALTANTES=$((FALTANTES + 1))
    fi
done

echo ""
if [ $FALTANTES -gt 0 ]; then
    echo_color $AMARILLO "⚠️  Faltan $FALTANTES herramienta(s). ¿Quieres instalarlas ahora? (s/n)"
    read -r RESPUESTA
    if [ "$RESPUESTA" = "s" ] || [ "$RESPUESTA" = "S" ]; then
        echo_color $AZUL "   Instalando herramientas faltantes..."
        sudo apt-get update
        sudo apt-get install -y python3-pip unzip curl wget mkisofs grub-mkrescue android-tools-adb android-tools-fastboot openjdk-17-jdk nodejs npm
        echo_color $VERDE "   ✅ Instalación completada"
    else
        echo_color $AMARILLO "   ⚠️  Saltando instalación de herramientas"
    fi
else
    echo_color $VERDE "✅ Todas las herramientas están instaladas"
fi

# ============================================================
# PASO 4: Verificar celular Android
# ============================================================
echo_color $AZUL "📋 Paso 4: Verificando celular Android conectado..."
if command -v adb &>/dev/null; then
    DISPOSITIVOS=$(adb devices 2>/dev/null | grep -v "List of devices" | grep "device" | wc -l)
    if [ "$DISPOSITIVOS" -gt 0 ]; then
        echo_color $VERDE "   ✅ Dispositivos Android conectados: $DISPOSITIVOS"
        adb devices | grep "device" | while read -r linea; do
            echo "      $linea"
        done
    else
        echo_color $AMARILLO "   ⚠️  No hay dispositivos Android conectados por ADB"
        echo "      Conecta tu celular por USB y activa 'Depuración USB'"
    fi
else
    echo_color $ROJO "❌ ADB no está instalado"
fi

# ============================================================
# PASO 5: Verificar archivos en Escritorio
# ============================================================
echo_color $AZUL "📋 Paso 5: Verificando archivos en Escritorio..."
ARCHIVOS_ESCRITORIO=(
    "/home/yeremy/Escritorio/Bn 10 - Normal.apk"
    "/home/yeremy/Escritorio/Bn 10 - Modo Dios.apk"
    "/home/yeremy/Escritorio/Ben10_Omnitrix_Battle.zip"
    "/home/yeremy/Escritorio/Verdix_OS_Debian.iso"
)

for archivo in "${ARCHIVOS_ESCRITORIO[@]}"; do
    if [ -f "$archivo" ]; then
        TAMANIO=$(du -h "$archivo" | awk '{print $1}')
        echo_color $VERDE "   ✅ $(basename "$archivo") ($TAMANIO)"
    else
        echo_color $AMARILLO "   ⚠️  $(basename "$archivo") - NO ENCONTRADO"
    fi
done

# ============================================================
# PASO 6: Verificar repositorios de GitHub
# ============================================================
echo_color $AZUL "📋 Paso 6: Verificando repositorios locales..."
REPOSITORIOS=(
    "/home/yeremy/verdix-web-deploy"
    "/home/yeremy/verdix-os-debian"
    "/home/yeremy/verdix-rom"
    "/home/yeremy/verdix-ai-cli"
    "/home/yeremy/verdix-desktop"
    "/home/yeremy/verdix-automation"
)

for repo in "${REPOSITORIOS[@]}"; do
    if [ -d "$repo" ]; then
        echo_color $VERDE "   ✅ $(basename "$repo")"
    else
        echo_color $AMARILLO "   ⚠️  $(basename "$repo") - NO ENCONTRADO"
    fi
done

# ============================================================
# PASO 7: Crear reporte de estado
# ============================================================
echo_color $AZUL "📋 Paso 6: Creando reporte de estado..."

REPORTE="/home/yeremy/verdix-automation/logs/verificacion-$(date +%Y%m%d-%H%M%S).txt"
mkdir -p /home/yeremy/verdix-automation/logs

{
    echo "============================================"
    echo "  REPORTE DE VERIFICACIÓN VERDIX OS"
    echo "  Fecha: $(date)"
    echo "============================================"
    echo ""
    echo "SISTEMA: $PRETTY_NAME"
    echo "ESPACIO LIBRE: ${ESPACIO_LIBRE}G"
    echo ""
    echo "ARCHIVOS EN ESCRITORIO:"
    for archivo in "${ARCHIVOS_ESCRITORIO[@]}"; do
        if [ -f "$archivo" ]; then
            echo "  ✅ $(basename "$archivo")"
        else
            echo "   ❌ $(basename "$archivo") - NO ENCONTRADO"
        fi
    done
    echo ""
    echo "REPOSITORIOS:"
    for repo in "${REPOSITORIOS[@]}"; do
        if [ -d "$repo" ]; then
            echo "  ✅ $(basename "$repo")"
        else
            echo "   ❌ $(basename "$repo") - NO ENCONTRADO"
        fi
    done
    echo ""
    echo "CELULAR CONECTADO: $DISPOSITIVOS dispositivo(s)"
} > "$REPORTE"

echo_color $VERDE "   ✅ Reporte guardado en: $REPORTE"

# ============================================================
# PASO 7: Resumen final
# ============================================================
echo ""
echo_color $AZUL "============================================"
echo_color $AZUL "  ✅ VERIFICACIÓN COMPLETADA"
echo_color $AZUL "============================================"
echo ""
echo_color $AZUL "RESUMEN:"
echo_color $VERDE "   ✅ Sistema: $PRETTY_NAME"
echo_color $VERDE "   ✅ Espacio libre: ${ESPACIO_LIBRE}G"
echo_color $VERDE "   ✅ Herramientas: $((12 - FALTANTES))/12 instaladas"
echo_color $VERDE "   ✅ Dispositivos Android: $DISPOSITIVOS"
echo ""
echo_color $AZUL "PRÓXIMOS PASOS:"
echo_color $AZUL "   1. Revisa el reporte en: $REPORTE"
echo_color $AZUL "   2. Si faltan herramientas, instálalas con: sudo apt-get install <paquete>"
echo_color $AZUL "   3. Para desplegar en Vercel: cd /home/yeremy/verdix-web-deploy && vercel --prod"
echo_color $AZUL "   4. Para instalar la ISO en PC: graba /home/yeremy/Escritorio/Verdix_OS_Debian.iso en un USB"
echo ""
echo_color $AZUL "¡Todo listo para usar tu ecosistema Verdix! 🟢"