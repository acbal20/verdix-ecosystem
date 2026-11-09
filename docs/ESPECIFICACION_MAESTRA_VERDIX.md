# ESPECIFICACION MAESTRA VERDIX
**Versión:** 1.0  
**Estado:** Diseño aprobado para desarrollo  
**Responsable del proyecto:** Yeremy Galeano  
**Nombre del ecosistema:** Verdix  
**Fecha:** 2026-11-08

## 1. Visión general

Verdix será un ecosistema tecnológico integrado, moderno, futurista, personalizable y optimizado para equipos modestos y modernos.

No será únicamente una distribución Linux. Será un conjunto de productos que compartirán identidad visual, herramientas, servicios, actualizaciones y mecanismos de administración.

**Objetivo principal:** desarrollar Verdix OS como sistema operativo principal, con Verdix IA integrada, Verdix Browser como navegador predeterminado y Verdix Search como buscador predeterminado del navegador.

El ecosistema también incluirá aplicaciones, videojuegos, herramientas de desarrollo, seguridad, actualizaciones y publicación automatizada.

### Principios obligatorios

1. Rendimiento antes que efectos visuales innecesarios.
2. Seguridad antes que automatización sin límites.
3. Diseño profesional y futurista.
4. Personalización profunda.
5. Compatibilidad con hardware antiguo y moderno.
6. Código mantenible, modular y documentado.
7. Pruebas reales antes de declarar una función terminada.
8. Instalación y publicación reproducibles.
9. Respaldos antes de cambios importantes.
10. Transparencia: nunca presentar una función no probada como terminada.

## 2. VERDIX OS

### 2.1 Base y compatibilidad

- Sistema basado en Debian estable.
- Arquitectura principal inicial: x86_64.
- Escritorio ligero, preferentemente XFCE optimizado o una alternativa técnicamente justificada.
- Arranque BIOS Legacy y UEFI.
- Compatibilidad con discos MBR y GPT.
- ISO híbrida, cuando las herramientas de construcción lo permitan.
- Modo Live USB.
- Instalador gráfico.
- Detección de CPU, RAM, almacenamiento, GPU, red y firmware.
- Compatibilidad con equipos antiguos y modernos dentro de los límites de sus controladores.
- Instalación sin conexión cuando sea posible, con descarga opcional de componentes adicionales.

La compatibilidad BIOS/MBR y UEFI/GPT debe probarse por separado. No basta con que la ISO arranque en una máquina virtual.

### 2.2 Rendimiento

Objetivos de diseño:

- Funcionamiento razonable en equipos con 4 GB de RAM.
- Servicios en segundo plano mínimos.
- Inicio rápido.
- Consumo reducido en reposo.
- Aplicaciones ligeras.
- Sin animaciones pesadas obligatorias.
- Perfiles de rendimiento: Ahorro, Equilibrado y Rendimiento.
- Servicios opcionales desactivables desde Verdix Control.
- Compilaciones y actualizaciones que no bloqueen todo el escritorio.

El equipo de desarrollo actual tiene un Celeron 4205U y 4 GB de RAM. Debe utilizarse como referencia de rendimiento mínimo, sin convertirlo en el único hardware compatible.

### 2.3 Interfaz y personalización

Identidad visual:

- Nombre: Verdix.
- Estilo: futurista, profesional, limpio y tecnológico.
- Paleta base: azul eléctrico, violeta y cian.
- Modo oscuro y claro.
- Transparencias moderadas.
- Iconografía coherente.
- Tipografía legible.
- Animaciones configurables.
- Interfaz en español, con posibilidad de inglés.

El usuario debe poder personalizar:

- Temas.
- Colores.
- Iconos.
- Fuentes.
- Fondos.
- Barra y paneles.
- Menú de aplicaciones.
- Widgets.
- Accesos directos.
- Sonidos.
- Comportamiento de ventanas.
- Pantalla de inicio y bloqueo.
- Distribución del escritorio.

