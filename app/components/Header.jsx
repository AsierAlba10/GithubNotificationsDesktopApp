import React from 'react';

const Header = ({ authenticated, onLogout, onRefresh }) => {
           return (
                      <header className="header">
                                 <h1>
                                            <i className="fab fa-github"></i>
                                            GitHub Notifications
                                 </h1>

                                 {authenticated && (
                                            <div className="header-actions">
                                                       <button
                                                                  className="button"
                                                                  onClick={onRefresh}
                                                                  title="Actualizar notificaciones"
                                                       >
                                                                  <i className="fas fa-sync-alt"></i>
                                                       </button>

                                                       <button
                                                                  className="button"
                                                                  onClick={onLogout}
                                                                  title="Cerrar sesión"
                                                       >
                                                                  <i className="fas fa-sign-out-alt"></i>
                                                       </button>
                                            </div>
                                 )}
                      </header>
           );
};

export default Header; 