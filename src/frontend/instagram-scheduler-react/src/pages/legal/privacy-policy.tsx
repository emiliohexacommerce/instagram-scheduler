export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-muted-foreground text-sm mb-8">Última actualización: 29 de mayo de 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Identificación del Responsable</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Slotium Scheduler</strong> ("la Aplicación", "nosotros") es operada por <strong>Hexadex SpA</strong>,
              con domicilio en Chile. Para consultas sobre privacidad: <a href="mailto:privacy@hexadex.cl" className="text-primary hover:underline">privacy@hexadex.cl</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Datos que Recopilamos</h2>
            <h3 className="font-semibold mt-4 mb-2">2.1 Datos de cuenta</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Nombre y dirección de correo electrónico al registrarse</li>
              <li>Contraseña (almacenada con hash bcrypt, nunca en texto plano)</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">2.2 Datos de Instagram y Facebook</h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Cuando conectas una cuenta de Instagram o Facebook a través del flujo OAuth de Meta, recopilamos y almacenamos:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>ID de usuario de Instagram / Facebook Page ID</strong> — para identificar tu cuenta en nuestra plataforma</li>
              <li><strong>Nombre de usuario y nombre de perfil</strong> — para mostrarlo en la interfaz</li>
              <li><strong>Foto de perfil</strong> — URL pública proporcionada por Meta</li>
              <li><strong>Token de acceso</strong> — cifrado en reposo con AES-256 mediante ASP.NET Core Data Protection; nunca se expone en texto plano ni se comparte con terceros</li>
              <li><strong>Fecha de expiración del token</strong> — para alertarte cuando requiere renovación</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">2.3 Contenido de publicaciones</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Captions, hashtags y fecha de programación de los posts que creas</li>
              <li>Imágenes y videos subidos para publicación, almacenados en Azure Blob Storage</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">2.4 Datos de uso</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Logs de publicaciones y errores para diagnóstico técnico</li>
              <li>Historial de intentos de publicación</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Cómo Usamos los Datos</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">Usamos los datos de Instagram y Facebook <strong>exclusivamente</strong> para:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Publicar contenido en tu cuenta de Instagram o página de Facebook en los horarios que programes</li>
              <li>Mostrar el estado de tus cuentas conectadas y publicaciones dentro de la app</li>
              <li>Alertarte sobre la expiración de tokens de acceso</li>
              <li>Gestionar la autenticación con la API de Meta</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              <strong>No</strong> vendemos, cedemos ni utilizamos tus datos de Instagram/Facebook para publicidad, análisis de terceros ni ningún fin distinto al descrito.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Permisos de Meta que Utilizamos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-semibold">Permiso</th>
                    <th className="text-left p-3 font-semibold">Uso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-muted-foreground">
                  <tr>
                    <td className="p-3 font-mono text-xs">instagram_basic</td>
                    <td className="p-3">Leer información básica de la cuenta de Instagram (username, foto de perfil)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs">instagram_content_publish</td>
                    <td className="p-3">Publicar imágenes, carruseles y reels en la cuenta de Instagram del usuario</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs">pages_show_list</td>
                    <td className="p-3">Ver la lista de páginas de Facebook administradas para vincular la cuenta de Instagram Business</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs">pages_read_engagement</td>
                    <td className="p-3">Leer información básica de la página de Facebook vinculada a la cuenta de Instagram</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono text-xs">pages_manage_posts</td>
                    <td className="p-3">Publicar contenido en páginas de Facebook administradas por el usuario</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Almacenamiento y Seguridad</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Los datos se almacenan en servidores ubicados en la región <strong>East US (Azure)</strong></li>
              <li>Los tokens de acceso se cifran con <strong>AES-256</strong> antes de persistirlos</li>
              <li>Las contraseñas se almacenan como hash <strong>bcrypt</strong></li>
              <li>Las imágenes y videos se almacenan en <strong>Azure Blob Storage</strong></li>
              <li>La comunicación se realiza exclusivamente sobre <strong>HTTPS/TLS</strong></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Retención de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Los datos se retienen mientras tu cuenta esté activa. Al eliminar tu cuenta, todos tus datos
              (incluyendo tokens de Meta, publicaciones e imágenes) se eliminan en un plazo máximo de 30 días.
              Los tokens de Meta se revocan inmediatamente al desconectar una cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Tus Derechos</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">Tienes derecho a:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Acceder</strong> a tus datos personales almacenados</li>
              <li><strong>Rectificar</strong> información incorrecta</li>
              <li><strong>Eliminar</strong> tu cuenta y todos los datos asociados</li>
              <li><strong>Desconectar</strong> en cualquier momento tus cuentas de Instagram o Facebook desde la app</li>
              <li><strong>Revocar el acceso</strong> directamente desde la configuración de tu cuenta de Facebook en <a href="https://www.facebook.com/settings?tab=applications" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">facebook.com/settings</a></li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Para ejercer estos derechos escríbenos a <a href="mailto:privacy@hexadex.cl" className="text-primary hover:underline">privacy@hexadex.cl</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Eliminación de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Puedes solicitar la eliminación de tus datos en cualquier momento enviando un correo a{' '}
              <a href="mailto:privacy@hexadex.cl" className="text-primary hover:underline">privacy@hexadex.cl</a>{' '}
              con el asunto <strong>"Solicitud de eliminación de datos"</strong>. Procesamos las solicitudes en un plazo máximo de 15 días hábiles.
              También puedes revocar el acceso de la aplicación directamente desde{' '}
              <a href="https://www.facebook.com/settings?tab=applications" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Configuración de Facebook → Aplicaciones y sitios web
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Compartir con Terceros</h2>
            <p className="text-muted-foreground leading-relaxed">
              No compartimos tus datos personales con terceros, salvo los proveedores de infraestructura necesarios para operar el servicio:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mt-2">
              <li><strong>Microsoft Azure</strong> — almacenamiento de datos e imágenes</li>
              <li><strong>Meta Platforms Inc.</strong> — API de Instagram y Facebook para publicación de contenido</li>
              <li><strong>Transbank</strong> — procesamiento de pagos (no recibe datos de Meta)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Cambios a esta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Notificaremos por correo electrónico cualquier cambio material a esta política con al menos 15 días de anticipación.
              El uso continuado de la aplicación después de esa fecha implica aceptación de los cambios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Hexadex SpA</strong><br />
              Chile<br />
              Email: <a href="mailto:privacy@hexadex.cl" className="text-primary hover:underline">privacy@hexadex.cl</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
