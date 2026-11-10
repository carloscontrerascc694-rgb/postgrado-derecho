// ============================================================
// server.js - Servidor principal
// Sistema de Preinscripción - Postgrado en Derecho USM
// ============================================================

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const os = require('os');

const {
    inicializarDB,
    obtenerProgramas,
    obtenerProgramaPorId,
    crearPreinscripcion,
    obtenerPreinscripcionPorCodigo,
    obtenerTodasPreinscripciones,
    actualizarEstado,
    marcarCorreoEnviado,
    obtenerEstadisticas,
    existePreinscripcion
} = require('./database');

const {
    enviarCorreoConfirmacion,
    enviarNotificacionAdmin,
    generarHtmlCorreo,
    verificarCredencialesGmail
} = require('./email');

const app = express();
const PORT = process.env.PORT || 3000;

// Confiar en el proxy reverso (Render, Cloudflare, HTTPS)
app.set('trust proxy', 1);

/**
 * Obtiene la dirección IPv4 local en la red Wi-Fi / Ethernet
 */
function getNetworkIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

/**
 * Resuelve la URL base dinámica para enlaces y correos
 */
function resolveBaseUrl(req) {
    if (req) {
        const host = req.get('host');
        if (host) return `${req.protocol}://${host}`;
    }
    const ip = getNetworkIp();
    return `http://${ip}:${PORT}`;
}

// ============================================================
// Middlewares
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de Sesiones Seguras para el Administrador
app.use(session({
    secret: process.env.SESSION_SECRET || 'usm_postgrado_derecho_clave_secreta_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 12 * 60 * 60 * 1000, // 12 horas
        sameSite: 'lax'
    }
}));

// Middleware de autenticación obligatoria para rutas administrativas
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Inicie sesión como administrador.'
    });
}

// Servir panel administrativo PRIVADO solo si el usuario ha iniciado sesión
app.get(['/admin', '/admin.html'], (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.sendFile(path.join(__dirname, 'private', 'admin.html'));
    }
    return res.redirect('/login.html');
});

// Archivos públicos (Preinscripción, Consulta, Login, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Control de intentos de inicio de sesión (Protección contra Fuerza Bruta)
const loginAttempts = new Map();

function checkLoginRateLimit(ip) {
    const record = loginAttempts.get(ip);
    if (!record) return { allowed: true };

    const now = Date.now();
    if (record.lockedUntil && record.lockedUntil > now) {
        const remainingMinutes = Math.ceil((record.lockedUntil - now) / 60000);
        return {
            allowed: false,
            message: `Demasiados intentos fallidos. Acceso bloqueado temporalmente por ${remainingMinutes} minuto(s).`
        };
    }

    // Si el tiempo de bloqueo ya expiró, reiniciar
    if (record.lockedUntil && record.lockedUntil <= now) {
        loginAttempts.delete(ip);
        return { allowed: true };
    }

    return { allowed: true };
}

function registerFailedLogin(ip) {
    const now = Date.now();
    const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now };

    // Si pasaron más de 15 minutos desde el primer intento, resetear contador
    if (now - record.firstAttempt > 15 * 60 * 1000) {
        record.count = 1;
        record.firstAttempt = now;
        record.lockedUntil = null;
    } else {
        record.count++;
    }

    // Bloquear después de 5 intentos fallidos por 15 minutos
    if (record.count >= 5) {
        record.lockedUntil = now + 15 * 60 * 1000;
    }

    loginAttempts.set(ip, record);
}

function clearLoginAttempts(ip) {
    loginAttempts.delete(ip);
}

// ============================================================
// Rutas de Autenticación de Administrador
// ============================================================

