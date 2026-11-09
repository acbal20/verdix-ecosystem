#!/usr/bin/env python3
"""
============================================================
  VERDIX OS - Monitor de Sistema Continuo
  ============================================================
  Este script se ejecuta continuamente y monitorea:
  - Que la web esté funcionando
  - Que los servicios estén respondiendo
  - Que los archivos críticos existan
  - Envía alertas si algo falla
  ============================================================
"""

import time
import subprocess
import urllib.request
import json
import os
import sys
from datetime import datetime

# Configuración
URL_WEB = "https://verdix-oficial.vercel.app"
INTERVALO_SEGUNDOS = 300  # 5 minutos
ARCHIVO_LOG = "/home/yeremy/verdix-automation/logs/monitoreo.log"

def log(mensaje):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    linea = f"[{timestamp}] {mensaje}"
    print(línea)
    with open(ARCHIVO_LOG, "a", encoding="utf-8") as f:
        f.write(línea + "\n")

def verificar_web():
    """Verifica que la web esté respondiendo"""
    try:
        req = urllib.request.Request("https://verdix-oficial.vercel.app/index.html", 
                                     headers={'User-Agent': 'Verdix-Monitor/1.0'})
        with urllib.request.urlopen(req, timeout=15) as respuesta:
            return respuesta.status == 200
    except Exception as e:
        log(f"❌ Error verificando web: {e}")
        return False

def verificar_api_chat():
    """Verifica que el API de chat funcione"""
    try:
        req = urllib.request.Request(
            "https://verdix-oficial.vercel.app/api/chat",
            data=json.dumps({"messages": [{"role": "user", "content": "test"}]}).encode(),
            headers={'Content-Type': 'application/json', 'User-Agent': 'Verdix-Monitor/1.0'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=15) as respuesta:
            return respuesta.status == 200
    except Exception as e:
        log(f"❌ Error verificando API chat: {e}")
        return False

def verificar_archivos_criticos():
    """Verifica que los archivos críticos existan"""
    archivos = [
        "/home/yeremy/verdix-web/index.html",
        "/home/yeremy/verdix-web/ai.html",
        "/home/yeremy/verdix-web/api/chat.js",
        "/home/yeremy/Escritorio/Bn 10 - Normal.apk",
        "/home/yeremy/Escritorio/Bn 10 - Modo Dios.apk",
        "/home/yeremy/Escritorio/Verdix_OS_Debian.iso",
    ]
    
    faltantes = []
    for archivo in archivos:
        if not os.path.exists(archivo):
            faltantes.append(archivo)
    
    return faltantes

def main():
    log("🟢 VERDIX MONITOR - Iniciando monitoreo continuo")
    log(f"   Intervalo de verificación: {INTERVALO_SEGUNDOS} segundos")
    log(f"   Web objetivo: {URL_WEB}")
    log("="*60)
    
    mientras_ejecutando = True
    
    try:
        while mientras_ejecutando:
            # Verificar web
            web_ok = verificar_web()
            
            # Verificar API
            api_ok = verificar_api_chat()
            
            # Verificar archivos
            archivos_faltantes = verificar_archivos_criticos()
            
            # Reportar estado
            if web_ok and api_ok and not archivos_faltantes:
                log("✅ Todo funcionando correctamente")
            else:
                log("❌ PROBLEMAS DETECTADOS:")
                if not web_ok:
                    log("   - Web no responde")
                if not api_ok:
                    log("   - API de chat no responde")
                if archivos_faltantes:
                    log(f"   - Archivos faltantes: {', '.join(archivos_faltantes)}")
            
            log("-" * 40)
            
            # Esperar al siguiente ciclo
            time.sleep(INTERVALO_SEGUNDOS)
            
    except KeyboardInterrupt:
        log("🛑 Monitoreo detenido por el usuario")
    except Exception as e:
        log(f"❌ Error en el monitor: {e}")

if __name__ == "__main__":
    main()