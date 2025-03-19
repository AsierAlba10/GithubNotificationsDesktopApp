import React, { useState, useEffect } from 'react';
import NotificationItem from './NotificationItem';

const Notifications = ({ notifications, repositories, loading, onMarkAsRead }) => {
           // Estado para filtrar
           const [filterText, setFilterText] = useState('');
           // Cambiamos el valor inicial a false para que inicialmente solo muestre repos con notificaciones
           const [showAllRepos, setShowAllRepos] = useState(false);
           const [allRepositories, setAllRepositories] = useState([]);
           // Añadir estado para mantener el seguimiento de repositorios colapsados
           const [collapsedRepos, setCollapsedRepos] = useState({});

           // Función para alternar el estado de colapso de un repositorio
           const toggleRepoCollapse = (repoId) => {
                      setCollapsedRepos(prev => ({
                                 ...prev,
                                 [repoId]: !prev[repoId]
                      }));
           };

           // Unir los repositorios obtenidos con los de las notificaciones
           useEffect(() => {
                      // Crear un objeto con todos los repositorios de notificaciones
                      const notifRepos = notifications.reduce((acc, notification) => {
                                 const repoName = notification.repository.full_name;
                                 if (!acc[repoName]) {
                                            acc[repoName] = {
                                                       name: repoName,
                                                       id: notification.repository.id,
                                                       notifications: []
                                            };
                                 }
                                 acc[repoName].notifications.push(notification);
                                 return acc;
                      }, {});

                      // Crear objetos para los repositorios sin notificaciones
                      const repoObjects = repositories.map(repo => ({
                                 name: repo.full_name,
                                 id: repo.id,
                                 html_url: repo.html_url,
                                 notifications: notifRepos[repo.full_name]?.notifications || []
                      }));

                      // Añadir cualquier repositorio que tenga notificaciones pero no esté en la lista
                      Object.values(notifRepos).forEach(notifRepo => {
                                 if (!repoObjects.some(r => r.id === notifRepo.id)) {
                                            repoObjects.push(notifRepo);
                                 }
                      });

                      setAllRepositories(repoObjects);
           }, [notifications, repositories]);

           if (loading) {
                      return (
                                 <div className="loading-container">
                                            <div className="loading-animation">
                                                       <i className="fas fa-circle-notch fa-spin"></i>
                                            </div>
                                            <p className="loading-text">Cargando notificaciones...</p>
                                            <p className="loading-subtext">Conectando con GitHub...</p>
                                 </div>
                      );
           }

           // Filtrar repositorios por texto y por si tienen notificaciones
           const filteredRepos = allRepositories
                      .filter(repo => {
                                 // Aplicar filtro por texto si existe
                                 if (filterText) {
                                            return repo.name.toLowerCase().includes(filterText.toLowerCase());
                                 }
                                 // Si no hay filtro, mostrar todos o solo los que tienen notificaciones según el estado
                                 return showAllRepos || repo.notifications.length > 0;
                      })
                      .sort((a, b) => {
                                 // Primero los que tienen notificaciones
                                 if (a.notifications.length > 0 && b.notifications.length === 0) return -1;
                                 if (a.notifications.length === 0 && b.notifications.length > 0) return 1;
                                 // Luego ordenar por cantidad de notificaciones (descendente)
                                 if (a.notifications.length !== b.notifications.length) {
                                            return b.notifications.length - a.notifications.length;
                                 }
                                 // Finalmente ordenar por nombre
                                 return a.name.localeCompare(b.name);
                      });

           // Si no hay repositorios con notificaciones, mostrar mensaje adecuado
           const reposWithNotifications = allRepositories.filter(r => r.notifications.length > 0);

           if (reposWithNotifications.length === 0) {
                      return (
                                 <div className="empty-state">
                                            <i className="fas fa-check-circle"></i>
                                            <p>¡Todas las notificaciones están al día!</p>
                                            <p className="empty-state-subtitle">No tienes notificaciones pendientes.</p>
                                 </div>
                      );
           }

           const totalNotifications = notifications.length;

           return (
                      <div className="notifications-container">
                                 <div className="notifications-toolbar">
                                            <div className="search-container">
                                                       <i className="fas fa-search search-icon"></i>
                                                       <input
                                                                  type="text"
                                                                  className="search-input"
                                                                  placeholder="Buscar repositorios..."
                                                                  value={filterText}
                                                                  onChange={(e) => setFilterText(e.target.value)}
                                                       />
                                                       {filterText && (
                                                                  <button
                                                                             className="clear-search"
                                                                             onClick={() => setFilterText('')}
                                                                             title="Limpiar búsqueda"
                                                                  >
                                                                             <i className="fas fa-times"></i>
                                                                  </button>
                                                       )}
                                            </div>

                                            <div className="filter-controls">
                                                       <span className="notification-count">
                                                                  {totalNotifications} notificación{totalNotifications !== 1 ? 'es' : ''}
                                                       </span>
                                                       <button
                                                                  className={`filter-button ${!showAllRepos ? 'active' : ''}`}
                                                                  onClick={() => setShowAllRepos(false)}
                                                                  title="Mostrar solo repositorios con notificaciones"
                                                       >
                                                                  <i className="fas fa-bell"></i> Con notificaciones ({reposWithNotifications.length})
                                                       </button>
                                                       <button
                                                                  className={`filter-button ${showAllRepos ? 'active' : ''}`}
                                                                  onClick={() => setShowAllRepos(true)}
                                                                  title="Mostrar todos los repositorios"
                                                       >
                                                                  <i className="fas fa-list"></i> Todos ({allRepositories.length})
                                                       </button>
                                            </div>
                                 </div>

                                 {filteredRepos.length === 0 ? (
                                            <div className="empty-search-state">
                                                       <i className="fas fa-search"></i>
                                                       <p>No se encontraron repositorios que coincidan con tu búsqueda.</p>
                                                       <button className="button" onClick={() => setFilterText('')}>
                                                                  Limpiar filtro
                                                       </button>
                                            </div>
                                 ) : (
                                            <div className="repositories-list">
                                                       {filteredRepos.map((repo) => (
                                                                  <div key={repo.id} className={`repository-group ${repo.notifications.length > 0 ? 'has-notifications' : ''}`}>
                                                                             <div className="repository-header">
                                                                                        <div className="repo-title-container">
                                                                                                   {repo.notifications.length > 0 && (
                                                                                                              <button
                                                                                                                         className="collapse-button"
                                                                                                                         onClick={() => toggleRepoCollapse(repo.id)}
                                                                                                                         title={collapsedRepos[repo.id] ? "Expandir notificaciones" : "Colapsar notificaciones"}
                                                                                                              >
                                                                                                                         <i className={`fas fa-chevron-${collapsedRepos[repo.id] ? 'down' : 'up'}`}></i>
                                                                                                              </button>
                                                                                                   )}
                                                                                                   <h2 className="repository-name">
                                                                                                              <i className="fas fa-book"></i> {repo.name}
                                                                                                              {repo.notifications.length > 0 && (
                                                                                                                         <span className="notification-badge">{repo.notifications.length}</span>
                                                                                                              )}
                                                                                                   </h2>
                                                                                        </div>
                                                                                        <div className="repo-actions">
                                                                                                   <a
                                                                                                              href="#"
                                                                                                              className="repo-link"
                                                                                                              onClick={(e) => {
                                                                                                                         e.preventDefault();
                                                                                                                         window.electron.openExternal(`https://github.com/${repo.name}`);
                                                                                                              }}
                                                                                                              title="Abrir en GitHub"
                                                                                                   >
                                                                                                              <i className="fas fa-external-link-alt"></i>
                                                                                                   </a>
                                                                                        </div>
                                                                             </div>

                                                                             {repo.notifications.length > 0 ? (
                                                                                        <div className={`notifications-list ${collapsedRepos[repo.id] ? 'collapsed' : ''}`}>
                                                                                                   {!collapsedRepos[repo.id] && repo.notifications.map(notification => (
                                                                                                              <NotificationItem
                                                                                                                         key={notification.id}
                                                                                                                         notification={notification}
                                                                                                                         onMarkAsRead={onMarkAsRead}
                                                                                                              />
                                                                                                   ))}
                                                                                        </div>
                                                                             ) : (
                                                                                        <div className="empty-repo-state">
                                                                                                   <p>No hay notificaciones pendientes para este repositorio.</p>
                                                                                        </div>
                                                                             )}
                                                                  </div>
                                                       ))}
                                            </div>
                                 )}
                      </div>
           );
};

export default Notifications;