// --- Iniciar Sesión de Administrador con Protección ---
app.post('/api/admin/login', (req, res) => {
    try {
        const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
        const rateCheck = checkLoginRateLimit(clientIp);
        if (!rateCheck.allowed) {
            return res.status(429).json({
                success: false,
                message: rateCheck.message
            });
        }

        const { usuario, clave } = req.body || {};
        const adminUser = (process.env.ADMIN_USER || 'admin').trim();
        const adminPass = (process.env.ADMIN_PASS || 'usm2026').trim();

        if (!usuario || !clave) {
            return res.status(400).json({
                success: false,
                message: 'Debe ingresar su usuario y contraseña.'
            });
        }

        if (usuario.trim() === adminUser && clave.trim() === adminPass) {
            clearLoginAttempts(clientIp);

            // Regenerar sesión para prevenir fijación de sesión (Session Fixation)
            req.session.regenerate((err) => {
                if (err) {
                    console.error('Error al regenerar sesión:', err);
                }
                req.session.isAdmin = true;
                req.session.adminUser = usuario.trim();
                return res.json({
                    success: true,
                    message: 'Inicio de sesión exitoso.',
                    usuario: usuario.trim()
                });
            });
            return;
        }

        registerFailedLogin(clientIp);
        const currentRecord = loginAttempts.get(clientIp);
        const intentosRestantes = Math.max(0, 5 - (currentRecord ? currentRecord.count : 1));

        return res.status(401).json({
            success: false,
            message: intentosRestantes > 0
                ? `Usuario o contraseña incorrectos. Intentos restantes antes del bloqueo: ${intentosRestantes}.`
                : 'Demasiados intentos fallidos. Acceso bloqueado temporalmente por 15 minutos.'
        });
    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(500).json({ success: false, message: 'Error interno en el servidor.' });
    }
});

// --- Cerrar Sesión ---
app.post('/api/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Sesión finalizada exitosamente.' });
    });
});

// --- Verificar si la sesión está activa ---
app.get('/api/admin/verificar-sesion', (req, res) => {
    if (req.session && req.session.isAdmin) {
        return res.json({
            autenticado: true,
            usuario: req.session.adminUser || 'admin'
        });
    }
    return res.json({ autenticado: false });
});

// ============================================================
// Rutas Públicas de la Web (Aspirantes)
// ============================================================

// --- Endpoint de salud para Uptime 24/7 (Render / UptimeRobot) ---
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// --- Obtener programas disponibles ---
app.get('/api/programas', async (req, res) => {
    try {
        const programas = await obtenerProgramas();
        res.json({ success: true, data: programas });
    } catch (error) {
        console.error('Error obteniendo programas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener programas' });
    }
});

