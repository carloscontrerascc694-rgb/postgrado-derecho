# ⚖️ Sistema de Preinscripción — Postgrado en Derecho USM

Sistema web completo para la gestión y registro de preinscripciones del Postgrado en Derecho de la **Universidad Santa María (USM)**.

---

## 🚀 Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- Cuenta gratuita en [Supabase](https://supabase.com) (para la base de datos PostgreSQL en la nube)
- Conexión a Internet (para Supabase y envío de correos SMTP de Gmail)

---

## 🛠️ Instalación y Puesta en Marcha

1. **Clonar o descargar el proyecto:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd "usm postgrado"
   ```

2. **Instalar dependencias de Node.js:**
   ```bash
   npm install
   ```

3. **Configurar la Base de Datos en Supabase:**
   - Inicia sesión en [Supabase](https://supabase.com) y crea un nuevo proyecto.
   - En el menú lateral, ve a **SQL Editor**.
   - Abre el archivo `supabase_schema.sql` de este repositorio, cópialo, pégalo en el editor y presiona **Run**.
   - En **Project Settings -> API**, copia la **URL del proyecto** y la clave **anon (public)** o **service_role (secret)**.

4. **Configurar variables de entorno:**
   Copia el archivo `.env.example` y nómbralo `.env`:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` con tus credenciales de Supabase y Gmail (requiere [Contraseña de Aplicación de Google](https://myaccount.google.com/apppasswords)):
   ```env
   PORT=3000
   BASE_URL=http://localhost:3000

   # Supabase
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_KEY=tu-clave-supabase

   # Administrador
   ADMIN_USER=admin
   ADMIN_PASS=usm2026

   # Gmail
   ADMIN_EMAIL=tu_correo@gmail.com
   SMTP_USER=tu_correo@gmail.com
   SMTP_PASS=tu_clave_de_aplicacion
   ```

5. **Iniciar el sistema:**
   - **En Windows (un clic):** Haz doble clic en `iniciar_sistema.bat`.
   - **Por consola:**
     ```bash
     npm start
     ```
   - **Modo Público (acceso por Internet sin abrir puertos):**
     Haz doble clic en `iniciar_publico.bat` o ejecuta:
     ```bash
     node tunnel.js
     ```

6. **Abrir en el navegador:**
   - **Página de Preinscripción:** [http://localhost:3000](http://localhost:3000)
   - **Panel Administrativo:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
   - **Consulta de Estatus:** [http://localhost:3000/consulta.html](http://localhost:3000/consulta.html)

---

## ✨ Características Principales

- 🎓 **10 Programas Académicos con Pensum Oficial:**
  - Especializaciones: Penal, Mercantil, Laboral, Procesal, Tributario, Administrativo.
  - Maestrías: Penal, Mercantil, Constitucional.
  - Doctorado en Derecho.
  - Modal interactivo con detalle de materias por semestre, códigos, U.C. y horas académicas.
- 📅 **Validación estricta de fecha de nacimiento** (edad entre 20 y 95 años).
- 📧 **Envío directo de recaudos por Gmail:** El aspirante recibe el código oficial, lista de requisitos autenticados y enlaces a [usm.edu.ve](https://usm.edu.ve).
- ☁️ **Base de datos en la nube permanente (Supabase PostgreSQL):** Los datos persisten 24/7 incluso al desplegar en Render, sin pérdidas de información.
- 📱 **100% Responsivo:** Adaptado para teléfonos inteligentes, tablets y computadoras.
- 🔒 **Panel de Control Administrativo Seguro:**
  - Autenticación con sesión y protección anti-fuerza bruta.
  - Aprobación rápida (Aceptar / Rechazar con 1 clic).
  - Búsqueda y filtrado en tiempo real.
  - Botón de reenvío de correo con 1 clic.
  - Prueba rápida de correo SMTP.

---

## 📁 Estructura del Código

```
├── server.js              # Servidor Express principal y API REST con autenticación
├── database.js            # Módulo de base de datos en la nube (Supabase)
├── supabase_schema.sql    # Esquema SQL oficial listo para ejecutar en Supabase
├── email.js               # Generador HTML y transporte SMTP
├── tunnel.js              # Túnel público con Enlace Oficial USM
├── render.yaml            # Configuración para despliegue automático en Render
├── iniciar_sistema.bat    # Lanzador en modo red local (Wi-Fi)
├── iniciar_publico.bat    # Lanzador con acceso mundial por Internet (Enlace Oficial USM)
├── .env.example           # Plantilla de configuración
├── private/
│   └── admin.html         # Panel administrativo protegido (con usuario y contraseña)
├── public/
│   ├── index.html         # Formulario con modal de pensum y confirmación
│   ├── login.html         # Inicio de sesión oficial para el administrador
│   ├── consulta.html      # Búsqueda de estatus por código USM-DER-*
│   ├── css/styles.css     # Estilos e identidad visual USM
│   └── js/
│       ├── app.js         # Lógica del formulario y pensum
│       └── admin.js       # Lógica y aprobación de solicitudes del panel admin
```
