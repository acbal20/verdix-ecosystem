#!/bin/bash
# ============================================================
# VERDIX DEPLOY — Sistema de publicación automatizada
# ============================================================
# Destinos aprobados: GitHub, GitHub Releases, Vercel.
# No publicar secretos, claves API, contraseñas, builds fallidos
# ni artefactos no verificados.
# ============================================================

set -euo pipefail

# --- Colores ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${BLUE}[VERDIX DEPLOY]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[ADVERTENCIA]${NC} $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*"; }

# --- Configuración ---
REPO_DIR="${VERDIX_REPO_DIR:-$(pwd)}"
LOG_DIR="${REPO_DIR}/logs/deploy"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/deploy_${TIMESTAMP}.log"
VERSION_FILE="${REPO_DIR}/VERSION"
CHANGELOG_FILE="${REPO_DIR}/CHANGELOG.md"

mkdir -p "$LOG_DIR"

# Registrar inicio (sin secretos)
{
    echo "========================================"
    echo "VERDIX DEPLOY — $(date)"
    echo "Repositorio: $REPO_DIR"
    echo "Usuario: $(whoami)"
    echo "========================================"
} | tee -a "$LOG_FILE"

# --- Funciones ---

check_git_status() {
    log "Comprobando estado de Git..."
    if ! git -C "$REPO_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        err "No es un repositorio Git: $REPO_DIR"
        return 1
    fi
    local changes
    changes=$(git -C "$REPO_DIR" status --porcelain)
    if [ -n "$changes" ]; then
        warn "Hay cambios sin commitear:"
        echo "$changes" | tee -a "$LOG_FILE"
        return 1
    fi
    ok "Repositorio limpio (sin cambios sin commitear)"
    echo "Último commit: $(git -C "$REPO_DIR" log --oneline -1)" | tee -a "$LOG_FILE"
    return 0
}

run_tests() {
    log "Ejecutando pruebas de sintaxis..."
    local failed=0

    # Python
    while IFS= read -r -d '' f; do
        if ! python3 -m py_compile "$f" 2>/dev/null; then
            err "py_compile falló: $f"
            failed=1
        else
            ok "py_compile: $f"
        fi
    done < <(find "$REPO_DIR" -name "*.py" -not -path "*/.git/*" -not -path "*/__pycache__/*" -print0 2>/dev/null)

    # Bash
    while IFS= read -r -d '' f; do
        if ! bash -n "$f" 2>/dev/null; then
            err "bash -n falló: $f"
            failed=1
        else
            ok "bash -n: $f"
        fi
    done < <(find "$REPO_DIR" -name "*.sh" -not -path "*/.git/*" -print0 2>/dev/null)

    # JavaScript/Node
    while IFS= read -r -d '' f; do
        if ! node --check "$f" 2>/dev/null; then
            err "node --check falló: $f"
            failed=1
        else
            ok "node --check: $f"
        fi
    done < <(find "$REPO_DIR" -name "*.js" -not -path "*/.git/*" -not -path "*/node_modules/*" -print0 2>/dev/null)

    if [ "$failed" -ne 0 ]; then
        err "Algunas pruebas fallaron."
        return 1
    fi
    ok "Todas las pruebas de sintaxis pasaron"
    return 0
}

audit_secrets() {
    log "Auditoría de secretos (sin mostrar valores)..."
    local patterns=("API_KEY" "SECRET" "PASSWORD" "passwd" "token" "sk-" "ghp_")
    local found=0

    for p in "${patterns[@]}"; do
        while IFS= read -r -d '' f; do
            # Saltar .env.example (plantilla sin valores) y .git
            if [[ "$f" == *".env.example"* ]] || [[ "$f" == *".git/"* ]]; then
                continue
            fi
            if grep -qiE "$p" "$f" 2>/dev/null; then
                warn "Posible secreto en: $f (valor no mostrado)"
                found=1
            fi
        done < <(find "$REPO_DIR" -type f -not -path "*/.git/*" -not -path "*/__pycache__/*" -print0 2>/dev/null)
    done

    if [ "$found" -ne 0 ]; then
        err "Se detectaron posibles secretos. Revisar antes de publicar."
        return 1
    fi
    ok "No se detectaron secretos expuestos"
    return 0
}

calculate_hash() {
    local file="$1"
    if [ -f "$file" ]; then
        sha256sum "$file" | awk '{print $1}'
    else
        echo ""
    fi
}