// --- Crear preinscripción ---
app.post('/api/preinscripcion', async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Cuerpo de la petición inválido.'
            });
        }

        const {
            cedula, nombres, apellidos, fecha_nacimiento, genero,
            email, telefono, direccion, ciudad, estado,
            universidad_egreso, titulo_obtenido, anio_egreso,
            programa_id, motivacion
        } = req.body;

        // Validaciones básicas de campos obligatorios
        if (!cedula || !nombres || !apellidos || !email || !telefono || !programa_id || !fecha_nacimiento) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos obligatorios: cédula, nombres, apellidos, fecha de nacimiento, email, teléfono y programa.'
            });
        }

        // Límites de longitud para prevenir ataques de desbordamiento / DoS
        if (
            String(cedula).length > 25 ||
            String(nombres).length > 100 ||
            String(apellidos).length > 100 ||
            String(email).length > 150 ||
            String(telefono).length > 30 ||
            (direccion && String(direccion).length > 250) ||
            (ciudad && String(ciudad).length > 100) ||
            (estado && String(estado).length > 100) ||
            (universidad_egreso && String(universidad_egreso).length > 150) ||
            (titulo_obtenido && String(titulo_obtenido).length > 150) ||
            (motivacion && String(motivacion).length > 2500)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Uno o más campos exceden el límite de caracteres permitido.'
            });
        }

        // Validar fecha de nacimiento y calcular edad sin desfase de zona horaria (UTC vs Local)
        const parts = String(fecha_nacimiento).trim().split('-');
        if (parts.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de nacimiento debe tener el formato AAAA-MM-DD.'
            });
        }

        const bYear = parseInt(parts[0], 10);
        const bMonth = parseInt(parts[1], 10);
        const bDay = parseInt(parts[2], 10);

        if (isNaN(bYear) || isNaN(bMonth) || isNaN(bDay) || bMonth < 1 || bMonth > 12 || bDay < 1 || bDay > 31) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de nacimiento no es una fecha válida en el calendario.'
            });
        }

        const today = new Date();
        let age = today.getFullYear() - bYear;
        const currMonth = today.getMonth() + 1;
        const currDay = today.getDate();
        if (currMonth < bMonth || (currMonth === bMonth && currDay < bDay)) {
            age--;
        }

        if (age < 20 || age > 95) {
            return res.status(400).json({
                success: false,
                message: `Debe tener al menos 20 años y no más de 95 años para ingresar a estudios de postgrado (edad calculada: ${age} años).`
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(email).trim())) {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo electrónico no es válido.'
            });
        }

        // Validar ID numérico del programa
        const progId = parseInt(programa_id, 10);
        if (isNaN(progId)) {
            return res.status(400).json({
                success: false,
                message: 'El programa seleccionado no es válido.'
            });
        }

        // Verificar que el programa existe
        const programa = await obtenerProgramaPorId(progId);
        if (!programa) {
            return res.status(400).json({
                success: false,
                message: 'El programa seleccionado no existe.'
            });
        }

        // Verificar si ya existe una preinscripción
        if (await existePreinscripcion(cedula.trim(), progId)) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una preinscripción activa con esta cédula para el programa seleccionado.'
            });
        }

        // Generar código de solicitud único
        const codigoSolicitud = 'USM-DER-' + Date.now().toString(36).toUpperCase() + '-' + uuidv4().substring(0, 6).toUpperCase();

        // Crear preinscripción en la base de datos
        const datos = {
            codigo_solicitud: codigoSolicitud,
            cedula: cedula.trim(),
            nombres: nombres.trim(),
            apellidos: apellidos.trim(),
            fecha_nacimiento: fecha_nacimiento || null,
            genero: genero || null,
            email: email.trim().toLowerCase(),
            telefono: telefono.trim(),
            direccion: direccion ? direccion.trim() : null,
            ciudad: ciudad ? ciudad.trim() : null,
            estado: estado ? estado.trim() : null,
            universidad_egreso: universidad_egreso ? universidad_egreso.trim() : null,
            titulo_obtenido: titulo_obtenido ? titulo_obtenido.trim() : null,
            anio_egreso: anio_egreso && !isNaN(parseInt(anio_egreso, 10)) ? parseInt(anio_egreso, 10) : null,
            programa_id: progId,
            motivacion: motivacion ? motivacion.trim() : null
        };

        await crearPreinscripcion(datos);

        // Obtener datos completos para el correo
        const preinscripcionCompleta = await obtenerPreinscripcionPorCodigo(codigoSolicitud);

        // URL base dinámica (funciona en localhost, teléfonos y red local)
        const baseUrl = resolveBaseUrl(req);

        // Enviar correos con enlaces adaptados a la red del aspirante
        const resultadoCorreo = await enviarCorreoConfirmacion(preinscripcionCompleta, baseUrl);

        if (resultadoCorreo.success) {
            await marcarCorreoEnviado(codigoSolicitud);
        }

        // Enviar notificación al admin (en paralelo, no bloquear)
        enviarNotificacionAdmin(preinscripcionCompleta).catch(err => {
            console.error('Error notificando al admin:', err);
        });

        res.status(201).json({
            success: true,
            message: 'Preinscripción registrada exitosamente. Se ha generado la información y los requisitos del postgrado.',
            data: {
                codigo_solicitud: codigoSolicitud,
                programa: programa.nombre,
                correo_enviado: resultadoCorreo.success,
                link_consulta: `${baseUrl}/consulta.html?codigo=${codigoSolicitud}`,
                link_correo: `${baseUrl}/api/preinscripcion/${codigoSolicitud}/correo`,
                preview_correo_url: resultadoCorreo.previewUrl || null
            }
        });

    } catch (error) {
        console.error('Error creando preinscripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al procesar la preinscripción.'
        });
    }
});

// --- Consultar preinscripción por código (Público para el aspirante) ---
app.get('/api/preinscripcion/:codigo', async (req, res) => {
    try {
        const preinscripcion = await obtenerPreinscripcionPorCodigo(req.params.codigo);

        if (!preinscripcion) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró ninguna preinscripción con ese código.'
            });
        }

        res.json({ success: true, data: preinscripcion });
    } catch (error) {
        console.error('Error consultando preinscripción:', error);
        res.status(500).json({ success: false, message: 'Error al consultar la preinscripción.' });
    }
});

