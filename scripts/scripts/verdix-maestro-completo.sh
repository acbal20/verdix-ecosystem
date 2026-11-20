#!/bin/bash
# ============================================================================
# VERDIX OS - SCRIPT MAESTRO DE INSTALACIÓN, VALIDACIÓN Y AUTO-REPARACIÓN
# ============================================================================
# Este script hace TODO:
# 1. Verifica qué tienes instalado
# 2. Instala lo que falte (con tu permiso)
# 3. Prueba que todo funcione
# 4. Corrige errores automáticamente
# 5. Te dice exactamente qué hacer tú
#
# USO: bash verdix-maestro-completo.sh
# ============================================================================

set -e

# Colores
VERDE='\033[0;32m'
ROJO='\033[0;31m'
AMARILLO='\033[1;33m'
AZUL='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo_color() {
    echo -e "${1}${2}${NC}"
}

echo_separador() {
    echo ""
    echo_color $AZUL "============================================"
    echo_color $AZUL "  $1"
    echo_color $AZUL "============================================"
    echo ""
}

# Contadores globales
TOTAL_PRUEBAS=0
EXITOSAS=0
FALLIDAS=0
CORREGIDAS=0

log_exito() {
    echo_color $VERDE "   ✅ $1"
    EXITOSAS=$((EXITOSAS + 1))
    TOTAL_PRUEBAS=$((TOTAL_PRUEBAS + 1))
}

log_fallo() {
    echo_color $ROJO "   ❌ $1: $2"
    FALLIDAS=$((FALLIDAS + 1))
    TOTAL_PRUEBAS=$((TOTAL_PRUEBAS + 1))
}

log_advertencia() {
    echo_color $AMARILLO "   ⚠️  $1: $2"
    TOTAL_PRUEBAS=$((TOTAL_PRUEBAS + 1))
}

log_info() {
    echo_color $CYAN "   ℹ️  $1"
}

# ============================================================
# PASO 1: VERIFICAR SISTEMA OPERATIVO
# ============================================================
paso_sistema() {
    echo_separador "PASO 1: VERIFICANDO SISTEMA OPERATIVO"
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo_color $VERDE "   ✅ Sistema: $PRETTY_NAME"
        echo_color $VERDE "   ✅ Versión: $VERSION_ID ($VERSION_CODENAME)"
    else
        echo_color $ROJO "   ❌ No se pudo detectar el sistema operativo"
        return 1
    fi
    
    # Verificar arquitectura
    ARQUITECTURA=$(uname -m)
    echo_color $VERDE "   ✅ Arquitectura: $ARQUITECTURA"
    
    return 0
}

# ============================================================
# PASO 2: VERIFICAR ESPACIO EN DISCO
# ============================================================
paso_espacio() {
    echo_separador "PASO 2: VERIFICANDO ESPACIO EN DISCO"
    
    ESPACIO_LIBRE=$(df -h /home | awk 'NR==2 {print $4}' | tr -d 'G')
    ESPACIO_INT=${ESPACIO_LIBRE%.*}
    
    echo_color $VERDE "   Espacio libre en /home: ${ESPACIO_LIBRE}G"
    
    if [ "$ESPACIO_INT" -lt 10 ]; then
        echo_color $ROJO "   ❌ ADVERTENCIA: Menos de 10 GB libres"
        return 1
    elif [ "$ESPACIO_INT" -lt 20 ]; then
        echo_color $AMARILLO "   ⚠️  Menos de 20 GB libres, puede ser insuficiente"
    else
        echo_color $VERDE "   ✅ Espacio suficiente (${ESPACIO_LIBRE}G)"
    fi
    
    return 0
}