La personalización no debe exigir editar archivos del sistema manualmente.

### 2.4 Aplicaciones esenciales

Incluir solo lo necesario inicialmente:

- Administrador de archivos.
- Navegador Verdix Browser.
- Terminal.
- Configuración Verdix Control.
- Centro de aplicaciones.
- Administrador de tareas.
- Capturas de pantalla.
- Visor de imágenes y documentos.
- Herramientas de red.
- Administrador de actualizaciones.
- Herramientas de recuperación.
- Verdix IA.

Las aplicaciones adicionales deben poder instalarse desde Verdix Center.

### 2.5 Instalador y recuperación

El instalador debe:

- Detectar discos, particiones y sistemas existentes.
- Mostrar claramente el disco seleccionado.
- Diferenciar MBR y GPT.
- Advertir sobre pérdida de datos.
- Permitir instalación manual y guiada.
- Validar espacio, arquitectura y compatibilidad.
- Ofrecer instalación junto a otro sistema cuando sea viable.
- Permitir elegir el cargador de arranque.
- Crear registros de instalación.
- Comprobar el resultado antes de reiniciar.

**Regla de seguridad:** ninguna operación de particionado, formateo, instalación en disco o modificación del arranque se ejecutará sin confirmación explícita del usuario. Nunca seleccionar automáticamente el disco principal.

Verdix Recovery debe ofrecer diagnóstico, reparación, restauración de configuraciones y recuperación de arranque cuando sea técnicamente posible.

## 3. VERDIX IA

Aplicación nativa integrada en el escritorio, con interfaz propia y acceso desde el panel, el menú y los atajos configurables.

### 3.1 Modalidad híbrida

- IA online mediante proveedores y modelos configurables.
- Compatibilidad con distintos proveedores, sin depender de uno solo.
- Funciones offline mediante herramientas locales, reglas y comandos deterministas.
- Modelos locales opcionales cuando el hardware lo permita.
- En equipos de 4 GB, evitar cargar modelos grandes.
- Indicar claramente cuándo una función necesita Internet.

La ausencia de Internet no debe impedir las funciones locales básicas de administración.

### 3.2 Funciones

La IA debe poder:

- Responder preguntas.
- Explicar errores.
- Ayudar a configurar el sistema.
- Diagnosticar problemas.
- Buscar información en Internet.
- Instalar aplicaciones.
- Actualizar paquetes.
- Ejecutar comandos.
- Crear, organizar y modificar archivos.
- Abrir aplicaciones.
- Consultar el hardware.
- Ayudar con programación.
- Administrar servicios permitidos.
- Generar informes.
- Explicar qué cambios realizará.

Ejemplos:

- «Instálame Firefox».
- «Actualiza el sistema».
- «Comprueba por qué está lento».
- «Crea una carpeta para mis proyectos».
- «Abre Verdix Browser».
- «Busca errores y explícame cómo corregirlos».
- «Instala este programa y ejecútalo».

### 3.3 Sistema de permisos

La IA debe tener un motor de ejecución separado de la interfaz conversacional.

Cada acción debe clasificarse:

- **Lectura:** consultar información, listar archivos y diagnosticar.
- **Bajo riesgo:** abrir aplicaciones y crear archivos en espacios permitidos.
- **Riesgo moderado:** instalar paquetes, cambiar configuraciones y administrar servicios.
- **Alto riesgo:** borrar datos, ejecutar comandos como administrador, modificar particiones, cambiar el arranque o tocar discos.

Las acciones que cambien el sistema deben mostrar qué se hará y solicitar autorización según su riesgo.

Las acciones de alto riesgo requieren confirmación explícita, específica e informada. Nunca aceptar una autorización genérica para operaciones futuras.

La IA no debe ejecutar automáticamente comandos recibidos de páginas web, archivos descargados o mensajes externos.

### 3.4 Registro y control

- Historial de acciones.
- Comando ejecutado.
- Motivo.
- Fecha.
- Resultado.
- Permiso concedido.
- Opción para detener una operación.
- Registro sin contraseñas, tokens ni claves.
- Modo de solo diagnóstico.

