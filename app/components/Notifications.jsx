import React, { useState, useEffect, useRef } from 'react';
import NotificationItem from './NotificationItem';

const Notifications = ({ notifications, repositories, loading, onMarkAsRead }) => {
           // Estado para filtrar
           const [filterText, setFilterText] = useState('');
           // Cambiamos el valor inicial a false para que inicialmente solo muestre repos con notificaciones
           const [showAllRepos, setShowAllRepos] = useState(false);
           const [allRepositories, setAllRepositories] = useState([]);
           // Añadir estado para mantener el seguimiento de repositorios colapsados
           const [collapsedRepos, setCollapsedRepos] = useState({});
           // Estado para drag and drop
           const [draggedRepo, setDraggedRepo] = useState(null);
           const [orderedRepos, setOrderedRepos] = useState([]);
           // Añadir estado para mostrar notificaciones durante la animación
           const [hiddenRepos, setHiddenRepos] = useState({});
           // Estado para controlar cuántas notificaciones se muestran por repo
           const [visibleNotifications, setVisibleNotifications] = useState({});
           // Estado para rastrear notificaciones marcadas como leídas
           const [markedAsReadIds, setMarkedAsReadIds] = useState(new Set());

           // Refs para mantener valores actualizados en callbacks
           const visibleNotificationsRef = useRef({});

           // Actualizar la ref cuando cambia el estado
           useEffect(() => {
                      visibleNotificationsRef.current = visibleNotifications;
           }, [visibleNotifications]);

           // Número de notificaciones a mostrar inicialmente y en cada carga más
           const INITIAL_NOTIFICATIONS_COUNT = 4;
           const NOTIFICATIONS_INCREMENT = 5;

           // Función para mostrar más notificaciones de un repo (5 más cada vez)
           const showMoreNotifications = (repoId, total) => {
                      const currentVisible = visibleNotificationsRef.current[repoId] || INITIAL_NOTIFICATIONS_COUNT;
                      // Si mostrar 5 más excedería el total, muestra el total
                      const newVisible = Math.min(currentVisible + NOTIFICATIONS_INCREMENT, total);

                      setVisibleNotifications(prev => ({
                                 ...prev,
                                 [repoId]: newVisible
                      }));
           };

           // Función para alternar el estado de colapso de un repositorio
           const toggleRepoCollapse = (repoId) => {
                      const isCurrentlyCollapsed = collapsedRepos[repoId];

                      if (isCurrentlyCollapsed) {
                                 // Si estamos expandiendo, primero cambiar el estado de collapsed
                                 setCollapsedRepos(prev => ({
                                            ...prev,
                                            [repoId]: false
                                 }));
                                 // Asegurarse de que el contenido sea visible durante la animación
                                 setHiddenRepos(prev => ({
                                            ...prev,
                                            [repoId]: false
                                 }));
                      } else {
                                 // Si estamos colapsando, primero actualizar collapsed para iniciar la animación
                                 setCollapsedRepos(prev => ({
                                            ...prev,
                                            [repoId]: true
                                 }));
                                 // Esperar a que termine la animación antes de ocultar el contenido
                                 setTimeout(() => {
                                            setHiddenRepos(prev => ({
                                                       ...prev,
                                                       [repoId]: true
                                            }));
                                 }, 300); // Este valor debe coincidir con la duración de la transición CSS
                      }
           };

           // Funciones para drag & drop
           const handleDragStart = (e, repoId) => {
                      setDraggedRepo(repoId);
                      e.dataTransfer.effectAllowed = 'move';
                      // Añadir estilo al elemento arrastrado
                      e.target.classList.add('dragging');
           };

           const handleDragEnd = (e) => {
                      setDraggedRepo(null);
                      // Quitar estilo al finalizar el arrastre
                      e.target.classList.remove('dragging');
           };

           const handleDragOver = (e, repoId) => {
                      e.preventDefault();
                      if (draggedRepo === repoId) return;

                      // Marcar la zona donde se puede soltar
                      e.currentTarget.classList.add('drag-over');
                      e.dataTransfer.dropEffect = 'move';
           };

           const handleDragLeave = (e) => {
                      // Quitar marca cuando el elemento arrastrado sale de la zona
                      e.currentTarget.classList.remove('drag-over');
           };

           const handleDrop = (e, targetRepoId) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('drag-over');

                      if (draggedRepo === targetRepoId) return;

                      setOrderedRepos(prev => {
                                 const newOrder = [...prev];
                                 const draggedIndex = newOrder.findIndex(id => id === draggedRepo);
                                 const targetIndex = newOrder.findIndex(id => id === targetRepoId);

                                 if (draggedIndex !== -1 && targetIndex !== -1) {
                                            // Reordenar: eliminar el elemento arrastrado y añadirlo en la posición target
                                            newOrder.splice(draggedIndex, 1);
                                            newOrder.splice(targetIndex, 0, draggedRepo);
                                 }

                                 return newOrder;
                      });
           };

           // Función para manejar cuando se marca una notificación como leída
           const handleMarkAsRead = (notificationId) => {
                      // Llamar a la función original
                      onMarkAsRead(notificationId);

                      // Añadir el ID a nuestro conjunto de notificaciones marcadas como leídas
                      setMarkedAsReadIds(prev => {
                                 const newSet = new Set(prev);
                                 newSet.add(notificationId);
                                 return newSet;
                      });
           };

           // Filtrar las notificaciones para quitar las marcadas como leídas
           const getFilteredNotifications = (repo) => {
                      return repo.notifications.filter(n => !markedAsReadIds.has(n.id));
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

                      // Establecer el orden inicial de los repositorios
                      if (orderedRepos.length === 0) {
                                 setOrderedRepos(repoObjects.map(repo => repo.id));
                      }

                      // Inicializar el estado hiddenRepos con los mismos valores que collapsedRepos
                      const initialHiddenState = {};
                      // Inicializar el estado visibleNotifications con el batch inicial para todos los repos
                      const initialVisibleState = {};

                      repoObjects.forEach(repo => {
                                 initialHiddenState[repo.id] = !!collapsedRepos[repo.id];
                                 initialVisibleState[repo.id] = INITIAL_NOTIFICATIONS_COUNT;
                      });

                      setHiddenRepos(initialHiddenState);

                      // Preservar los valores de visibleNotifications para repos que ya existen
                      setVisibleNotifications(prev => {
                                 const newState = { ...initialVisibleState };

                                 // Preservar valores anteriores si existen
                                 Object.keys(prev).forEach(repoId => {
                                            if (repoObjects.some(r => r.id.toString() === repoId.toString())) {
                                                       newState[repoId] = prev[repoId];
                                            }
                                 });

                                 return newState;
                      });
           }, [notifications, repositories]);

           // Efecto adicional para ajustar visibleNotifications cuando cambia el número de notificaciones
           useEffect(() => {
                      // Para cada repositorio, verificar si visibleNotifications debe ser ajustado
                      if (allRepositories.length > 0) {
                                 const updatedVisibleState = { ...visibleNotifications };
                                 let hasChanges = false;

                                 allRepositories.forEach(repo => {
                                            const currentVisible = visibleNotifications[repo.id] || INITIAL_NOTIFICATIONS_COUNT;

                                            // Solo ajustar hacia abajo si el numero visible es mayor que el total disponible
                                            if (currentVisible > repo.notifications.length && repo.notifications.length > 0) {
                                                       updatedVisibleState[repo.id] = Math.max(INITIAL_NOTIFICATIONS_COUNT, repo.notifications.length);
                                                       hasChanges = true;
                                            }
                                 });

                                 if (hasChanges) {
                                            setVisibleNotifications(updatedVisibleState);
                                 }
                      }
                      // Dependencia: notifications para que se ejecute cuando cambia el arreglo de notificaciones
           }, [notifications]);

           if (loading) {
                      return (
                                 <div className="loading-container">
                                            <div className="loading-animation">
                                                       <i className="fas fa-spinner fa-spin"></i>
                                            </div>
                                            <p className="loading-text">Conectando con GitHub</p>
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
                      });

           // Aplicar el orden personalizado a los repositorios filtrados
           const sortedRepos = [...filteredRepos].sort((a, b) => {
                      const aIndex = orderedRepos.indexOf(a.id);
                      const bIndex = orderedRepos.indexOf(b.id);

                      // Si ambos están en el orden personalizado, usar ese orden
                      if (aIndex !== -1 && bIndex !== -1) {
                                 return aIndex - bIndex;
                      }

                      // Si solo uno está en el orden personalizado, darle prioridad
                      if (aIndex !== -1) return -1;
                      if (bIndex !== -1) return 1;

                      // Si ninguno está en el orden personalizado, usar el orden predeterminado
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
                                                       {sortedRepos.map((repo) => {
                                                                  const filteredNotifications = getFilteredNotifications(repo);
                                                                  const visibleCount = visibleNotifications[repo.id] || INITIAL_NOTIFICATIONS_COUNT;

                                                                  return (
                                                                             <div
                                                                                        key={repo.id}
                                                                                        className={`repository-group ${filteredNotifications.length > 0 ? 'has-notifications' : ''}`}
                                                                                        draggable="true"
                                                                                        onDragStart={(e) => handleDragStart(e, repo.id)}
                                                                                        onDragEnd={handleDragEnd}
                                                                                        onDragOver={(e) => handleDragOver(e, repo.id)}
                                                                                        onDragLeave={handleDragLeave}
                                                                                        onDrop={(e) => handleDrop(e, repo.id)}
                                                                             >
                                                                                        <div className="repository-header">
                                                                                                   <div className="repo-title-container">
                                                                                                              <i className="fas fa-bars drag-handle" title="Arrastrar para reordenar"></i>
                                                                                                              {filteredNotifications.length > 0 && (
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
                                                                                                                         {filteredNotifications.length > 0 && (
                                                                                                                                    <span className="notification-badge">{filteredNotifications.length}</span>
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

                                                                                        {filteredNotifications.length > 0 ? (
                                                                                                   <div className={`notifications-list ${collapsedRepos[repo.id] ? 'collapsed' : ''}`}>
                                                                                                              {!hiddenRepos[repo.id] && (
                                                                                                                         <>
                                                                                                                                    {filteredNotifications
                                                                                                                                               .slice(0, visibleCount)
                                                                                                                                               .map(notification => (
                                                                                                                                                          <NotificationItem
                                                                                                                                                                     key={notification.id}
                                                                                                                                                                     notification={notification}
                                                                                                                                                                     onMarkAsRead={handleMarkAsRead}
                                                                                                                                                          />
                                                                                                                                               ))}

                                                                                                                                    {visibleCount < filteredNotifications.length && (
                                                                                                                                               <div className="show-more-container">
                                                                                                                                                          <button
                                                                                                                                                                     className="show-more-button"
                                                                                                                                                                     onClick={() => showMoreNotifications(repo.id, filteredNotifications.length)}
                                                                                                                                                          >
                                                                                                                                                                     Mostrar más
                                                                                                                                                          </button>
                                                                                                                                               </div>
                                                                                                                                    )}
                                                                                                                         </>
                                                                                                              )}
                                                                                                   </div>
                                                                                        ) : (
                                                                                                   <div className="empty-repo-state">
                                                                                                              <p>No hay notificaciones pendientes para este repositorio.</p>
                                                                                                   </div>
                                                                                        )}
                                                                             </div>
                                                                  );
                                                       })}
                                            </div>
                                 )}
                      </div>
           );
};

export default Notifications;