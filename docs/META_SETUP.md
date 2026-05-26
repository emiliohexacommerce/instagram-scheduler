# Configuración Meta for Developers

## Paso 1: Crear App en Meta

1. Ve a https://developers.facebook.com/apps/
2. Clic en **"Crear app"**
3. Tipo: **"Empresa"**
4. Nombre: `Instagram Scheduler` (o el que prefieras)

## Paso 2: Agregar Instagram Graph API

1. En el dashboard de tu app, clic en **"Agregar producto"**
2. Busca **"Instagram Graph API"** y clic en **"Configurar"**

## Paso 3: Permisos necesarios

En "Revisión de la app" → "Permisos y funciones", solicita:
- `instagram_basic`
- `instagram_content_publish`
- `pages_read_engagement`

## Paso 4: Configurar OAuth

1. Ve a **Configuración → Básica**
2. Copia el **App ID** y **App Secret**
3. En **"Iniciar sesión con Facebook" → "Configuración"**, agrega URI de redirección:
   ```
   http://localhost:5000/api/accounts/callback
   ```

## Paso 5: Variables de entorno

En tu archivo `.env`:
```
META_APP_ID=1234567890
META_APP_SECRET=abcdef1234567890abcdef
META_REDIRECT_URI=http://localhost:5000/api/accounts/callback
```

## Requisitos para publicar (producción)

- La cuenta de Instagram debe ser **Business o Creator**
- Debe estar vinculada a una **Página de Facebook**
- Tu app debe pasar la **revisión de Meta** para `instagram_content_publish`

## Modo de desarrollo

En desarrollo, puedes agregar hasta 25 usuarios de prueba en:
**Roles → Usuarios de prueba**