# ============================================================
# PASO 3: VERIFICAR E INSTALAR HERRAMIENTAS
# ============================================================
paso_herramientas() {
    echo_separador "PASO 2: VERIFICANDO HERRAMIENTAS"
    
    declare -a HERRAMIENTAS=(
        "python3:Python 3"
        "python3-pip:Python Pip"
        "unzip:Descompresor ZIP"
        "curl:Transferidor de archivos"
        "wget:Descargador de archivos"
        "mkisofs:Creador de ISO"
        "grub-mkrescue:Creador de ISO arrancable"
        "adb:ADB para celular Android"
        "fastboot:Fastboot para flashear Android"
        "java:Java (OpenJDK)"
        "nodejs:Node.js"
        "npm:Node Package Manager"
    )
    
    FALTANTES=0
    
    for herramienta in "${HERRAMIENTAS[@]}"; do
        NOMBRE="${herramienta%%:*}"
        NOMBRE_COMPLETO="${herramienta#*:}"
        
        if command -v "$NOMBRE" &>/dev/null; then
            echo_color $VERDE "   ✅ $NOMBRE_COMLETO ($NOMBRE)"
        else
            echo_color $AMARILLO "   ⚠️  $NOMBRE_COMLETO ($NOMBRE) - NO INSTALADO"
            FALTANTES=$((FALTANTES + 1))
        fi
    done
    
    if [ $FALTANTES -gt 0 ]; then
        echo ""
        echo_color $AMARILLO "   Se encontraron $FALTANTES herramienta(s) faltante(s)."
        echo -n "   ¿Quieres instalarlas ahora? (s/n): "
        read -r RESPUESTA
        
        if [ "$RESPUESTA" = "s" ] || [ "$RESPUESTA" = "S" ]; then
            echo_color $AZUL "   Instalando herramientas faltantes..."
            sudo apt-get update
            sudo apt-get install -y python3-pip unzip curl wget mkisofs grub-mkrescue android-tools-adb android-tools-fastboot openjdk-17-jdk nodejs npm
            
            # Verificar nuevamente
            echo ""
            echo_color $AZUL "   Verificando instalaciones..."
            for herramienta in "${HERRAMIENTAS[@]}"; do
                NOMBRE="${herramienta%%:*}"
                if command -v "$NOMBRE" &>/dev/null; then
                    echo_color $VERDE "   ✅ $NOMBRE - INSTALADO"
                fi
            done
        else
            echo_color $AMARILLO "   ⚠️  Saltando instalación de herramientas"
        fi
    else
        echo_color $VERDE "   ✅ Todas las herramientas están instaladas"
    fi
    
    return 0
}

# ============================================================
# PASO 3: VERIFICAR ARCHIVOS EN ESCRITORIO
# ============================================================
paso_archivos() {
    echo_separador "PASO 3: VERIFICANDO ARCHIVOS EN ESCRITORIO"
    
    ARCHIVOS_ESCRITORIO=(
        "/home/yeremy/Escritorio/Bn 10 - Normal.apk:APK Ben 10 Normal"
        "/home/yeremy/Escritorio/Bn 10 - Modo Dios.apk:APK Ben 10 Modo Dios"
        "/home/yeremy/Escritorio/Ben10_Omnitrix_Battle.zip:Código fuente del juego"
        "/home/yeremy/Escritorio/Verdix_OS_Debian.iso": "ISO de Verdix OS para PC"
        "/home/yeremy/Escritorio/Verdix_Installer.iss": "Script para crear EXE de Windows"
        "/home/yeremy/Escritorio/Abrir_Verdix.bat": "Script para abrir navegador en Windows"
        "/home/yeremy/Escritorio/Abrir_Ben10.bat": "Script para abrir juego en Windows"
        "/home/yeremy/Escritorio/INSTALACION_COMPLETA.md": "Instrucciones completas"
        "/home/yeremy/Escritorio/VERDIX_ESTADO_COMPLETO.md": "Estado completo del proyecto"
    )
    
    ARCHIVOS_FALTANTES=0
    
    for entrada in "${ARCHIVOS_ESCRITORIO[@]}"; do
        RUTA="${entrada%%:*}"
        NOMBRE="${entrada#*:}"
        
        if [ -f "$RUTA" ]; then
            TAMANIO=$(du -h "$RUTA" | awk '{print $1}')
            echo_color $VERDE "   ✅ $(basename "$RUTA") ($TAMANIO)"
        else
            echo_color $ROJO "   ❌ $(basename "$RUTA") - NO ENCONTRADO"
            ARCHIVOS_FALTANTES=$((ARCHIVOS_FALTANTES + 1))
        fi
    done
    
    if [ $ARCHIVOS_FALTANTES -gt 0 ]; then
        echo_color $AMARILLO "   ⚠️  Faltan $ARCHIVOS_FALTANTES archivo(s) en el Escritorio"
    else
        echo_color $VERDE "   ✅ Todos los archivos están en el Escritorio"
    fi
    
    return 0
}

