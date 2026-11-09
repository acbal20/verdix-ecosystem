#!/bin/bash
# VERDIX MASTER - script de informe de emergencia
# No modifica proyectos. Solo recopila estado para continuacion.
BASE="$HOME/VERDIX-CENTRAL"
SESION="$BASE/10-SESIONES"
mkdir -p "$SESION"

{
    echo "======================================"
    echo "VERDIX MASTER - INFORME DE EMERGENCIA"
    echo "Fecha: $(date)"
    echo "Equipo: $(hostname)"
    echo "======================================"
    echo
    echo "=== SISTEMA ==="
    cat /etc/os-release 2>/dev/null
    echo
    echo "=== MEMORIA ==="
    free -h 2>/dev/null
    echo
    echo "=== ALMACENAMIENTO ==="
    df -h "$HOME" / 2>/dev/null
    echo
    echo "=== PROYECTOS ==="
    for p in \
    verdix-web verdix-web-deploy verdix-os-debian \
    verdix-rom verdix-ai-cli verdix-desktop \
    verdix-ota verdix-automation verdix-admin verdix-work
    do
        if [ -d "$HOME/$p" ]; then
            echo "ENCONTRADO: $HOME/$p"
            if [ -d "$HOME/$p/.git" ]; then
                git -C "$HOME/$p" status --short 2>/dev/null | head -30
                echo "ultimo commit: $(git -C "$HOME/$p" log --oneline -1 2>/dev/null)"
            else
                echo "(no es repositorio git)"
            fi
        else
            echo "NO ENCONTRADO: $HOME/$p"
        fi
    done
    echo
    echo "=== ESTADO DE SESION ==="
    for f in ESTADO_ACTUAL.md CONTINUAR.txt HISTORIAL.md INFORME_PARA_CHATGPT.txt; do
        if [ -f "$SESION/$f" ]; then
            echo "--- $f ---"
            cat "$SESION/$f"
        else
            echo "--- $f: NO EXISTE ---"
        fi
    done
    echo
    echo "=== VERDIX-CENTRAL (arbol 2 niveles) ==="
    find "$BASE" -maxdepth 2 -type f 2>/dev/null | sort | head -80
    echo
    echo "=== FIN DEL INFORME ==="
} > "$SESION/INFORME_PARA_CHATGPT.txt"

echo "Informe generado:"
echo "$SESION/INFORME_PARA_CHATGPT.txt"
