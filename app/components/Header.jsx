import React, { useState, useEffect } from 'react';

const Header = ({ authenticated, onLogout, onRefresh, loading }) => {
           // Añadir estado para controlar la animación de forma independiente
           const [isSpinning, setIsSpinning] = useState(false);

           // Sincronizar estado de animación con props de loading
           useEffect(() => {
                      if (loading) {
                                 setIsSpinning(true);
                      } else {
                                 // Retrasar la detención de la animación para evitar saltos visuales
                                 const timer = setTimeout(() => {
                                            setIsSpinning(false);
                                 }, 300); // Esperar un poco antes de detener la animación

                                 return () => clearTimeout(timer);
                      }
           }, [loading]);

           const handleRefresh = () => {
                      // Iniciar animación inmediatamente al pulsar el botón
                      setIsSpinning(true);
                      onRefresh();
           };

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
                                                                  onClick={handleRefresh}
                                                                  title="Actualizar notificaciones"
                                                       >
                                                                  <i className={`fas fa-sync-alt ${isSpinning ? 'fa-spin' : ''}`}></i>
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