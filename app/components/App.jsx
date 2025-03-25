import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Login from './Login';
import Notifications from './Notifications';
import Header from './Header';

const App = () => {
    const [authenticated, setAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [repositories, setRepositories] = useState([]);
    const [error, setError] = useState(null);

    // Comprobar si ya hay un token guardado al inicio
    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log('Verificando autenticación...');
                const token = await window.electron.config.get('githubToken');
                console.log('Token encontrado:', token ? 'Sí' : 'No');
                if (token) {
                    setAuthenticated(true);
                    // No establecemos loading a false aquí, sino que dejamos que fetchData() lo haga
                    fetchData();
                } else {
                    // Solo establecemos loading a false si no hay token
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error al comprobar autenticación:', err);
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Configurar listener para comprobar notificaciones
    useEffect(() => {
        if (authenticated) {
            console.log('Configurando listeners para notificaciones...');
            const unsubscribe = window.electron.app.onCheckNotifications(() => {
                fetchData();
            });

            // Programar comprobación periódica de notificaciones
            const interval = setInterval(() => {
                fetchData();
            }, 60000); // Comprobar cada minuto

            return () => {
                unsubscribe();
                clearInterval(interval);
            };
        }
    }, [authenticated]);

    // Configurar listener para respuesta de guardado de token
    useEffect(() => {
        const handleConfigResponse = (success) => {
            console.log('Respuesta recibida de guardar configuración:', success);
            if (success) {
                setAuthenticated(true);
                fetchData();
            }
        };

        const unsubscribe = window.electron.config.onSetResponse(handleConfigResponse);

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Función para obtener tanto notificaciones como repositorios
    const fetchData = async () => {
        try {
            setLoading(true);
            const newNotifications = await window.electron.github.getNotifications();
            setNotifications(newNotifications);

            const repos = await window.electron.github.getRepositories();
            setRepositories(repos);
        } catch (err) {
            console.error('Error al obtener datos:', err);
            setError('No se pudieron cargar los datos. Por favor, verifica tu conexión.');
        } finally {
            // Establecer loading a false sin importar el resultado
            setLoading(false);
        }
    };

    const handleLogin = async (token) => {
        try {
            console.log('Intentando guardar token...');

            // Guardar el token en la configuración
            await window.electron.config.set('githubToken', token);
            console.log('Token enviado para guardar');

            // La respuesta es manejada por el listener onSetResponse
        } catch (err) {
            console.error('Error al guardar el token:', err);
            setError('No se pudo guardar el token. Inténtalo de nuevo.');
        }
    };

    const handleLogout = async () => {
        try {
            await window.electron.config.set('githubToken', '');
            setAuthenticated(false);
            setNotifications([]);
            setRepositories([]);
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await window.electron.github.markAsRead(id);
            // Actualizar el estado local para marcar como leída
            setNotifications(prevNotifications =>
                prevNotifications.map(notification =>
                    notification.id === id
                        ? { ...notification, unread: false }
                        : notification
                )
            );
        } catch (err) {
            console.error('Error al marcar como leída:', err);
        }
    };

    // Mostramos la pantalla de carga solo si no estamos autenticados todavía
    if (loading && !authenticated) {
        return (
            <div className="loading-container">
                <div className="loading-animation">
                    <i className="fas fa-spinner fa-spin"></i>
                </div>
                <p className="loading-text">Conectando con GitHub</p>
            </div>
        );
    }

    return (
        <>
            <Header
                authenticated={authenticated}
                onLogout={handleLogout}
                onRefresh={fetchData}
                loading={loading}
            />
            <main className="main-content">
                {error && (
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={() => setError(null)} className="button">
                            Cerrar
                        </button>
                    </div>
                )}

                {!authenticated ? (
                    <Login onLogin={handleLogin} />
                ) : (
                    <Notifications
                        notifications={notifications}
                        repositories={repositories}
                        loading={loading}
                        onMarkAsRead={handleMarkAsRead}
                    />
                )}
            </main>
        </>
    );
};

// Renderizar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('app');
    const root = createRoot(container);
    root.render(<App />);
});

export default App; 