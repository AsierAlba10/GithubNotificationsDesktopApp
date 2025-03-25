const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');
const githubAPI = require('./app/api/github');

// Configuración para persistencia
const store = new Store();

// Variable global para mantener la referencia a la ventana
let mainWindow;
let tray;
let isQuitting = false;

function createWindow() {
    // Crear la ventana del navegador
    mainWindow = new BrowserWindow({
        width: 900,
        height: 680,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'public/icon.png')
    });

    // Cargar el archivo HTML de la app
    mainWindow.loadFile('public/index.html');

    // Abrir las herramientas de desarrollo si estamos en desarrollo
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Evento cuando se cierra la ventana
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            return false;
        }
    });
}

// Crear ícono en la bandeja del sistema
function createTray() {
    const iconPath = path.join(__dirname, 'public/icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Abrir GitHub Notifications',
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: 'Comprobar notificaciones',
            click: () => {
                mainWindow.webContents.send('check-notifications');
            }
        },
        { type: 'separator' },
        {
            label: 'Salir',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('GitHub Notifications');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
}

// Manejo para mostrar notificaciones del sistema
function showNotification(title, body, options = {}) {
    const notification = new Notification({
        title,
        body,
        icon: options.icon || path.join(__dirname, 'public/icon.png'),
        silent: options.silent || false,
        // Propiedades específicas para macOS
        subtitle: options.subtitle || '',
        closeButtonText: options.closeButtonText || 'Cerrar'
    });

    notification.show();

    // Manejar eventos de clic si se proporciona un callback
    if (options.onClick) {
        notification.on('click', options.onClick);
    } else {
        // Si no se proporciona un callback específico, usar uno por defecto
        notification.on('click', () => {
            console.log('Notificación clickeada (manejador por defecto)');
            if (mainWindow) {
                // Mostrar la ventana si está oculta
                mainWindow.show();
                // Forzar recarga de notificaciones
                mainWindow.webContents.send('check-notifications');
            }
        });
    }

    return notification;
}

// Configurar los manejadores de eventos IPC
function setupIPC() {
    // Gestión de evento para mostrar notificaciones desde el renderer
    ipcMain.on('show-notification', (event, { title, body }) => {
        showNotification(title, body);
    });

    // Manejar configuración
    ipcMain.handle('config-get', async (event, key) => {
        console.log('Obteniendo config:', key, 'Valor:', store.get(key));
        return store.get(key);
    });

    ipcMain.on('config-set', (event, { key, val }) => {
        console.log('Guardando config:', key, 'Valor:', val);
        store.set(key, val);

        // Si se actualiza el token de GitHub, actualizar el cliente
        if (key === 'githubToken') {
            githubAPI.updateToken(val);
        }

        // Enviar confirmación de vuelta al renderer
        event.reply('config-set-response', { success: true });
    });

    // Manejar API de GitHub
    ipcMain.handle('github-get-notifications', async () => {
        try {
            return await githubAPI.getNotifications();
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            return [];
        }
    });

    ipcMain.handle('github-get-repositories', async () => {
        try {
            return await githubAPI.getRepositories();
        } catch (error) {
            console.error('Error al obtener repositorios:', error);
            return [];
        }
    });

    ipcMain.on('github-mark-read', async (event, id) => {
        try {
            await githubAPI.markNotificationAsRead(id);
            event.reply('github-mark-read-response', { success: true });
        } catch (error) {
            console.error('Error al marcar como leída:', error);
            event.reply('github-mark-read-response', { success: false, error: error.message });
        }
    });
}

// Este método se llamará cuando Electron haya terminado la inicialización
app.whenReady().then(() => {
    createWindow();
    createTray();
    setupIPC();

    // Verificar actualizaciones
    autoUpdater.checkForUpdatesAndNotify();

    // Para macOS, volver a crear la ventana cuando se haga clic en el dock
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
        else mainWindow.show();
    });

    // Programar verificación periódica de notificaciones
    setInterval(() => {
        checkForNewNotifications();
    }, 5000); // cada 5 segundos
});

// Función para verificar nuevas notificaciones
async function checkForNewNotifications() {
    try {
        const lastNotifications = store.get('lastNotifications') || [];
        const newNotifications = await githubAPI.getNotifications();

        // Si hay nuevas notificaciones que no existían antes
        if (newNotifications.length > 0) {
            const lastIds = new Set(lastNotifications.map(n => n.id));
            const newItems = newNotifications.filter(n => !lastIds.has(n.id));

            if (newItems.length > 0) {
                // Imprimir información de depuración de las nuevas notificaciones
                newItems.forEach(notification => {
                    console.log(`Nueva notificación: 
                                - ID: ${notification.id}
                                - Asignado por: ${notification.assignee?.login || 'N/A'}
                                - Tipo: ${notification.subject?.type || 'N/A'}
                                - Razón: ${notification.reason}
                                - Título: ${notification.subject?.title || 'Sin título'}
                                - Repo: ${notification.repository?.full_name || 'N/A'}`);
                });

                // Buscar asignaciones a issues específicamente
                const assignedIssues = newItems.filter(n =>
                    n.reason === 'assign' &&
                    n.subject &&
                    n.subject.type === 'Issue'
                );

                // Notificar sobre asignaciones específicamente
                if (assignedIssues.length > 0) {
                    for (const issue of assignedIssues) {
                        let issueNumber = null;
                        let owner = null;
                        let repo = null;

                        if (issue.subject && issue.subject.url) {
                            const urlParts = issue.subject.url.split('/');
                            if (urlParts.length >= 8) {
                                owner = urlParts[4];
                                repo = urlParts[5];
                                issueNumber = parseInt(urlParts[7], 10);
                            }
                        }

                        let assignedBy = 'Alguien';

                        if (owner && repo && issueNumber) {
                            try {
                                console.log(`Obteniendo detalles para issue #${issueNumber} en ${owner}/${repo}`);
                                const issueDetails = await githubAPI.getIssueDetails(owner, repo, issueNumber);

                                if (issueDetails.assigned_by) {
                                    assignedBy = issueDetails.assigned_by;
                                }

                                showNotification(
                                    `@${assignedBy} te ha asignado una issue`,
                                    `${issue.subject.title || 'Nueva asignación'}`,
                                    {
                                        subtitle: `${issue.repository.full_name}`,
                                        silent: false,
                                    }
                                );
                            } catch (error) {
                                console.error(`Error obteniendo detalles de la issue: ${error.message}`);
                                // Si falla la obtención de detalles, mostramos la notificación básica
                                showNotification(
                                    `Te han asignado una issue en ${issue.repository.full_name}`,
                                    `${issue.subject.title || 'Nueva asignación'}`,
                                    {
                                        subtitle: 'Asignación de Issue',
                                        silent: false,
                                    }
                                );
                            }
                        } else {
                            // No pudimos extraer la información de la URL, mostrar notificación básica
                            showNotification(
                                `Te han asignado una issue en ${issue.repository.full_name}`,
                                `${issue.subject.title || 'Nueva asignación'}`,
                                {
                                    subtitle: 'Asignación de Issue',
                                    silent: false,
                                }
                            );
                        }
                    }
                }

                // Enviar evento al renderer
                if (mainWindow) {
                    mainWindow.webContents.send('new-notification', newItems);
                }
            }

            // Actualizar notificaciones almacenadas
            store.set('lastNotifications', newNotifications);
        }
    } catch (error) {
        console.error('Error verificando nuevas notificaciones:', error);
    }
}

// Salir cuando todas las ventanas estén cerradas, excepto en macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Cuando la aplicación va a cerrarse
app.on('before-quit', () => {
    isQuitting = true;
});