generate_version() {
    log "Generando versión..."
    local version="1.0.0-alpha-${TIMESTAMP}"
    if [ -f "$VERSION_FILE" ]; then
        version=$(cat "$VERSION_FILE")
    fi
    echo "$version" > "$VERSION_FILE"
    ok "Versión: $version"
    echo "$version"
}

generate_changelog() {
    log "Generando changelog..."
    local version="$1"
    {
        echo "# Changelog"
        echo ""
        echo "## ${version} — $(date +%Y-%m-%d)"
        echo ""
        echo "- Versión inicial del ecosistema Verdix"
        echo "- Web: servidor + API + frontend desplegable"
        echo "- AI: CLI con chat, imagen, exec, seguridad"
        echo "- Scripts: automatización y despliegue"
        echo ""
        if [ -f "$CHANGELOG_FILE" ]; then
            cat "$CHANGELOG_FILE"
        fi
    } > "${CHANGELOG_FILE}.tmp"
    mv "${CHANGELOG_FILE}.tmp" "$CHANGELOG_FILE"
    ok "Changelog generado en $CHANGELOG_FILE"
}

verify_artifact() {
    local file="$1"
    local expected_size_min="${2:-1}"
    if [ ! -f "$file" ]; then
        err "Artefacto no encontrado: $file"
        return 1
    fi
    local size
    size=$(stat -c%s "$file" 2>/dev/null || echo 0)
    if [ "$size" -le "$expected_size_min" ]; then
        err "Artefacto vacío o demasiado pequeño: $file ($size bytes)"
        return 1
    fi
    local hash
    hash=$(calculate_hash "$file")
    ok "Artefacto verificado: $file (${size} bytes, SHA-256: ${hash:0:16}...)"
    echo "$hash"
}

publish_github_release() {
    local version="$1"
    log "Verificando autenticación de GitHub (gh)..."
    if ! gh auth status >/dev/null 2>&1; then
        err "gh no está autenticado. Ejecutar: gh auth login"
        return 1
    fi

    log "Creando release en GitHub: $version"
    # Nota: requiere que el repositorio ya exista y esté vinculado
    if ! gh release create "v${version}" \
        --title "Verdix Ecosystem v${version}" \
        --notes "$(cat "$CHANGELOG_FILE")" \
        2>&1 | tee -a "$LOG_FILE"; then
        err "Fallo al crear release de GitHub"
        return 1
    fi
    ok "Release de GitHub creada: v${version}"
    return 0
}

publish_vercel() {
    log "Publicando en Vercel..."
    if ! command -v vercel >/dev/null 2>&1; then
        err "vercel CLI no instalado"
        return 1
    fi
    if ! vercel whoami >/dev/null 2>&1; then
        err "vercel no autenticado. Ejecutar: vercel login"
        return 1
    fi
    local user
    user=$(vercel whoami 2>/dev/null)
    ok "Vercel autenticado como: $user"
    # El despliegue real requiere vercel --prod en el directorio del proyecto
    warn "Despliegue Vercel pendiente: ejecutar 'vercel --prod' en el directorio del proyecto"
    return 0
}

# --- Flujo principal ---

main() {
    local version

    echo "========================================"
    echo "  VERDIX DEPLOY — Sistema de publicación"
    echo "========================================"
    echo ""

    # 1. Estado de Git
    if ! check_git_status; then
        err "Git no está listo. Corregir y reintentar."
        return 1
    fi

    # 2. Pruebas
    if ! run_tests; then
        err "Pruebas falladas. No se publicará."
        return 1
    fi

    # 3. Auditoría de secretos
    if ! audit_secrets; then
        err "Auditoría de secretos fallada. No se publicará."
        return 1
    fi

    # 4. Versión y changelog
    version=$(generate_version)
    generate_changelog "$version"

    # 5. Verificar artefactos (si existen)
    log "Verificando artefactos disponibles..."
    for artifact in "$REPO_DIR"/*.iso "$REPO_DIR"/*.zip "$REPO_DIR"/*.apk "$REPO_DIR"/*.exe; do
        [ -f "$artifact" ] && verify_artifact "$artifact"
    done

    # 6. Publicar (sí autenticado)
    echo ""
    log "Intentando publicación en destinos autorizados..."
    publish_github_release "$version" || warn "GitHub Release no publicado (ver bloqueo)"
    publish_vercel || warn "Vercel no publicado (ver bloqueo)"

    # 7. Resumen
    echo ""
    echo "========================================"
    echo "  VERDIX DEPLOY — Finalizado"
    echo "  Versión: $version"
    echo "  Log: $LOG_FILE"
    echo "========================================"
    return 0
}

main "$@"
