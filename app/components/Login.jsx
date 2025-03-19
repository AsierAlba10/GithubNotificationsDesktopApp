import React, { useState } from 'react';

const Login = ({ onLogin }) => {
           const [token, setToken] = useState('');
           const [isLoading, setIsLoading] = useState(false);
           const [error, setError] = useState('');

           const handleSubmit = async (e) => {
                      e.preventDefault();

                      if (!token.trim()) {
                                 setError('Por favor, introduce un token de GitHub');
                                 return;
                      }

                      try {
                                 setIsLoading(true);
                                 setError('');
                                 await onLogin(token);
                      } catch (err) {
                                 setError('Error al iniciar sesión. Verifica que el token sea válido.');
                                 console.error('Error en el inicio de sesión:', err);
                                 setIsLoading(false);
                      }
           };

           const openExternalLink = (url) => {
                      if (window.electron) {
                                 window.electron.openExternal(url);
                      } else {
                                 window.open(url, '_blank');
                      }
           };

           return (
                      <div className="login-container">
                                 <div className="login-form">
                                            <h2>Iniciar sesión con GitHub</h2>

                                            <p className="login-info">
                                                       Para utilizar esta aplicación, necesitas un token de acceso personal de GitHub con permisos para leer notificaciones.
                                            </p>

                                            <ol className="instructions">
                                                       <li>Ve a <a href="https://github.com/settings/tokens" onClick={(e) => {
                                                                  e.preventDefault();
                                                                  openExternalLink('https://github.com/settings/tokens');
                                                       }}>GitHub Token Settings</a></li>
                                                       <li>Haz clic en "Generate new token" (Classic) o "Fine-grained tokens"</li>
                                                       <li>Asigna un nombre descriptivo, como "GitHub Notifications App"</li>
                                                       <li>Configura los permisos:
                                                                  <ul>
                                                                             <li><strong>Para token clásico:</strong> Selecciona los permisos "repo" y "notifications"</li>
                                                                             <li><strong>Para token preciso:</strong> Asegúrate de dar acceso de lectura a "Notifications" y a "Contents" para los repositorios deseados</li>
                                                                  </ul>
                                                       </li>
                                                       <li>Establece la fecha de expiración (recomendado: 90 días)</li>
                                                       <li>Genera el token y cópialo aquí (este será el ÚNICO momento en que verás el token completo)</li>
                                            </ol>

                                            {error && <div className="error-message">{error}</div>}

                                            <form onSubmit={handleSubmit}>
                                                       <div className="form-group">
                                                                  <label htmlFor="token">Token de acceso personal de GitHub</label>
                                                                  <input
                                                                             type="password"
                                                                             id="token"
                                                                             value={token}
                                                                             onChange={(e) => setToken(e.target.value)}
                                                                             placeholder="ghp_xxxxxxxxxxxxxxxx o github_pat_xxx..."
                                                                             required
                                                                  />
                                                       </div>

                                                       <button
                                                                  type="submit"
                                                                  className="button"
                                                                  disabled={isLoading}
                                                       >
                                                                  {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                                                       </button>
                                            </form>
                                 </div>
                      </div>
           );
};

export default Login; 