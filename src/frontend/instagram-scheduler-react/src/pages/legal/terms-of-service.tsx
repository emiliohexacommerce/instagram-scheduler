export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Términos de Servicio</h1>
        <p className="text-muted-foreground text-sm mb-8">Última actualización: 29 de mayo de 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Aceptación de los Términos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Al crear una cuenta o utilizar <strong>Slotium Scheduler</strong> ("el Servicio"), operado por <strong>Hexadex SpA</strong>,
              aceptas quedar vinculado por estos Términos de Servicio y nuestra{' '}
              <a href="/legal/privacy-policy" className="text-primary hover:underline">Política de Privacidad</a>.
              Si no estás de acuerdo, no uses el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Descripción del Servicio</h2>
            <p className="text-muted-foreground leading-relaxed">
              Slotium Scheduler es una plataforma de programación y publicación automática de contenido en redes sociales,
              específicamente <strong>Instagram</strong> y <strong>Facebook</strong>. El Servicio permite:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mt-2">
              <li>Conectar cuentas de Instagram Business y páginas de Facebook mediante OAuth de Meta</li>
              <li>Crear, programar y publicar posts (imágenes, carruseles) de forma automática</li>
              <li>Gestionar múltiples cuentas según el plan contratado</li>
              <li>Generar captions con inteligencia artificial</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Cuenta de Usuario</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Debes tener al menos 18 años para usar el Servicio</li>
              <li>Eres responsable de mantener la confidencialidad de tu contraseña</li>
              <li>Debes proporcionar información veraz al registrarte</li>
              <li>Solo puedes tener una cuenta por persona o empresa</li>
              <li>Notifícanos inmediatamente ante acceso no autorizado a tu cuenta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Conexión con Instagram y Facebook</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              Al conectar tus cuentas de Instagram o Facebook autorizas a Slotium Scheduler a:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Acceder a información básica de tu perfil (nombre de usuario, foto de perfil) mediante la API de Meta</li>
              <li>Publicar contenido en tu nombre en los horarios que programes</li>
              <li>Leer el listado de páginas de Facebook que administras para vincular cuentas Instagram Business</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              El uso de datos de Instagram y Facebook se rige por los{' '}
              <a href="https://developers.facebook.com/terms/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Términos de la Plataforma de Meta
              </a>{' '}
              y las{' '}
              <a href="https://developers.facebook.com/policy/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Políticas para Desarrolladores de Meta
              </a>.
              Al usar el Servicio, también aceptas dichas políticas.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Puedes revocar el acceso en cualquier momento desde{' '}
              <a href="https://www.facebook.com/settings?tab=applications" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Configuración de Facebook → Aplicaciones y sitios web
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Uso Aceptable del Contenido</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">Al publicar contenido a través del Servicio, declaras que:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Tienes los derechos necesarios sobre las imágenes, videos y textos publicados</li>
              <li>El contenido no infringe los{' '}
                <a href="https://help.instagram.com/477434105621119" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Términos de Uso de Instagram</a>{' '}
                ni las{' '}
                <a href="https://www.facebook.com/policies" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Políticas de Facebook</a>
              </li>
              <li>El contenido no es spam, engañoso, violento, discriminatorio ni ilegal</li>
              <li>No usarás el Servicio para publicar contenido que infrinja derechos de propiedad intelectual de terceros</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Nos reservamos el derecho de suspender cuentas que violen estas condiciones o las políticas de Meta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Planes y Pagos</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>El Servicio ofrece un <strong>periodo de prueba gratuito de 30 días</strong> al registrarse, sin tarjeta requerida</li>
              <li>Transcurrido el periodo de prueba, se requiere suscripción de pago para continuar usando el Servicio</li>
              <li>Los pagos se procesan mediante <strong>Webpay Plus</strong> (Transbank), en pesos chilenos (CLP)</li>
              <li>Las suscripciones se cobran mensualmente por anticipado</li>
              <li>Los precios pueden modificarse con previo aviso de 30 días</li>
              <li>No se realizan reembolsos por períodos parcialmente utilizados, salvo requerimiento legal</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Limitaciones del Servicio</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>El Servicio depende de la disponibilidad de la API de Meta; no garantizamos publicación si Meta presenta interrupciones</li>
              <li>Los tokens de acceso de Meta tienen una duración limitada (60 días); es responsabilidad del usuario renovarlos</li>
              <li>Las cuentas de Instagram deben ser tipo <strong>Business o Creator</strong> para poder publicar vía API</li>
              <li>Los límites de publicación están sujetos a las restricciones de la API de Meta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Propiedad Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              La plataforma, su código, diseño y marca son propiedad de Hexadex SpA. El contenido que publicas
              a través del Servicio es de tu propiedad. No reclamamos derechos sobre tu contenido.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground leading-relaxed">
              El Servicio se ofrece "tal como está". No somos responsables por:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mt-2">
              <li>Pérdida de contenido por cambios en la API de Meta</li>
              <li>Suspensión de cuentas de Instagram o Facebook por parte de Meta</li>
              <li>Publicaciones fallidas por expiración de tokens de acceso</li>
              <li>Daños indirectos o lucro cesante derivados del uso del Servicio</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              La responsabilidad máxima de Hexadex SpA se limita al valor pagado por el mes en curso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Cancelación y Terminación</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Puedes cancelar tu suscripción en cualquier momento desde la app</li>
              <li>Al cancelar, mantendrás acceso hasta el fin del período pagado</li>
              <li>Nos reservamos el derecho de suspender o eliminar cuentas que violen estos términos</li>
              <li>Al terminar la relación, eliminaremos tus datos según lo indicado en nuestra Política de Privacidad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Ley Aplicable</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estos Términos se rigen por las leyes de la República de Chile. Cualquier disputa se someterá
              a los tribunales ordinarios de justicia de Santiago de Chile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Hexadex SpA</strong><br />
              Chile<br />
              Email: <a href="mailto:legal@hexadex.cl" className="text-primary hover:underline">legal@hexadex.cl</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