## 4. VERDIX BROWSER

Navegador oficial del ecosistema y navegador predeterminado de Verdix OS.

### Características

- Interfaz moderna y equilibrada.
- Pestañas.
- Marcadores.
- Historial.
- Descargas.
- Perfiles.
- Búsqueda desde la barra de direcciones.
- Modo privado.
- Protección contra rastreadores.
- Advertencias de páginas peligrosas.
- Administración de permisos por sitio.
- Gestión de cookies.
- Atajos.
- Temas.
- Extensiones cuando el motor elegido lo permita.
- Integración con Verdix IA.

Debe utilizar una tecnología ligera y mantenible. Evaluar motores existentes antes de desarrollar uno propio. Evitar Electron salvo justificación técnica demostrable.

Verdix Browser debe registrarse correctamente como navegador predeterminado del escritorio y del sistema, incluyendo los tipos de enlace y protocolos compatibles.

## 5. VERDIX SEARCH

Buscador predeterminado de Verdix Browser.

Funciones:

- Búsqueda web.
- Sugerencias.
- Autocompletado.
- Historial configurable.
- Filtros.
- Búsqueda por categorías.
- Resultados organizados.
- Integración opcional con Verdix IA.
- Configuración de privacidad.
- Proveedores alternativos configurables.

Separar claramente el navegador, el buscador y los servicios de búsqueda. No afirmar que existe un índice propio de Internet si realmente se utiliza un proveedor externo.

## 6. VERDIX CENTER

Centro de aplicaciones del ecosistema.

- Instalar.
- Actualizar.
- Desinstalar.
- Buscar aplicaciones.
- Ver permisos.
- Consultar tamaño.
- Mostrar origen y versión.
- Verificar firmas cuando estén disponibles.
- Permitir repositorios compatibles.
- Mostrar advertencias de seguridad.
- Integración con Verdix IA.

Preferir paquetes Debian y formatos compatibles con la distribución. No descargar ni ejecutar instaladores desconocidos sin verificación.

## 7. VERDIX GAME

Proyecto de videojuego multiplataforma.

Evaluar Godot como motor principal por su capacidad multiplataforma y su adecuación a equipos modestos.

Objetivos de exportación:

- Android: APK.
- Windows: EXE o paquete ejecutable.
- Linux: paquete o ejecutable compatible.
- Web: versión jugable si el juego lo permite.
- iOS: proyecto preparado para exportación y compilación con herramientas Apple.

La exportación iOS requiere macOS, Xcode y firma adecuada. No prometer un IPA firmado desde Debian.

El juego debe tener:

- Proyecto fuente organizado.
- Recursos optimizados.
- Controles adaptados a cada plataforma.
- Configuraciones gráficas.
- Pruebas de funcionamiento.
- Versiones identificables.
- Documentación de compilación.
- Builds reproducibles cuando sea posible.

No declarar compatibilidad con una plataforma hasta haber probado su build o documentado claramente la limitación.

## 8. VERDIX SECURITY

- Firewall configurable.
- Auditoría de permisos.
- Comprobación de actualizaciones.
- Diagnóstico de servicios.
- Revisión de aplicaciones instaladas.
- Análisis de integridad.
- Protección básica de navegación.
- Registro de eventos.
- Consejos de seguridad comprensibles.

No prometer protección absoluta ni sustituir soluciones especializadas.

## 9. VERDIX UPDATE Y VERDIX RECOVERY

Verdix Update:

- Actualizaciones del sistema.
- Actualizaciones de aplicaciones.
- Comprobación de integridad.
- Notas de versión.
- Posibilidad de aplazar.
- Recuperación ante fallos cuando sea posible.

Verdix Recovery:

- Copias de configuración.
- Restauración.
- Diagnóstico de arranque.
- Reparación guiada.
- Registro de cambios.
- Puntos de recuperación cuando la tecnología lo permita.

