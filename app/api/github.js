const { Octokit } = require('@octokit/rest');
const Store = require('electron-store');

const store = new Store();

// Clase para interactuar con la API de GitHub
class GitHubAPI {
    constructor() {
        this.octokit = null;
        this.initializeClient();
        this.cachedRepos = null;
        this.lastRepoFetch = null;
    }

    // Inicializar el cliente Octokit con el token almacenado
    initializeClient() {
        const token = store.get('githubToken');

        if (token) {
            console.log('Inicializando cliente GitHub con token: ' + token.substring(0, 4) + '...');
            this.octokit = new Octokit({
                auth: token,
                userAgent: 'GitHub Notifications Desktop App',
                baseUrl: 'https://api.github.com',
                request: {
                    timeout: 5000
                }
            });
        } else {
            console.log('No hay token almacenado. Se requiere autenticación.');
        }
    }

    // Actualizar el token si cambia
    updateToken(token) {
        if (!token) {
            console.log('Token vacío proporcionado, eliminando autenticación');
            store.delete('githubToken');
            this.octokit = null;
            return;
        }

        console.log('Actualizando token: ' + token.substring(0, 4) + '...');
        store.set('githubToken', token);
        this.initializeClient();
        // Verificar inmediatamente si el token es válido
        this.validateToken()
            .then(isValid => {
                console.log('Token válido:', isValid);
            })
            .catch(err => {
                console.error('Error validando token:', err);
            });
    }

    // Verificar si el token es válido
    async validateToken() {
        if (!this.octokit) {
            return false;
        }

        try {
            const { data } = await this.octokit.users.getAuthenticated();
            return !!data;
        } catch (error) {
            console.error('Error al validar el token:', error);
            return false;
        }
    }

    // Obtener notificaciones del usuario
    async getNotifications() {
        if (!this.octokit) {
            throw new Error('No autorizado. Inicia sesión primero.');
        }

        try {
            // Obtener notificaciones con todos los detalles
            const { data } = await this.octokit.activity.listNotificationsForAuthenticatedUser({
                all: false,  // Solo notificaciones no leídas
                participating: false,  // Todas, no solo las que participa el usuario
                per_page: 100,  // Aumentar cantidad máxima
            });

            console.log(`Se obtuvieron ${data.length} notificaciones`);

            // Obtener repositorios del usuario para mostrar incluso los que no tienen notificaciones
            await this.getRepositories();

            return data;
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            throw error;
        }
    }

    // Obtener todos los repositorios del usuario (propios y colaborador)
    async getRepositories() {
        if (!this.octokit) {
            throw new Error('No autorizado. Inicia sesión primero.');
        }

        // Usar cache si ya se obtuvieron hace menos de 10 minutos
        const now = Date.now();
        if (this.cachedRepos && this.lastRepoFetch && (now - this.lastRepoFetch < 600000)) {
            console.log('Usando caché de repositorios');
            return this.cachedRepos;
        }

        try {
            console.log('Obteniendo repositorios del usuario...');

            // Obtener primero los repositorios propios
            const userRepos = await this.octokit.paginate(this.octokit.repos.listForAuthenticatedUser, {
                per_page: 100,
                sort: 'updated'
            });

            console.log(`Se obtuvieron ${userRepos.length} repositorios propios`);

            // Obtener los repositorios en los que el usuario es colaborador
            const contribRepos = await this.octokit.paginate(this.octokit.repos.listForAuthenticatedUser, {
                per_page: 100,
                sort: 'updated',
                affiliation: 'collaborator'
            });

            console.log(`Se obtuvieron ${contribRepos.length} repositorios como colaborador`);

            // Combinar los repositorios y eliminar duplicados
            const allRepos = [...userRepos, ...contribRepos];
            const uniqueRepos = Array.from(new Map(allRepos.map(repo => [repo.id, repo])).values());

            // Guardar en caché
            this.cachedRepos = uniqueRepos;
            this.lastRepoFetch = now;

            console.log(`Total de ${uniqueRepos.length} repositorios únicos`);
            return uniqueRepos;
        } catch (error) {
            console.error('Error al obtener repositorios:', error);
            throw error;
        }
    }

    // Marcar una notificación como leída
    async markNotificationAsRead(notificationId) {
        if (!this.octokit) {
            throw new Error('No autorizado. Inicia sesión primero.');
        }

        try {
            await this.octokit.activity.markThreadAsRead({
                thread_id: notificationId,
            });
            return true;
        } catch (error) {
            console.error('Error al marcar como leída:', error);
            throw error;
        }
    }

    // Marcar todas las notificaciones como leídas
    async markAllNotificationsAsRead() {
        if (!this.octokit) {
            throw new Error('No autorizado. Inicia sesión primero.');
        }

        try {
            await this.octokit.activity.markNotificationsAsRead();
            return true;
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
            throw error;
        }
    }

    // Obtener detalles completos de una issue, incluyendo quién asignó
    async getIssueDetails(owner, repo, issue_number) {
        if (!this.octokit) {
            throw new Error('No autorizado. Inicia sesión primero.');
        }

        try {
            // Obtener detalles básicos de la issue
            const { data: issueData } = await this.octokit.issues.get({
                owner,
                repo,
                issue_number
            });

            // Obtener eventos de la issue para encontrar quién asignó
            const { data: events } = await this.octokit.issues.listEvents({
                owner,
                repo,
                issue_number
            });

            // Buscar el evento de asignación más reciente
            const assignEvents = events
                .filter(event => event.event === 'assigned')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Añadir información sobre quién asignó, si existe
            if (assignEvents.length > 0) {
                issueData.assigned_by = assignEvents[0].assigner.login;
            }

            return issueData;
        } catch (error) {
            console.error('Error al obtener detalles de la issue:', error);
            throw error;
        }
    }
}

// Exportar una instancia única
const githubAPI = new GitHubAPI();
module.exports = githubAPI; 