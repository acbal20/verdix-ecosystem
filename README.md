# VERDIX ECOSYSTEM

Ecosistema tecnológico integrado, moderno, futurista, ligero y seguro para equipos modestos y modernos.

**Responsable:** Yeremy Galeano  
**Versión:** 1.0.0 (alpha)  
**Estado:** Desarrollo activo  
**Sitio:** https://verdix-oficial.vercel.app  
**GitHub:** https://github.com/acbal20

## Estructura del monorepo

```
verdix-ecosystem/
├── web/           # Verdix Web: backend (server.py, puerto 8099) + frontend desplegable
│   ├── server.py         # Servidor HTTP + API /api/chat, /api/search, /api/health
│   ├── api/              # API serverless (chat.js, search.js)
│   ├── assets/           # CSS, JS, imágenes
│   ├── *.html            # Páginas: index, ai, browser, search, download, 404, etc.
│   ├── sw.js             # Service Worker (PWA)
│   ├── manifest.json     # Manifiesto PWA
│   └── .env.example      # Plantilla de variables (rellenar en .env, no subir)
├── ai/             # Verdix AI CLI (verdix_ai/)
│   ├── verdix_ai/        # cli.py: chat, imagen, exec, install, update, seguridad
│   ├── setup.py          # Instalador Python
│   └── README.md
├── docs/           # Documentación de arquitectura y decisiones
│   └── ESPECIFICACION_MAESTRA_VERDIX.md
└── scripts/        # Scripts de automatización y despliegue (VERDIX DEPLOY)
    ├── verdix-maestro.sh
    ├── verdix-maestro-completo.sh
    ├── verdix-autobot.py
    ├── verdix-monitor.py
    ├── desplegar-todo.sh
    ├── desplegar-vercel.sh
    ├── ejecutar-todo.sh
    ├── verificar-todo.sh
    └── informe-emergencia.sh
```

## Proyectos originales (no movidos, enlaces en VERDIX-CENTRAL/01-PROYECTOS)

- verdix-web (recursos adicionales: admin, Ben10, iconos)
- verdix-web-deploy (fuente de web/ — backend + frontend)
- verdix-os-debian (VERDIX OS — configuración live-build, requiere restauración)
- verdix-ai-cli (fuente de ai/)
- verdix-automation (fuente de scripts/)
- verdix-desktop, verdix-ota, verdix-admin, verdix-work, verdix-rom, verdix-downloads

## Seguridad

- Nunca subir `.env`, claves API, tokens ni contraseñas.
- `.env.example` es solo una plantilla.
- Verificar antes de publicar: no incluir secretos, builds fallidos ni artefactos no verificados.

## Cómo contribuir

1. Clonar el repositorio (PRIVATE).
2. Crear rama desde `main`.
3. Realizar cambios y pruebas.
4. Abrir pull request.
5. Mantener commits atómicos y descriptivos.

## Licencia

Ver archivos LICENSE (pendiente de añadir).
