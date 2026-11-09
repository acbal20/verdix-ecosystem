#!/usr/bin/env python3
"""
Verdix AI CLI - Interfaz de línea de comandos
Permite usar Verdix AI desde la terminal localmente
"""

import sys
import os
import json
import argparse
import urllib.request
import urllib.parse
import subprocess
import platform
import socket
import ssl
import hashlib
import re
from datetime import datetime
from pathlib import Path

# Configuración
API_BASE = os.environ.get("VERDIX_API_BASE", "https://verdix-oficial.vercel.app/api")
OPENROUTER_KEY = os.environ.get("OPENROUTER_API_KEY", "")
TIMEOUT = 30


def detect_device():
    """Detecta el tipo de dispositivo y retorna información"""
    system = platform.system()
    machine = platform.machine()
    processor = platform.processor()

    device_info = {
        "system": system,
        "machine": machine,
        "processor": processor,
        "is_mobile": False,
        "is_tablet": False,
        "is_desktop": True,
        "architecture": "unknown",
        "os_version": platform.version(),
        "hostname": socket.gethostname(),
    }

    # Detectar arquitectura
    if machine in ("x86_64", "AMD64"):
        device_info["architecture"] = "x86_64"
    elif machine in ("aarch64", "arm64"):
        device_info["architecture"] = "arm64"
    elif machine in ("armv7l", "armv6l"):
        device_info["architecture"] = "arm"
        device_info["is_mobile"] = True
        device_info["is_desktop"] = False

    # Detectar si es móvil/tablet
    if system in ("Android", "iOS"):
        device_info["is_mobile"] = True
        device_info["is_desktop"] = False
    elif "arm" in machine.lower() and system == "Linux":
        # Podría ser Raspberry Pi o similar
        device_info["is_mobile"] = False
        device_info["is_tablet"] = True
        device_info["is_desktop"] = False

    return device_info


def check_security():
    """Verifica configuración de seguridad básica"""
    issues = []
    warnings = []

    # Verificar si OPENROUTER_API_KEY está expuesta
    if OPENROUTER_KEY:
        if len(OPENROUTER_KEY) < 20:
            warnings.append("OPENROUTER_API_KEY parece ser demasiado corta")
    else:
        warnings.append("OPENROUTER_API_KEY no configurada - IA no funcionará")

    # Verificar permisos de directorios sensibles
    home = Path.home()
    for d in [".ssh", ".gnupg", ".config"]:
        p = home / d
        if p.exists():
            import stat
            st = p.stat()
            mode = stat.filemode(st.st_mode)
            if "rwx" in mode[7:9]:  # Otros tienen escritura
                warnings.append(f"{d} tiene permisos permisivos para otros usuarios")

    # Verificar conexión segura
    try:
        context = ssl.create_default_context()
        with urllib.request.urlopen(
            "https://verdix-oficial.vercel.app/api/health",
            timeout=10,
            context=context,
        ) as resp:
            if resp.status != 200:
                warnings.append("El servidor no responde correctamente")
    except Exception as e:
        issues.append(f"No se puede conectar al servidor seguro: {e}")

    return {"issues": issues, "warnings": warnings}


def fetch_ai(message, model=None):
    """Envía mensaje a la API de Verdix AI"""
    url = f"{API_BASE}/chat"
    data = json.dumps({"messages": [{"role": "user", "content": message}]}).encode()

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_KEY}",
            "X-Client": "verdix-ai-cli/1.0",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return {"error": f"Error HTTP {e.code}: {e.read().decode()}"}
    except Exception as e:
        return {"error": str(e)}


def generate_image(prompt):
    """Genera una imagen usando la API"""
    url = f"{API_BASE}/chat"
    data = json.dumps(
        {"messages": [{"role": "user", "content": f"generar imagen: {prompt}"}]}
    ).encode()

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_KEY}",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}