## 10. VERDIX DEPLOY

Sistema de publicación y distribución automatizada.

Destinos aprobados:

- Vercel: página web.
- GitHub: código fuente.
- GitHub Releases: EXE, ZIP, APK e ISO.
- Documentación: repositorios correspondientes.

Funciones:

- Comprobar repositorios.
- Validar compilaciones.
- Ejecutar pruebas.
- Generar versiones.
- Crear etiquetas.
- Generar changelog.
- Crear releases.
- Subir artefactos.
- Verificar archivos publicados.
- Registrar resultados.
- Mantener historial de despliegues.
- Permitir volver a una versión anterior cuando el destino lo permita.

**Autonomía aprobada:** se permite publicar automáticamente en Vercel y GitHub una vez configurados y autorizados explícitamente los repositorios, proyectos, credenciales y reglas de publicación.

No se permite publicar:

- Secretos.
- Claves API.
- Contraseñas.
- Datos privados.
- Archivos sin licencia o sin autorización.
- Builds fallidos.
- Artefactos no verificados.
- Imágenes ISO no probadas que se presenten como estables.

Las credenciales deben almacenarse mediante mecanismos seguros y nunca en el código, informes o historial Git.

## 11. ORGANIZACIÓN DEL ECOSISTEMA

Todos los proyectos deben estar organizados desde:

`/home/yeremy/VERDIX-CENTRAL/`

Conservar los proyectos originales y sus historiales. Usar enlaces simbólicos cuando corresponda, sin duplicar ni mover código sin necesidad.

La estructura central debe separar:

- Proyectos.
- Sistema operativo.
- Aplicaciones.
- IA y automatización.
- Informes.
- Respaldos.
- Compilaciones.
- Planes.
- Recursos.
- Sesiones.

Mantener documentación de arquitectura, decisiones técnicas, dependencias, pruebas, versiones y limitaciones.

## 12. PUBLICACIÓN Y VERSIONADO

Convención de versiones:

- Alpha: desarrollo experimental.
- Beta: funciones integradas, pruebas amplias.
- Release Candidate: candidata a publicación.
- Stable: versión probada y documentada.

Cada publicación debe incluir:

- Nombre del producto.
- Versión.
- Arquitectura.
- Fecha.
- Cambios.
- Requisitos.
- Limitaciones.
- Hash SHA-256.
- Instrucciones de instalación.
- Estado de pruebas.

## 13. CRITERIOS DE ACEPTACIÓN

Verdix OS no se considerará listo para sustituir otro sistema hasta que:

1. La ISO se construya correctamente.
2. Su integridad sea verificada.
3. Arranque en BIOS/MBR.
4. Arranque en UEFI/GPT.
5. Funcione desde USB.
6. Se detecten correctamente los componentes compatibles.
7. Funcionen red, audio, almacenamiento y escritorio en hardware probado.
8. El instalador haya sido probado en discos de prueba o máquinas virtuales.
9. Verdix Browser sea el navegador predeterminado.
10. Verdix Search funcione como buscador predeterminado.
11. Verdix IA complete pruebas de permisos y ejecución.
12. Exista un procedimiento de recuperación.
13. Se hayan realizado respaldos.
14. La documentación esté actualizada.

La instalación en el computador principal será una decisión posterior y separada.

## 14. PRIORIDADES

**P0:** seguridad, respaldos, recuperar el proyecto y verificar el entorno.

**P1:** Verdix OS ligero, arranque BIOS/UEFI, escritorio e instalador.

**P2:** Verdix IA, Browser, Search y Center.

**P3:** Update, Recovery, Security y personalización.

**P4:** Verdix Game y exportaciones multiplataforma.

**P5:** automatización de Vercel, GitHub y distribución.

**P6:** pruebas integrales, documentación, versiones y publicación.

## 15. RESULTADO ESPERADO

Un ecosistema Verdix coherente, funcional, verificable, ligero, seguro, personalizable y preparado para crecer.