// --- Ver correo oficial con requisitos (Público para el aspirante) ---
app.get('/api/preinscripcion/:codigo/correo', async (req, res) => {
    try {
        const preinscripcion = await obtenerPreinscripcionPorCodigo(req.params.codigo);
        if (!preinscripcion) {
            return res.status(404).send('<h2 style="font-family:sans-serif; text-align:center; margin-top:50px;">Solicitud de preinscripción no encontrada.</h2>');
        }
        const baseUrl = resolveBaseUrl(req);
        const html = generarHtmlCorreo(preinscripcion, baseUrl);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        console.error('Error generando vista de correo:', error);
        res.status(500).send('<h2>Error al generar la vista del correo.</h2>');
    }
});

// ============================================================
// Rutas Protegidas del Panel de Administración (Privadas)
// ============================================================

// --- Panel Admin: Obtener todas las preinscripciones ---
app.get('/api/admin/preinscripciones', requireAdmin, async (req, res) => {
    try {
        const filtros = {
            estado: req.query.estado || null,
            programa_id: req.query.programa_id ? parseInt(req.query.programa_id) : null,
            busqueda: req.query.busqueda || null
        };

        const preinscripciones = await obtenerTodasPreinscripciones(filtros);
        res.json({ success: true, data: preinscripciones });
    } catch (error) {
        console.error('Error obteniendo preinscripciones:', error);
        res.status(500).json({ success: false, message: 'Error al obtener las preinscripciones.' });
    }
});