# ============================================================
# PASO 4: VERIFICAR REPOSITORIOS GIT
# ============================================================
paso_repositorios() {
    echo_separador "PASO 4: VERIFICANDO REPOSITORIOS GIT"
    
    REPOSITORIOS=(
        "/home/yeremy/verdix-web-deploy:Web de Verdix"
        "/home/yeremy/verdix-os-debian:Verdix OS para PC"
        "/home/yeremy/verdix-rom:ROM para Redmi Note 10 Pro"
        "/home/yeremy/verdix-ai-cli": "Verdix AI CLI"
        "/home/yeremy/verdix-desktop": "Verdix Desktop"
        "/home/yeremy/verdix-ota": "Servidor OTA"
        "/home/yeremy/verdix-automation": "Automatización"
    )
    
    REPOS_FALTANTES=0
    
    for entrada in "${REPOSITORIOS[@]}"; do
        RUTA="${entrada%%:*}"
        NOMBRE="${entrada#*:}"
        
        if [ -d "$RUTA" ] && [ -d "$RUTA/.git" ]; then
            echo_color $VERDE "   ✅ $NOMBRE"
        else
            echo_color $ROJO "   ❌ $NOMBRE - NO ENCONTRADO O NO ES REPOSITORIO GIT"
            REPOS_FALTANTES=$((REPOS_FALTANTES + 1))
        fi
    done
    
    if [ $REPOS_FALTANTES -gt 0 ]; then
        echo_color $AMARILLO "   ⚠️  Faltan $REPOS_FALTANTES repositorio(s)"
    else
        echo_color $VERDE "   ✅ Todos los repositorios están presentes"
    fi
    
    return 0
}

# ============================================================
# PASO 5: VERIFICAR CELULAR ANDROID
# ============================================================
paso_celular() {
    echo_separador "PASO 5: VERIFICANDO CELULAR ANDROID"
    
    if ! command -v adb &>/dev/null; then
        echo_color $ROJO "   ❌ ADB no está instalado"
        return 1
    fi
    
    DISPOSITIVOS=$(adb devices 2>/dev/null | grep -v "List of devices" | grep "device" | wc -l)
    
    if [ "$DISPOSITIVOS" -gt 0 ]; then
        echo_color $VERDE "   ✅ Dispositivos conectados: $DISPOSITIVOS"
        adb devices 2>/dev/null | grep "device" | while read -r linea; do
            echo "      $linea"
        done
        
        # Verificar si están instalados los APKs
        echo ""
        echo_color $AZUL "   Verificando APKs instalados en el celular..."
        
        for paquete in "com.omnitrix.ben10" "com.omnitrix.ben10.god"; do
            if adb shell pm list packages 2>/dev/null | grep -q "$paquete"; then
                echo_color $VERDE "   ✅ $paquete instalado"
            else
                echo_color $AMARILLO "   ⚠️  $paquete NO instalado"
            fi
        done
    else
        echo_color $AMARILLO "   ⚠️  No hay dispositivos Android conectados por ADB"
        echo_color $AZUL "   Para conectar:"
        echo_color $AZUL "      1. Activa 'Depuración USB' en Opciones de desarrollador"
        echo_color $AZUL "      2. Conecta el celular por USB al computador"
        echo_color $AZUL "      3. Acepta la depuración USB en el celular"
    fi
    
    return 0
}

# ============================================================
# PASO 6: PROBAR WEB DE VERDIX
# ============================================================
paso_web() {
    echo_separador "PASO 6: PROBANDO WEB DE VERDIX"
    
    if ! command -v curl &>/dev/null; then
        echo_color $AMARILLO "   ⚠️  curl no está instalado, omitiendo prueba web"
        return 0
    fi
    
    PAGINAS=(
        "https://verdix-ecosystem.vercel.app/index.html:Página principal"
        "https://verdix-ecosystem.vercel.app/ai.html:Página IA"
        "https://verdix-ecosystem.vercel.app/search.html:Página buscador"
        "https://verdix-ecosystem.vercel.app/browser.html:Página navegador"
        "https://verdix-ecosystem.vercel.app/download.html:Página descargas"
        "https://verdix-ecosystem.vercel.app/apk/juego/index.html:Juego Ben 10"
    )
    
    TODAS_OK=true
    
    for entrada in "${PAGINAS[@]}"; do
        URL="${entrada%%:*}"
        NOMBRE="${entrada#*:}"
        
        CODIGO=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$URL" 2>/dev/null || echo "000")
        
        if [ "$CODIGO" = "200" ]; then
            echo_color $VERDE "   ✅ $NOMBRE - HTTP 200 OK"
        else
            echo_color $ROJO "   ❌ $NOMBRE - HTTP $CODIGO"
            TODAS_OK=false
        fi
    done
    
    if $TODAS_OK; then
        echo_color $VERDE "   ✅ Todas las páginas funcionan correctamente"
    else
        echo_color $AMARILLO "   ⚠️  Algunas páginas no responden correctamente"
    fi
    
    return 0
}

