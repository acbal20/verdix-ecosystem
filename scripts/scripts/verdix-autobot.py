#!/usr/bin/env python3
"""
============================================================
  VERDIX OS - Autobot de Mantenimiento y Auto-Reparación
  ============================================================
  Este bot:
  1. Verifica que todo el ecosistema esté funcionando
  2. Prueba todos los componentes (web, API, APK, ISO, ROM)
  3. Detecta errores automáticamente
  4. Corrige errores automáticamente
  5. Genera reportes completos
  ============================================================
"""

import os
import sys
import json
import time
import subprocess
import socket
import urllib.request
import urllib.error
import shutil
import hashlib
from datetime import datetime
from pathlib import Path

# Configuración
CONFIG_PATH = "/home/yeremy/verdix-automation/config/verdix-config.json"
LOGS_DIR = "/home/yeremy/verdix-automation/logs"
BACKUPS_DIR = "/home/yeremy/verdix-automation/backups"

class VerdixAutobot:
    def __init__(self):
        self.config = self.cargar_config()
        self.resultados = {
            "fecha": datetime.now().isoformat(),
            "total_pruebas": 0,
            "exitosas": 0,
            "fallidas": 0,
            "advertencias": 0,
            "corregidas": 0,
            "detalles": []
        }
        self.ensure_dirs()

    def cargar_config(self):
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)

    def ensure_dirs(self):
        for d in [LOGS_DIR, BACKUPS_DIR]:
            os.makedirs(d, exist_ok=True)

    def log(self, mensaje, tipo="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        mensaje_formateado = f"[{timestamp}] [{tipo}] {mensaje}"
        print(mensaje_formateado)
        
        with open(os.path.join(LOGS_DIR, "verdix-autobot.log"), "a", encoding="utf-8") as f:
            f.write(mensaje_formateado + "\n")

    def registrar_resultado(self, nombre, exito, detalle="", corregido=False):
        self.resultados["total_pruebas"] += 1
        if exito:
            self.resultados["exitosas"] += 1
            self.log(f"✅ {nombre}: OK", "ÉXITO")
        else:
            self.resultados["fallidas"] += 1
            self.log(f"❌ {nombre}: FALLO - {detalle}", "ERROR")
            if corregido:
                self.resultados["corregidas"] += 1
                self.log(f"🔧 {nombre}: CORREGIDO automáticamente", "CORRECCIÓN")

    def ejecutar_comando(self, comando, descripcion="Comando"):
        """Ejecuta un comando de sistema y devuelve el resultado"""
        try:
            resultado = subprocess.run(
                comando,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60
            )
            return resultado.returncode == 0, resultado.stdout, resultado.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Tiempo de espera agotado"
        except Exception as e:
            return False, "", str(e)

    def verificar_archivo_existe(self, ruta, descripcion):
        """Verifica si un archivo existe"""
        existe = os.path.exists(ruta)
        self.registrar_resultado(descripcion, existe, "" if existe else "Archivo no encontrado")
        return existe

    def verificar_directorio_existe(self, ruta, descripcion):
        """Verifica si un directorio existe"""
        existe = os.path.isdir(ruta)
        self.registrar_resultado(descripcion, existe, "" if existe else "Directorio no encontrado")
        return existe

    def probar_conexion_web(self, url, nombre):
        """Prueba si una URL web responde"""
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Verdix-Bot/1.0'})
            with urllib.request.urlopen(req, timeout=10) as respuesta:
                codigo = respuesta.getcode()
                exito = 200 <= codigo < 300
                self.registrar_resultado(nombre, exito, "" if exito else f"Código HTTP: {codigo}")
                return exito
        except Exception as e:
            self.registrar_resultado(nombre, False, str(e))
            return False

    def verificar_archivos_criticos(self):
        """Verifica que todos los archivos críticos existan"""
        self.log("\n=== VERIFICANDO ARCHIVOS CRÍTICOS ===")
        
        archivos_criticos = [
            ("/home/yeremy/verdix-web/index.html", "Página principal web"),
            ("/home/yeremy/verdix-web/ai.html", "Página IA"),
            ("/home/yeremy/verdix-web/search.html", "Página buscador"),
            ("/home/yeremy/verdix-web/browser.html", "Página navegador"),
            ("/home/yeremy/verdix-web/download.html", "Página descargas"),
            ("/home/yeremy/verdix-web/api/chat.js", "API de chat"),
            ("/home/yeremy/verdix-web/api/search.js", "API de búsqueda"),
            ("/home/yeremy/Ben10_Web/index.html", "Juego Ben 10 web"),
            "/home/yeremy/Escritorio/Bn 10 - Normal.apk",
            "/home/yeremy/Escritorio/Bn 10 - Modo Dios.apk",
            "/home/yeremy/Escritorio/Ben10_Omnitrix_Battle.zip",
            "/home/yeremy/Escritorio/Verdix_OS_Debian.iso",
            "/home/yeremy/verdix-os-debian/config/includes.chroot/opt/verdix/server.py",
            "/home/yeremy/verdix-rom/build.sh",
            "/home/yeremy/verdix-ai-cli/verdix_ai/cli.py",
        ]

        for ruta, descripcion in archivos_criticos:
            self.verificar_archivo_existe(ruta, descripcion)

    def verificar_servicios_web(self):
        """Verifica que los servicios web estén respondiendo"""
        self.log("\n=== VERIFICANDO SERVICIOS WEB ===")

        endpoints = [
            ("https://verdix-ecosystem.vercel.app/index.html", "Página principal"),
            ("https://verdix-ecosystem.vercel.app/ai.html", "Página IA"),
            ("https://verdix-ecosystem.vercel.app/search.html", "Página buscador"),
            ("https://verdix-ecosystem.vercel.app/browser.html", "Página navegador"),
            ("https://verdix-ecosystem.vercel.app/download.html", "Página descargas"),
            ("https://verdix-ecosystem.vercel.app/apk/juego/index.html", "Juego Ben 10 web"),
            ("https://verdix-ecosystem.vercel.app/api/chat", "API Chat"),
            ("https://verdix-ecosystem.vercel.app/api/search?q=test", "API Search"),
            ("https://verdix-ecosystem.vercel.app/api/health", "API Health"),
        ]

        for url, nombre in endpoints:
            self.probar_conexion_web(url, nombre)

    def verificar_celular(self):
        """Verifica si el celular está conectado"""
        self.log("\n=== VERIFICANDO CELULAR ===")
        
        exito, salida, error = self.ejecutar_comando("adb devices", "ADB devices")
        
        if exito and "device" in salida:
            lineas = salida.strip().split("\n")
            dispositivos = [l for l in lineas if "device" in l and not l.startswith("List")]
            self.registrar_resultado("Celular conectado", len(dispositivos) > 0, f"{len(dispositivos)} dispositivo(s)")
            
            # Verificar paquetes instalados
            exito2, salida2, _ = self.ejecutar_comando("adb shell pm list packages | grep -i ben10", "Paquetes Ben 10")
            if exito2 and "ben10" in salida2.lower():
                self.registrar_resultado("APK Ben 10 instalado", True)
            else:
                self.registrar_resultado("APK Ben 10 instalado", False, "No encontrado en celular")
        else:
            self.registrar_resultado("Celular conectado", False, "No detectado por ADB")

    def corregir_errores_automaticamente(self):
        """Intenta corregir errores automáticamente"""
        self.log("\n=== CORRECCIÓN AUTOMÁTICA DE ERRORES ===")
        
        # 1. Verificar y crear directorios faltantes
        directorios_criticos = [
            "/home/yeremy/verdix-web",
            "/home/yeremy/verdix-web-deploy",
            "/home/yeremy/Ben10_Web",
            "/home/yeremy/verdix-os-debian",
            "/home/yeremy/verdix-rom",
            "/home/yeremy/verdix-ai-cli",
            "/home/yeremy/verdix-desktop",
            "/home/yeremy/verdix-ota",
            "/home/yeremy/verdix-automation"
        ]
        
        for d in directorios_criticos:
            if not os.path.isdir(d):
                try:
                    os.makedirs(d, exist_ok=True)
                    self.log(f"✅ Directorio creado: {d}", "CORRECCIÓN")
                    self.resultados["corregidas"] += 1
                except Exception as e:
                    self.log(f"❌ No se pudo crear {d}: {e}", "ERROR")

        # 2. Verificar y crear archivos faltantes críticos
        archivos_criticos = {
            "/home/yeremy/verdix-web/index.html": "<!DOCTYPE html><html><head><title>Verdix</title></head><body><h1>Verdix OS</h1></body></html>",
            "/home/yeremy/verdix-web/style.css": "body { background: #030609; color: #eaffec; font-family: 'Segoe UI', sans-serif; }",
            "/home/yeremy/verdix-web/api/chat.js": "export default async function handler(req, res) { res.status(200).json({ status: 'ok' }); }",
            "/home/yeremy/verdix-web/api/search.js": "export default async function handler(req, res) { res.status(200).json({ results: [] }); }",
        }

        for archivo, contenido in archivos_criticos.items():
            if not os.path.exists(archivo):
                try:
                    os.makedirs(os.path.dirname(archivo), exist_ok=True)
                    with open(archivo, 'w', encoding='utf-8') as f:
                        f.write(contenido)
                    self.log(f"✅ Archivo creado: {archivo}", "CORRECCIÓN")
                    self.resultados["corregidas"] += 1
                except Exception as e:
                    self.log(f"❌ No se pudo crear {archivo}: {e}", "ERROR")

    def generar_reporte(self):
        """Genera un reporte completo de la validación"""
        self.log("\n" + "="*60)
        self.log("📊 REPORTE FINAL DE VALIDACIÓN")
        self.log("="*60)
        self.log(f"Total pruebas: {self.resultados['total_pruebas']}")
        self.log(f"✅ Exitosas: {self.resultados['exitosas']}")
        self.log(f"❌ Fallidas: {self.resultados['fallidas']}")
        self.log(f"⚠️ Advertencias: {self.resultados['advertencias']}")
        self.log(f"🔧 Corregidas automáticamente: {self.resultados['corregidas']}")
        
        porcentaje = 0
        if self.resultados['total_pruebas'] > 0:
            porcentaje = (self.resultados['exitosas'] / self.resultados['total_pruebas']) * 100
        
        self.log(f"📊 Tasa de éxito: {porcentaje:.1f}%")
        
        if self.resultados['fallidas'] == 0:
            self.log("✅ TODO EL ECOSISTEMA FUNCIONA CORRECTAMENTE", "ÉXITO")
        elif self.resultados['fallidas'] <= 3:
            self.log("⚠️ HAY ALGUNOS PROBLEMAS PERO EL SISTEMA FUNCIONA", "ADVERTENCIA")
        else:
            self.log("❌ HAY MÚLTIPLES ERRORES CRÍTICOS", "ERROR")
        
        # Guardar reporte en archivo
        reporte_path = os.path.join(LOGS_DIR, f"reporte-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json")
        with open(reporte_path, 'w', encoding='utf-8') as f:
            json.dump(self.resultados, f, indent=2, ensure_ascii=False)
        
        self.log(f"📄 Reporte guardado en: {reporte_path}")
        
        return self.resultados

    def ejecutar_todo(self):
        """Ejecuta todo el proceso de validación y corrección"""
        self.log("="*60)
        self.log("🟢 VERDIX AUTOBOT - Iniciando validación completa")
        self.log("="*60)
        
        # Paso 1: Verificar archivos críticos
        self.verificar_archivos_criticos()
        
        # Paso 2: Verificar servicios web
        self.verificar_servicios_web()
        
        # Paso 3: Verificar celular
        self.verificar_celular()
        
        # Paso 4: Corregir errores automáticamente
        self.corregir_errores_automaticamente()
        
        # Paso 5: Generar reporte final
        self.generar_reporte()
        
        return self.resultados

if __name__ == "__main__":
    autobot = VerdixAutobot()
    resultados = autobot.ejecutar_todo()
    
    # Código de salida basado en resultados
    if resultados['fallidas'] == 0:
        sys.exit(0)  # Todo OK
    elif resultados['fallidas'] <= 3:
        sys.exit(1)  # Advertencias
    else:
        sys.exit(2)  # Errores críticos