def run_command(cmd):
    """Ejecuta un comando del sistema de forma segura"""
    # Lista de comandos prohibidos para seguridad
    forbidden = ["rm -rf /", "mkfs", "dd if=", "> /dev/sda", "shutdown", "reboot"]
    for f in forbidden:
        if f in cmd.lower():
            return {"error": f"Comando bloqueado por seguridad: {f}"}

    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60,
        )
        return {
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except subprocess.TimeoutExpired:
        return {"error": "Tiempo de espera agotado"}
    except Exception as e:
        return {"error": str(e)}


def install_package(package):
    """Instala un paquete del sistema"""
    return run_command(f"sudo apt-get install -y {package}")


def update_system():
    """Actualiza la lista de paquetes"""
    return run_command("sudo apt-get update")


def print_banner():
    """Imprime el banner de bienvenida"""
    print("\n" + "=" * 60)
    print("  🟢 VERDIX AI CLI v1.0.0")
    print("  Asistente de IA para la terminal")
    print("=" * 60 + "\n")


def print_device_info(device):
    """Muestra información del dispositivo detectado"""
    print("📱 Dispositivo detectado:")
    print(f"   Sistema: {device['system']} {device['os_version']}")
    print(f"   Arquitectura: {device['architecture']}")
    print(f"   Máquina: {device['machine']}")
    print(f"   Tipo: {'Móvil' if device['is_mobile'] else 'Tablet' if device['is_tablet'] else 'Escritorio'}")
    print(f"   Hostname: {device['hostname']}")
    print()


def print_security_report(sec):
    """Muestra reporte de seguridad"""
    print("🔒 Reporte de seguridad:")
    if sec["issues"]:
        print("   ⚠️  Problemas críticos:")
        for i in sec["issues"]:
            print(f"      - {i}")
    if sec["warnings"]:
        print("   ℹ️  Advertencias:")
        for w in sec["warnings"]:
            print(f"      - {w}")
    if not sec["issues"] and not sec["warnings"]:
        print("   ✅ Todo en orden")
    print()


def cmd_chat(args):
    """Comando de chat con IA"""
    message = args.message or input("Tú: ")
    if not message:
        print("No se proporcionó mensaje")
        return

    print("🤖 Verdix AI: ", end="", flush=True)
    result = fetch_ai(message)

    if "error" in result:
        print(f"\n❌ Error: {result['error']}")
        return

    reply = result.get("reply", "Sin respuesta")
    print(reply)

    # Mostrar información del modelo si existe
    model = result.get("model", "")
    if model:
        print(f"\n   [Modelo: {model}]")


def cmd_image(args):
    """Comando para generar imagen"""
    prompt = args.prompt or input("Descripción de la imagen: ")
    if not prompt:
        print("No se proporcionó descripción")
        return

    print("🎨 Generando imagen...")
    result = generate_image(prompt)

    if "error" in result:
        print(f"❌ Error: {result['error']}")
        return

    image_url = result.get("imageUrl", "")
    if image_url:
        print(f"✅ Imagen generada: {image_url}")
    else:
        print(f"⚠️  Respuesta: {result.get('reply', 'Sin URL de imagen')}")


def cmd_exec(args):
    """Comando para ejecutar comando del sistema"""
    cmd = args.command or input("Comando: ")
    if not cmd:
        print("No se proporcionó comando")
        return

    print(f"▶ Ejecutando: {cmd}")
    result = run_command(cmd)

    if "error" in result:
        print(f"❌ {result['error']}")
        return

    if result.get("stdout"):
        print(result["stdout"])
    if result.get("stderr"):
        print(f"⚠️  {result['stderr']}")
    print(f"Código de salida: {result.get('returncode', 'desconocido')}")


def cmd_install(args):
    """Comando para instalar paquete"""
    pkg = args.package or input("Paquete a instalar: ")
    if not pkg:
        print("No se proporcionó paquete")
        return

    print(f"📦 Instalando {pkg}...")
    result = install_package(pkg)

    if "error" in result:
        print(f"❌ {result['error']}")
        return

    if result.get("stdout"):
        print(result["stdout"])
    if result.get("stderr"):
        print(result["stderr"])
    print(f"Éxito: {result.get('ok', False)}")


def cmd_update(args):
    """Comando para actualizar sistema"""
    print("🔄 Actualizando lista de paquetes...")
    result = update_system()

    if "error" in result:
        print(f"❌ {result['error']}")
        return

    if result.get("stdout"):
        print(result["stdout"])
    print(f"Éxito: {result.get('ok', False)}")


def cmd_security(args):
    """Comando de verificación de seguridad"""
    print("🔍 Ejecutando auditoría de seguridad...")
    sec = check_security()
    print_security_report(sec)


def cmd_device(args):
    """Comando para mostrar info del dispositivo"""
    device = detect_device()
    print_device_info(device)


def cmd_interactive(args):
    """Modo interactivo"""
    print_banner()
    device = detect_device()
    print_device_info(device)

    sec = check_security()
    print_security_report(sec)

    print("Escribe tu mensaje (escribe 'salir' para terminar, 'ayuda' para comandos)\n")

    while True:
        try:
            user_input = input("🟢 Tú: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n👋 ¡Hasta luego!")
            break

        if not user_input:
            continue

        if user_input.lower() in ("salir", "exit", "quit"):
            print("👋 ¡Hasta luego!")
            break

        if user_input.lower() in ("ayuda", "help"):
            print("""
Comandos disponibles:
  salir              - Terminar la sesión
  ayuda              - Mostrar esta ayuda
  imagen <texto>     - Generar imagen
  comando <cmd>      - Ejecutar comando del sistema
  instalar <paquete> - Instalar paquete del sistema
  actualizar         - Actualizar lista de paquetes
  seguridad          - Auditoría de seguridad
  dispositivo        - Info del dispositivo
""")
            continue

        if user_input.lower() == "seguridad":
            sec = check_security()
            print_security_report(sec)
            continue

        if user_input.lower() == "dispositivo":
            device = detect_device()
            print_device_info(device)
            continue

        if user_input.lower().startswith("imagen "):
            prompt = user_input[7:]
            result = generate_image(prompt)
            if "error" in result:
                print(f"❌ {result['error']}")
            else:
                print(f"🎨 {result.get('imageUrl', result.get('reply', ''))}")
            continue

        if user_input.lower().startswith("comando "):
            cmd = user_input[8:]
            result = run_command(cmd)
            if "error" in result:
                print(f"❌ {result['error']}")
            else:
                if result.get("stdout"):
                    print(result["stdout"])
                if result.get("stderr"):
                    print(f"⚠️  {result['stderr']}")
            continue

        if user_input.lower().startswith("instalar "):
            pkg = user_input[9:]
            result = install_package(pkg)
            if "error" in result:
                print(f"❌ {result['error']}")
            else:
                print(f"✅ {result.get('stdout', '')} {result.get('stderr', '')}")
            continue

        if user_input.lower() == "actualizar":
            result = update_system()
            if "error" in result:
                print(f"❌ {result['error']}")
            else:
                print(f"✅ {result.get('stdout', '')}")
            continue

        # Chat normal
        print("🤖 Verdix AI: ", end="", flush=True)
        result = fetch_ai(user_input)
        if "error" in result:
            print(f"\n❌ {result['error']}")
        else:
            print(result.get("reply", "Sin respuesta"))


def main():
    parser = argparse.ArgumentParser(
        description="Verdix AI CLI - Asistente de IA para la terminal"
    )
    subparsers = parser.add_subparsers(dest="command")

    # chat
    p_chat = subparsers.add_parser("chat", help="Chatear con Verdix AI")
    p_chat.add_argument("message", nargs="?", help="Mensaje a enviar")
    p_chat.set_defaults(func=cmd_chat)

    # image
    p_img = subparsers.add_parser("image", help="Generar imagen")
    p_img.add_argument("prompt", nargs="?", help="Descripción de la imagen")
    p_img.set_defaults(func=cmd_image)

    # exec
    p_exec = subparsers.add_parser("exec", help="Ejecutar comando del sistema")
    p_exec.add_argument("command", nargs="?", help="Comando a ejecutar")
    p_exec.set_defaults(func=cmd_exec)

    # install
    p_inst = subparsers.add_parser("install", help="Instalar paquete")
    p_inst.add_argument("package", nargs="?", help="Nombre del paquete")
    p_inst.set_defaults(func=cmd_install)

    # update
    p_upd = subparsers.add_parser("update", help="Actualizar lista de paquetes")
    p_upd.set_defaults(func=cmd_update)

    # security
    p_sec = subparsers.add_parser("security", help="Auditoría de seguridad")
    p_sec.set_defaults(func=cmd_security)

    # device
    p_dev = subparsers.add_parser("device", help="Información del dispositivo")
    p_dev.set_defaults(func=cmd_device)

    # interactive
    p_int = subparsers.add_parser("interactive", help="Modo interactivo")
    p_int.set_defaults(func=cmd_interactive)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        print("\nEjemplo: verdix-ai chat 'Hola, ¿cómo estás?'")
        return

    args.func(args)


if __name__ == "__main__":
    main()