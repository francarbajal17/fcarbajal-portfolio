# Francisco Carbajal — Portfolio

Proyecto Next.js 14 listo para deployar en Vercel.

---

## Estructura

```
src/
  app/
    page.tsx              ← Página principal
    layout.tsx            ← Root layout + fuentes
    globals.css           ← Variables CSS globales
    admin/
      page.tsx            ← Panel admin (protegido)
      login/page.tsx      ← Login del admin
    api/
      admin/route.ts      ← Login/logout (JWT cookie)
      contact/route.ts    ← Formulario de contacto (Resend)
      photos/route.ts     ← CRUD de fotos
  components/
    Portfolio.tsx         ← Sitio principal (client)
    AdminPanel.tsx        ← Panel de administración
    AdminLogin.tsx        ← Pantalla de login
  lib/
    auth.ts               ← JWT helpers
    data.ts               ← Leer/escribir photos.json
  data/
    photos.json           ← Base de datos de fotos
public/
  photos/                 ← Todas las imágenes
```

---

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tu contraseña y claves

# 3. Correr en desarrollo
npm run dev
# → http://localhost:3000
# → Admin: http://localhost:3000/admin
```

---

## Deploy en Vercel

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "init: portfolio Francisco Carbajal"
git remote add origin https://github.com/TU_USUARIO/portfolio.git
git push -u origin main
```

### 2. Conectar en Vercel
1. Ir a [vercel.com](https://vercel.com) → New Project
2. Importar el repo de GitHub
3. Framework: **Next.js** (detectado automático)
4. Agregar las variables de entorno:

| Variable | Valor |
|---|---|
| `ADMIN_PASSWORD` | Tu contraseña (ej: `fran2026`) |
| `JWT_SECRET` | String largo aleatorio (correr `openssl rand -base64 32`) |
| `RESEND_API_KEY` | Tu key de [resend.com](https://resend.com) |
| `CONTACT_EMAIL_TO` | Tu email donde llegan los mensajes |

5. Click en **Deploy** ✓

### 3. Dominio propio
En Vercel → Settings → Domains → agregar tu dominio.
Apuntar el DNS del registrar con los registros que Vercel indica (CNAME o A record).

---

## Acceder al panel admin

- URL: `tu-dominio.com/admin`
- O escribir `admin` con el teclado en cualquier parte del sitio
- O doble click en el copyright del footer
- Contraseña: la que pusiste en `ADMIN_PASSWORD`

Desde el panel podés:
- Cambiar el orden de las fotos de portada
- Editar título, categoría y ubicación de cualquier foto
- Eliminar fotos
- Subir fotos nuevas desde tu computadora
- Actualizar los links de Instagram, LinkedIn y VSCO

---

## Configurar el formulario de contacto

1. Crear cuenta en [resend.com](https://resend.com) (gratis hasta 3000 emails/mes)
2. Ir a API Keys → Create API Key
3. Pegar la key en la variable `RESEND_API_KEY`
4. Poner tu email en `CONTACT_EMAIL_TO`

---

## Notas importantes sobre fotos en Vercel

Vercel tiene **sistema de archivos de solo lectura** en producción. Esto significa:
- Las fotos que subís desde el admin se guardan correctamente durante la sesión
- Pero si el servidor se reinicia (en cada deploy), las fotos nuevas se pierden

**Solución recomendada para producción:** migrar las fotos a [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) o Cloudinary. Esto es el siguiente paso una vez que el sitio esté andando.