// --- Panel Admin: Actualizar estado (Aceptar / Rechazar / Revisar solicitud) ---
app.put('/api/admin/preinscripcion/:codigo/estado', requireAdmin, async (req, res) => {
    try {
        const { estado } = req.body;
        const estadosValidos = ['pendiente', 'revisada', 'aceptada', 'rechazada'];

        if (!estado || !estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Estado no válido. Debe ser uno de: ${estadosValidos.join(', ')}`
            });
        }

        const result = await actualizarEstado(req.params.codigo, estado);

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró la preinscripción.'
            });
        }

        res.json({
            success: true,
            message: `Solicitud actualizada a "${estado}" exitosamente.`
        });
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar el estado.' });
    }
});

// --- Panel Admin: Estadísticas ---
app.get('/api/admin/estadisticas', requireAdmin, async (req, res) => {
    try {
        const stats = await obtenerEstadisticas();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ success: false, message: 'Error al obtener estadísticas.' });
    }
});

// --- Panel Admin: Consultar estado de conexión de correo ---
app.get('/api/admin/estado-correo', requireAdmin, (req, res) => {
    const user = process.env.SMTP_USER || 'carloscontrerascc694@gmail.com';
    const pass = process.env.SMTP_PASS || '';
    const activo = Boolean(pass && pass.trim().length >= 10);
    res.json({
        success: true,
        data: {
            email: user,
            conectado: activo
        }
    });
});

// --- Panel Admin: Activar envío directo a Gmail con clave de aplicación ---
app.post('/api/admin/activar-gmail', requireAdmin, async (req, res) => {
    try {
        let { email, pass } = req.body;
        if (!email || !pass) {
            return res.status(400).json({
                success: false,
                message: 'Debe ingresar su correo de Gmail y la clave de aplicación de 16 letras.'
            });
        }

        email = email.trim().toLowerCase();
        const cleanPass = pass.replace(/\s+/g, '');

        if (/[\r\n]/.test(email) || /[\r\n]/.test(cleanPass)) {
            return res.status(400).json({
                success: false,
                message: 'Caracteres no permitidos en el correo o contraseña.'
            });
        }

        if (cleanPass.length < 12) {
            return res.status(400).json({
                success: false,
                message: 'La clave de aplicación de Google debe tener 16 letras.'
            });
        }

        // Probar conexión real con Gmail
        try {
            await verificarCredencialesGmail(email, cleanPass);
        } catch (authError) {
            return res.status(400).json({
                success: false,
                message: `Google no aceptó la clave: ${authError.message}. Verifique que haya sido generada en https://myaccount.google.com/apppasswords para este correo.`
            });
        }

        // Guardar en variables de entorno en memoria
        process.env.SMTP_USER = email;
        process.env.SMTP_PASS = cleanPass;
        process.env.ADMIN_EMAIL = email;
        process.env.SMTP_HOST = 'smtp.gmail.com';

        // Guardar en archivo .env preservando Supabase
        const envContent = `# Puerto del servidor web
PORT=${process.env.PORT || 3000}

# URL base del sistema
BASE_URL=${process.env.BASE_URL || 'http://localhost:3000'}

# Credenciales de Administrador para el Panel Privado
ADMIN_USER=${process.env.ADMIN_USER || 'admin'}
ADMIN_PASS=${process.env.ADMIN_PASS || 'usm2026'}
SESSION_SECRET=${process.env.SESSION_SECRET || 'usm_postgrado_derecho_clave_secreta_2026'}

# Base de datos en la nube Supabase
SUPABASE_URL=${process.env.SUPABASE_URL || ''}
SUPABASE_KEY=${process.env.SUPABASE_KEY || ''}

# Correo remitente y coordinador oficial
ADMIN_EMAIL=${email}
SMTP_USER=${email}
SMTP_PASS=${cleanPass}
`;
        fs.writeFileSync(path.join(__dirname, '.env'), envContent);

        // Enviar un correo de prueba de confirmación
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: email, pass: cleanPass }
            });
            await transporter.sendMail({
                from: `"Universidad Santa María - Postgrado" <${email}>`,
                to: email,
                subject: '✅ ¡Conexión Exitosa con Gmail! - Sistema Postgrado Derecho USM',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 25px; border-top: 5px solid #1a237e; background: #ffffff;">
                        <h2 style="color: #1a237e; margin-top: 0;">Universidad Santa María</h2>
                        <h3 style="color: #2e7d32;">✅ ¡Envío de correos activado exitosamente!</h3>
                        <p>Tu cuenta de Gmail <strong>${email}</strong> ha quedado vinculada al sistema de postgrado en Derecho.</p>
                        <p>A partir de ahora, cada vez que un aspirante complete el formulario, <strong>recibirá los requisitos oficiales y el enlace de la USM directo en su buzón de Gmail</strong>.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <small style="color: #777;">Sistema de Gestión de Postgrado - Facultad de Derecho USM</small>
                    </div>
                `
            });
        } catch (testErr) {
            console.warn('Aviso prueba correo:', testErr.message);
        }

        res.json({
            success: true,
            message: `¡Gmail conectado con éxito! Se ha enviado un correo de confirmación a ${email}. Ahora los aspirantes recibirán su correo directamente.`
        });
    } catch (error) {
        console.error('Error activando Gmail:', error);
        res.status(500).json({
            success: false,
            message: 'Error al activar Gmail: ' + error.message
        });
    }
});

// --- Reenviar correo con requisitos a la bandeja del aspirante ---
app.post('/api/admin/preinscripcion/:codigo/reenviar-correo', requireAdmin, async (req, res) => {
    try {
        const preinscripcion = await obtenerPreinscripcionPorCodigo(req.params.codigo);
        if (!preinscripcion) {
            return res.status(404).json({ success: false, message: 'Preinscripción no encontrada.' });
        }

        const baseUrl = resolveBaseUrl(req);
        const resultado = await enviarCorreoConfirmacion(preinscripcion, baseUrl);
        if (resultado.success) {
            await marcarCorreoEnviado(req.params.codigo);
            return res.json({
                success: true,
                message: `✅ Correo enviado exitosamente a ${preinscripcion.email} ${resultado.realDelivery ? '(directo en su bandeja de Gmail)' : ''}`,
                data: resultado
            });
        } else {
            return res.status(500).json({
                success: false,
                message: `No se pudo entregar el correo: ${resultado.error || 'Error desconocido'}`
            });
        }
    } catch (error) {
        console.error('Error reenviando correo:', error);
        res.status(500).json({ success: false, message: 'Error interno al reenviar correo.' });
    }
});

// --- Enviar correo de prueba a cualquier dirección ---
app.post('/api/admin/probar-correo', requireAdmin, async (req, res) => {
    try {
        const { destino } = req.body;
        if (!destino || !destino.includes('@')) {
            return res.status(400).json({ success: false, message: 'Indique un correo electrónico válido.' });
        }

        const preinscripcionEjemplo = {
            codigo_solicitud: 'USM-PRUEBA-' + Math.floor(1000 + Math.random() * 9000),
            nombres: 'Aspirante de',
            apellidos: 'Prueba',
            cedula: 'V-00.000.000',
            email: destino.trim().toLowerCase(),
            telefono: '0412-0000000',
            universidad_egreso: 'Universidad Santa María',
            titulo_obtenido: 'Abogado',
            programa_nombre: 'Especialización en Derecho Penal',
            programa_tipo: 'Especialización',
            programa_duracion: '2 semestres',
            programa_modalidad: 'Presencial'
        };

        const baseUrl = resolveBaseUrl(req);
        const resultado = await enviarCorreoConfirmacion(preinscripcionEjemplo, baseUrl);
        if (resultado.success) {
            return res.json({
                success: true,
                message: `✅ Correo de prueba con requisitos enviado con éxito a ${destino}. ${resultado.realDelivery ? 'Llegó directo a la bandeja de Gmail.' : ''}`,
                data: resultado
            });
        } else {
            return res.status(500).json({
                success: false,
                message: `Error enviando prueba: ${resultado.error || 'Fallo de entrega'}`
            });
        }
    } catch (error) {
        console.error('Error en prueba de correo:', error);
        res.status(500).json({ success: false, message: 'Error enviando prueba: ' + error.message });
    }
});

// --- Información de red local y pública para conectar teléfonos y otras computadoras ---
app.get('/api/info-red', (req, res) => {
    try {
        const ip = getNetworkIp();
        const port = PORT;
        const urlLocal = `http://localhost:${port}`;
        const urlRed = `http://${ip}:${port}`;
        const urlAdmin = `http://${ip}:${port}/admin.html`;
        const urlFacil = req.app.locals.urlFacil || null;
        const publicIp = req.app.locals.publicIp || null;
        const qrBase = urlFacil || urlRed;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(qrBase)}`;

        res.json({
            success: true,
            data: {
                ip,
                puerto: port,
                urlLocal,
                urlRed,
                urlAdmin,
                qrUrl,
                urlFacil,
                publicIp
            }
        });
    } catch (error) {
        console.error('Error al obtener info de red:', error);
        res.status(500).json({ success: false, message: 'Error al obtener información de red.' });
    }
});

// --- Ruta catch-all para SPA pública ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// Iniciar servidor
// ============================================================
async function iniciar() {
    await inicializarDB();

    const localIp = getNetworkIp();

    // Escuchar en 0.0.0.0 para aceptar conexiones de teléfonos y otras computadoras en la red
    app.listen(PORT, '0.0.0.0', () => {
        console.log('');
        console.log('  ╔════════════════════════════════════════════════════════════════════════╗');
        console.log('  ║                                                                        ║');
        console.log('  ║   🎓  UNIVERSIDAD SANTA MARÍA - FACULTAD DE DERECHO                    ║');
        console.log('  ║   📚  Sistema de Preinscripción de Postgrado en Línea                  ║');
        console.log('  ║                                                                        ║');
        console.log('  ╠════════════════════════════════════════════════════════════════════════╣');
        console.log('  ║                                                                        ║');
        console.log(`  ║   💻  Portal Público (Aspirantes):                                     ║`);
        console.log(`  ║       http://localhost:${PORT}                                          ║`);
        console.log('  ║                                                                        ║');
        console.log(`  ║   📱  En teléfonos y otras computadoras (Misma red Wi-Fi):             ║`);
        console.log(`  ║       http://${localIp}:${PORT}                                      ║`);
        console.log('  ║                                                                        ║');
        console.log(`  ║   🔒  Panel Administrativo PRIVADO (Requiere Usuario y Contraseña):     ║`);
        console.log(`  ║       http://${localIp}:${PORT}/admin.html                             ║`);
        console.log('  ║                                                                        ║');
        console.log('  ╚════════════════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log(`  👉 Credenciales por defecto:`);
        console.log(`     Usuario: ${process.env.ADMIN_USER || 'admin'}`);
        console.log(`     Clave:   ${process.env.ADMIN_PASS || 'usm2026'}`);
        console.log('');
    });
}

if (require.main === module) {
    iniciar().catch(err => {
        console.error('❌ Error al iniciar el servidor:', err);
        process.exit(1);
    });
}

module.exports = { app, iniciar };
