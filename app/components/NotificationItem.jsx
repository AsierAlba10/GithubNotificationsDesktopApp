import React, { useState, useEffect, useRef } from 'react';

const NotificationItem = ({ notification, onMarkAsRead }) => {
           const { id, subject, repository, updated_at, unread, reason } = notification;
           const [isMarkedAsRead, setIsMarkedAsRead] = useState(false);
           const [isVisible, setIsVisible] = useState(true);
           const notificationRef = useRef(null);

           // Función para formatear la fecha en formato local
           const formatDate = (dateString) => {
                      const date = new Date(dateString);
                      return date.toLocaleString('es-ES', {
                                 day: '2-digit',
                                 month: '2-digit',
                                 year: 'numeric',
                                 hour: '2-digit',
                                 minute: '2-digit'
                      });
           };

           // Determine el icono apropiado basado en el tipo de notificación
           const getIcon = () => {
                      const type = subject.type.toLowerCase();

                      switch (type) {
                                 case 'pullrequest':
                                            return <i className="fas fa-code-branch notification-icon"></i>;
                                 case 'issue':
                                            return <i className="fas fa-exclamation-circle notification-icon"></i>;
                                 case 'release':
                                            return <i className="fas fa-tag notification-icon"></i>;
                                 case 'discussion':
                                            return <i className="fas fa-comments notification-icon"></i>;
                                 case 'commit':
                                            return <i className="fas fa-code-commit notification-icon"></i>;
                                 default:
                                            return <i className="fas fa-bell notification-icon"></i>;
                      }
           };

           // Obtener la razón de la notificación en español
           const getReasonText = () => {
                      switch (reason) {
                                 case 'assign':
                                            return 'Asignado a ti';
                                 case 'author':
                                            return 'Eres el autor';
                                 case 'comment':
                                            return 'Comentado';
                                 case 'mention':
                                            return 'Mencionado';
                                 case 'review_requested':
                                            return 'Revisión solicitada';
                                 case 'state_change':
                                            return 'Estado cambiado';
                                 case 'subscribed':
                                            return 'Suscrito';
                                 case 'team_mention':
                                            return 'Equipo mencionado';
                                 default:
                                            return reason;
                      }
           };

           // Función para abrir el enlace en el navegador
           const openLink = () => {
                      if (!isMarkedAsRead && notification.subject.url) {
                                 // Convertir URL de API a URL de la web
                                 let webUrl = notification.subject.url
                                            .replace('api.github.com/repos', 'github.com')
                                            .replace('/pulls/', '/pull/');

                                 // Usar electron si está disponible, de lo contrario abrir en una nueva pestaña
                                 if (window.electron) {
                                            window.electron.openExternal(webUrl);
                                 } else {
                                            window.open(webUrl, '_blank');
                                 }

                                 // Marcar como leída después de abrir
                                 if (unread) {
                                            markAsRead();
                                 }
                      }
           };

           // Función simple para marcar como leída
           const markAsRead = () => {
                      if (unread) {
                                 // Marcar como leída visualmente 
                                 setIsMarkedAsRead(true);

                                 // Notificar al componente padre
                                 onMarkAsRead(id);

                                 // Ocultar la notificación después de un momento
                                 setTimeout(() => {
                                            setIsVisible(false);
                                 }, 300);
                      }
           };

           // Función para marcar como leída sin abrir
           const markAsReadOnly = (e) => {
                      e.stopPropagation(); // Evitar que el evento se propague al item completo
                      if (unread) {
                                 markAsRead();
                      }
           };

           if (!isVisible) {
                      return null;
           }

           if (isMarkedAsRead) {
                      return (
                                 <div ref={notificationRef} className="notification-item read">
                                            {getIcon()}

                                            <div className="notification-content">
                                                       <div className="notification-title">
                                                                  {subject.title}
                                                       </div>

                                                       <div className="notification-meta">
                                                                  <span className="notification-type">
                                                                             {subject.type}
                                                                  </span>
                                                                  <span className="notification-reason">
                                                                             • {getReasonText()}
                                                                  </span>
                                                       </div>

                                                       <div className="notification-time">
                                                                  {formatDate(updated_at)}
                                                       </div>
                                            </div>

                                            <div className="read-confirmation">
                                                       <i className="fas fa-check-circle"></i> Marcada como leída
                                            </div>
                                 </div>
                      );
           }

           return (
                      <div ref={notificationRef} className={`notification-item ${unread ? 'unread' : 'read'}`} onClick={openLink}>
                                 {getIcon()}

                                 <div className="notification-content">
                                            <div className="notification-title">
                                                       {subject.title}
                                            </div>

                                            <div className="notification-meta">
                                                       <span className="notification-type">
                                                                  {subject.type}
                                                       </span>
                                                       <span className="notification-reason">
                                                                  • {getReasonText()}
                                                       </span>
                                            </div>

                                            <div className="notification-time">
                                                       {formatDate(updated_at)}
                                            </div>
                                 </div>

                                 {unread && (
                                            <button
                                                       className="mark-read-text-button"
                                                       onClick={markAsReadOnly}
                                                       title="Marcar como leída"
                                            >
                                                       Marcar como leída
                                            </button>
                                 )}
                      </div>
           );
};

export default NotificationItem; 