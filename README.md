# GitHub Notifications Desktop

Una aplicación de escritorio para monitorear las notificaciones de GitHub en tiempo real.

## Características

- 🔔 Monitor en tiempo real de notificaciones de GitHub
- 📱 Notificaciones del sistema cuando llegas nuevas alertas
- 🔍 Agrupación de notificaciones por repositorio
- 🌙 Ejecución en segundo plano con icono en la bandeja del sistema
- 🔐 Autenticación segura con token de GitHub
- 💻 Compatible con Windows, macOS y Linux

## Capturas de pantalla

*Próximamente*

## Instalación

### Desde los ejecutables

Descarga el instalador apropiado para tu sistema operativo desde la sección de [Releases](https://github.com/tuusuario/github-notifications/releases).

### Desde el código fuente

```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/github-notifications.git
cd github-notifications

# Instalar dependencias
npm install

# Iniciar la aplicación
npm start
```

## Desarrollo

```bash
# Ejecutar en modo desarrollo
npm run dev

# Construir para tu plataforma
npm run build

# Construir para plataformas específicas
npm run build:mac
npm run build:win
npm run build:linux
```

## Autenticación

Para utilizar la aplicación, necesitarás un token de acceso personal de GitHub:

1. Ve a [GitHub Token Settings](https://github.com/settings/tokens)
2. Haz clic en "Generate new token"
3. Asigna un nombre descriptivo, como "GitHub Notifications App"
4. Selecciona los permisos: "notifications" y "repo"
5. Genera el token y cópialo en la aplicación cuando se te solicite

## Tecnologías utilizadas

- [Electron](https://www.electronjs.org/) - Framework para aplicaciones de escritorio
- [React](https://reactjs.org/) - Biblioteca de interfaz de usuario
- [Octokit](https://github.com/octokit/rest.js/) - Cliente de API de GitHub para JavaScript

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## Licencia

[MIT](LICENSE)

---

Desarrollado con ❤️ para la comunidad de desarrolladores de GitHub. 