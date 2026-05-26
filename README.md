# 📸 Instagram Scheduler

Plataforma de programación y gestión de publicaciones para Instagram, tipo Hootsuite.

## Stack Tecnológico

- **Backend:** .NET Core 8 (Web API REST)
- **Frontend:** Angular 17+
- **Base de datos:** PostgreSQL + Entity Framework Core
- **Autenticación:** JWT + OAuth 2.0 (Meta/Instagram)
- **IA:** Anthropic Claude API (generación de captions)
- **Publicación:** Instagram Graph API

## Cuentas soportadas

- Slotium (@slotium)
- Hexacommerce / Hexadex (@hexacommerce)

## Funcionalidades

- 📅 Calendario visual de posts programados
- ✍️ Generador de captions con IA (Claude)
- 🖼️ Gestión de imágenes y preview del post
- 📤 Publicación automática vía Instagram Graph API
- 👥 Multi-cuenta Instagram Business
- 📊 Métricas básicas de engagement

## Estructura del Proyecto

```
instagram-scheduler/
├── src/
│   ├── backend/
│   │   └── InstagramScheduler.API/     # .NET Core 8 Web API
│   └── frontend/
│       └── instagram-scheduler-app/    # Angular 17+
├── docker-compose.yml
├── .env.example
└── docs/
```

## Inicio Rápido

### Prerrequisitos
- .NET 8 SDK
- Node.js 20+
- Docker & Docker Compose
- Cuenta Meta for Developers

### Con Docker

```bash
cp .env.example .env
# Editar .env con tus credenciales
docker-compose up -d
```

### Sin Docker

**Backend:**
```bash
cd src/backend/InstagramScheduler.API
dotnet restore
dotnet ef database update
dotnet run
```

**Frontend:**
```bash
cd src/frontend/instagram-scheduler-app
npm install
ng serve
```

## Configuración Meta / Instagram

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una nueva App → tipo "Business"
3. Agrega el producto "Instagram Graph API"
4. Configura los permisos: `instagram_content_publish`, `instagram_basic`, `pages_read_engagement`
5. Copia el `App ID` y `App Secret` al archivo `.env`

## Variables de Entorno

Ver `.env.example` para la lista completa.

## Licencia

MIT — Hexadex Software Lab © 2025