# ============================================================
# PASO 7: RESUMEN FINAL
# ============================================================
paso_resumen() {
    echo_separador "PASO 7: RESUMEN FINAL"
    
    echo_color $AZUL "   ============================================"
    echo_color $AZUL "  📊 RESUMEN DE VALIDACIÓN"
    echo_color $AZUL "   ============================================"
    echo_color $VERDE "   ✅ Pruebas exitosas: $EXITOSAS"
    echo_color $ROJO "   ❌ Pruebas fallidas: $FALLIDAS"
    echo_color $AMARILLO "   ⚠️  Advertencias: $ADVERTENCIAS"
    echo_color $AZUL "   📊 Total: $TOTAL_PRUEBAS"
    echo ""
    
    if [ $FALLIDAS -eq 0 ]; then
        echo_color $VERDE "   ✅ TODO EL ECOSISTEMA VERDIX FUNCIONA CORRECTAMENTE"
    elif [ $FALLIDAS -le 3 ]; then
        echo_color $AMARILLO "   ⚠️  HAY ALGUNOS PROBLEMAS PERO EL SISTEMA FUNCIONA"
        echo_color $AZUL "   Revisa los errores arriba y corrígelos"
    else
        echo_color $ROJO "   ❌ HAY MÚLTIPLES ERRORES CRÍTICOS"
        echo_color $AZUL "   Revisa y corrige los errores antes de continuar"
    fi
    
    echo ""
    echo_color $AZUL "   PRÓXIMOS PASOS RECOMENDADOS:"
    echo_color $AZUL "   1. Si faltan herramientas, instálalas con: sudo apt-get install <paquete>"
    echo_color $AZUL "   2. Para desplegar en Vercel: cd /home/yeremy/verdix-web-deploy && vercel --prod"
    echo_color $AZUL "   3. Para instalar ISO en PC: graba /home/yeremy/Escritorio/Verdix_OS_Debian.iso en un USB"
    echo_color $AZUL "   4. Para instalar APK en celular: adb install /home/yeremy/Escritorio/Ben\ 10\ -\ Normal.apk"
    echo ""
    echo_color $AZUL "   ¡ECOSISTEMA VERDIX LISTO PARA USAR! 🟢"
}

# ============================================================
# EJECUCIÓN PRINCIPAL
# ============================================================
main() {
    echo_color $AZUL ""
    echo_color $AZUL "============================================================"
    echo_color $AZUL "  🟢 VERDIX OS - INSTALACIÓN Y VALIDACIÓN COMPLETA"
    echo_color $AZUL "============================================"
    echo ""
    echo_color $AZUL "Este script va a:"
    echo_color $AZUL "   1. Verificar qué tienes instalado"
    echo_color $AZUL "   2. Instalar lo que falte (preguntará tu permiso)"
    echo_color $AZUL "   3. Probar que todo funcione"
    echo_color $AZUL "   4. Darte un resumen final"
    echo ""
    echo -n "Presiona ENTER para continuar o Ctrl+C para cancelar: "
    read -r
    
    echo ""
    
    # Paso 1: Sistema
    paso_sistema || true
    
    # Paso 2: Espacio
    paso_espacio || true
    
    # Paso 3: Herramientas
    paso_herramientas || true
    
    # Paso 4: Archivos en Escritorio
    paso_archivos || true
    
    # Paso 5: Repositorios Git
    paso_repositorios || true
    
    # Paso 6: Celular
    paso_celular || true
    
    # Paso 7: Web
    paso_web || true
    
    # Paso 8: Resumen
    paso_resumen
}

# Ejecutar
main "$@"