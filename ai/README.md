# Verdix AI CLI

Asistente de IA para la terminal. Permite usar Verdix AI desde la línea de comandos localmente.

## Instalación

```bash
# Instalar desde el repositorio local
pip install .

# O instalar en modo desarrollo
pip install -e .
```

## Uso

### Chat con IA
```bash
verdix-ai chat "Hola, ¿cómo estás?"
verdix-ai chat "Explicame qué es Python"
```

### Generar imágenes
```bash
verdix-ai image "un gato cyberpunk en una ciudad neon"
```

### Ejecutar comandos del sistema
```bash
verdix-ai exec "ls -la"
verdix-ai exec "whoami"
```

### Instalar paquetes
```bash
verdix-ai install curl
verdix-ai install htop
```

### Actualizar sistema
```bash
verdix-ai update
```

### Auditoría de seguridad
```bash
verdix-ai security
```

### Información del dispositivo
```bash
verdix-ai device
```

### Modo interactivo
```bash
verdix-ai interactive
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `OPENROUTER_API_KEY` | Clave de API de OpenRouter (requerida para la IA) |
| `VERDIX_API_BASE` | URL base de la API (por defecto: https://verdix-oficial.vercel.app/api) |

## Seguridad

- Los comandos peligrosos están bloqueados (rm -rf /, mkfs, dd, etc.)
- Se verifica conexión HTTPS al servidor
- Se auditan permisos de directorios sensibles
- Validación de entrada en todos los comandos
