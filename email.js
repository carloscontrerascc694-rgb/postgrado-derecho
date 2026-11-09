// ============================================================
// email.js - Módulo de envío de correos electrónicos y requisitos
// Sistema de Preinscripción - Postgrado en Derecho USM
// ============================================================

const nodemailer = require('nodemailer');

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Genera el contenido HTML completo del correo con los requisitos del postgrado
 */
function generarHtmlCorreo(preinscripcion, customBaseUrl) {
    const baseUrl = customBaseUrl || process.env.BASE_URL || 'http://localhost:3000';
    const linkConsulta = `${baseUrl}/consulta.html?codigo=${encodeURIComponent(preinscripcion.codigo_solicitud || '')}`;

    const nombres = escapeHtml(preinscripcion.nombres || '');
    const apellidos = escapeHtml(preinscripcion.apellidos || '');
    const codigo = escapeHtml(preinscripcion.codigo_solicitud || '');
    const progNombre = escapeHtml(preinscripcion.programa_nombre || '');
    const progTipo = escapeHtml(preinscripcion.programa_tipo || '');
    const progDuracion = escapeHtml(preinscripcion.programa_duracion || '2 semestres');
    const progModalidad = escapeHtml(preinscripcion.programa_modalidad || 'Presencial');
    const cedula = escapeHtml(preinscripcion.cedula || '');
    const email = escapeHtml(preinscripcion.email || '');
    const telefono = escapeHtml(preinscripcion.telefono || '');
    const uEgreso = escapeHtml(preinscripcion.universidad_egreso || 'No indicada');
    const titulo = escapeHtml(preinscripcion.titulo_obtenido || 'Abogado');

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f6f9; }
            .container { max-width: 650px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(135deg, #0d233a 0%, #1a237e 60%, #283593 100%); color: white; padding: 35px 25px; text-align: center; }
            .header h1 { margin: 10px 0 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
            .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
            .logo-badge { display: inline-block; background: #c9a84c; color: #0d233a; font-weight: 800; font-size: 20px; padding: 8px 18px; border-radius: 30px; letter-spacing: 2px; }
            .content { padding: 30px 25px; color: #333333; line-height: 1.6; }
            .content h2 { color: #1a237e; font-size: 19px; border-bottom: 2px solid #e8eaf6; padding-bottom: 8px; margin-top: 25px; }
            
            .solicitud-box { background: #eef2f7; border-left: 5px solid #1a237e; padding: 18px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
            .solicitud-box p { margin: 6px 0; font-size: 14px; }
            .solicitud-box strong { color: #0d233a; min-width: 170px; display: inline-block; }
            
            .codigo-destacado { background: #fff8e1; border: 2px dashed #f57f17; padding: 16px; text-align: center; border-radius: 10px; margin: 20px 0; }
            .codigo-destacado .num { font-size: 24px; font-weight: 800; color: #e65100; letter-spacing: 2px; }
            
            .programa-box { background: linear-gradient(135deg, #1a237e, #283593); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .programa-box h3 { margin: 5px 0; font-size: 18px; color: #ffd54f; }
            .programa-box p { margin: 0; font-size: 13px; opacity: 0.9; }

            .requisitos-card { background: #ffffff; border: 1px solid #dcdfe6; border-radius: 10px; padding: 20px; margin: 20px 0; }
            .requisito-item { display: flex; align-items: flex-start; margin-bottom: 12px; font-size: 14px; }
            .requisito-item .check { color: #2e7d32; font-weight: bold; font-size: 16px; margin-right: 10px; flex-shrink: 0; }
            .requisito-item strong { color: #1a237e; }
            
            .pasos-box { background: #f9fbfd; border: 1px solid #e1e8ed; border-radius: 10px; padding: 20px; margin: 20px 0; }
            .paso { margin-bottom: 12px; font-size: 13px; }
            .paso-num { display: inline-block; background: #c9a84c; color: #0d233a; width: 22px; height: 22px; border-radius: 50%; text-align: center; line-height: 22px; font-weight: bold; margin-right: 8px; font-size: 12px; }
            
            .btn { display: inline-block; background: linear-gradient(135deg, #1a237e, #0d47a1); color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 20px 0; text-align: center; }
            .btn:hover { opacity: 0.95; }
            
            .footer { background: #1a237e; color: #cfd8dc; padding: 25px 20px; text-align: center; font-size: 12px; }
            .footer p { margin: 4px 0; }
            .footer a { color: #ffd54f; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header USM -->
            <div class="header">
                <div class="logo-badge">USM</div>
                <h1>UNIVERSIDAD SANTA MARÍA</h1>
                <p>Dirección General de Postgrado e Investigación • Facultad de Derecho</p>
            </div>

            <!-- Contenido -->
            <div class="content">
                <p style="font-size: 16px;">
                    Estimado/a abogado/a <strong>${nombres} ${apellidos}</strong>,
                </p>
                <p>
                    Hemos recibido satisfactoriamente su solicitud de preinscripción. A continuación le suministramos la información del programa académico seleccionado y los <strong>requisitos obligatorios</strong> que debe consignar para formalizar su admisión.
                </p>

                <!-- Código -->
                <div class="codigo-destacado">
                    <p style="margin: 0 0 5px; color: #666; font-size: 13px;">Su Código Oficial de Preinscripción es:</p>
                    <div class="num">${codigo}</div>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #888;">Conserve este código para consultas y entrega de recaudos</p>
                </div>

                <!-- Programa Elegido -->
                <div class="programa-box">
                    <p style="text-transform: uppercase; letter-spacing: 1px; color: #bbdefb; font-size: 11px;">${progTipo}</p>
                    <h3>${progNombre}</h3>
                    <p>Duración: ${progDuracion} • Modalidad: ${progModalidad}</p>
                </div>

                <!-- Datos Registrados -->
                <h2>📋 Resumen de Datos Registrados</h2>
                <div class="solicitud-box">
                    <p><strong>Cédula de Identidad:</strong> ${cedula}</p>
                    <p><strong>Nombre y Apellido:</strong> ${nombres} ${apellidos}</p>
                    <p><strong>Correo Electrónico:</strong> ${email}</p>
                    <p><strong>Teléfono de Contacto:</strong> ${telefono}</p>
                    <p><strong>Universidad de Egreso:</strong> ${uEgreso}</p>
                    <p><strong>Título Registrado:</strong> ${titulo}</p>
                    <p><strong>Estado de Solicitud:</strong> <span style="color: #e65100; font-weight: bold;">⏳ Preinscripción Registrada</span></p>
                </div>

                <!-- REQUISITOS OBLIGATORIOS -->
                <h2>📄 Requisitos Obligatorios para Postgrado en Derecho</h2>
                <p style="font-size: 13px; color: #555;">
                    Para formalizar su ingreso al postgrado, debe consignar los siguientes recaudos (en original y copia para su vista y devolución):
                </p>

                <div class="requisitos-card">
                    <div class="requisito-item">
                        <span class="check">✔</span>
                        <div><strong>Fondo Negro del Título de Abogado:</strong> Debidamente autenticado o certificado por la Secretaría de la universidad de egreso.</div>
                    </div>
                    <div class="requisito-item">
                        <span class="check">✔</span>
                        <div><strong>Certificación de Calificaciones:</strong> Notas certificadas originales de los estudios de pregrado en Derecho.</div>
                    </div>
                    <div class="requisito-item">
                        <span class="check">✔</span>
                        <div><strong>Documento de Identidad:</strong> Fotocopia ampliada y legible de la Cédula de Identidad vigente (a color).</div>
                    </div>
                    <div class="requisito-item">
                        <span class="check">✔</span>
                        <div><strong>Partida de Nacimiento:</strong> Copia certificada y legible de la partida de nacimiento.</div>
                    </div>
                    <div class="requisito-item">
                        <span class="check">✔</span>
                        <div><strong>Curriculum Vitae:</strong> Resumen curricular actualizado con copias de los soportes académicos y profesionales más relevantes.</div>
                    </div>
                    <div class="requisito-item">
                        <span class="check">✔</span>
                        <div><strong>Fotografías:</strong> Dos (2) fotografías tipo carnet recientes en fondo blanco.</div>
                    </div>
                    <div class="requisito-item">
                        <span class="check">✔</span>
                        <div><strong>Carta de Exposición de Motivos:</strong> Carta dirigida a la Dirección de Postgrado explicando su interés en el área jurídica seleccionada.</div>
                    </div>
                    <div class="requisito-item">
                        <span class="check">✔</span>
                        <div><strong>Arancel de Preinscripción:</strong> Comprobante original del depósito o transferencia bancaria correspondiente al derecho de trámite.</div>
                    </div>
                    <div class="requisito-item">
                        <span class="check">✔</span>
                        <div><strong>Para Doctorado en Derecho (si aplica):</strong> Fondo negro del Título de Maestría o Especialización debidamente registrado.</div>
                    </div>
                </div>

                <!-- Pasos de Formalización -->
                <h2>📌 Pasos para Formalizar la Inscripción</h2>
                <div class="pasos-box">
                    <div class="paso">
                        <span class="paso-num">1</span>
                        <strong>Organizar recaudos:</strong> Prepare los documentos solicitados en una carpeta marrón tamaño oficio con gancho debidamente identificada.
                    </div>
                    <div class="paso">
                        <span class="paso-num">2</span>
                        <strong>Consignación:</strong> Presentar la carpeta en la Dirección General de Postgrado (Facultad de Derecho, Campus USM).
                    </div>
                    <div class="paso">
                        <span class="paso-num">3</span>
                        <strong>Entrevista Académica:</strong> Se le convocará para una breve entrevista con la coordinación del postgrado.
                    </div>
                    <div class="paso">
                        <span class="paso-num">4</span>
                        <strong>Formalización de Matrícula:</strong> Una vez validada la documentación, se procederá con la inscripción académica y asignación de materias.
                    </div>
                </div>

                <!-- Botón de consulta y enlace oficial USM -->
                <div style="text-align: center; margin: 30px 0; background: #fdfefe; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px 20px;">
                    <p style="font-size: 15px; font-weight: 700; color: #1a237e; margin-bottom: 15px;">
                        🔗 ENLACES OFICIALES DE LA UNIVERSIDAD SANTA MARÍA
                    </p>
                    
                    <a href="https://usm.edu.ve" target="_blank" class="btn" style="background: linear-gradient(135deg, #c9a84c, #b38d38); color: #0d233a !important; font-size: 16px; padding: 15px 32px; display: inline-block; margin-bottom: 12px; font-weight: 800; border-radius: 8px; text-decoration: none;">
                        🏛️ Ir a la Página Oficial USM (usm.edu.ve)
                    </a>
                    
                    <div style="margin-top: 15px;">
                        <a href="https://usm.edu.ve/postgrado" target="_blank" style="color: #1a237e; font-weight: 700; text-decoration: underline; font-size: 14px; margin-right: 15px;">
                            🎓 Portal de Postgrados USM
                        </a>
                        <span style="color: #ccc;">•</span>
                        <a href="${linkConsulta}" style="color: #1a237e; font-weight: 700; text-decoration: underline; font-size: 14px; margin-left: 15px;">
                            📋 Consultar Estado de Solicitud en Línea
                        </a>
                    </div>

                    <p style="font-size: 12px; color: #777; margin-top: 12px;">
                        Dirección web oficial: <a href="https://usm.edu.ve" style="color: #1a237e; font-weight: bold;">https://usm.edu.ve</a>
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p><strong>UNIVERSIDAD SANTA MARÍA</strong></p>
                <p>Dirección General de Postgrado e Investigación - Facultad de Derecho</p>
                <p>Caracas, Venezuela • Campus La Florencia</p>
                <p>Correo de atención: <a href="mailto:postgrado.derecho@usm.edu.ve">postgrado.derecho@usm.edu.ve</a></p>
                <p style="margin-top: 15px; font-size: 11px; opacity: 0.7;">
                    Este es un comprobante oficial de preinscripción emitido automáticamente por el Sistema Web USM.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Enviar correo de confirmación con los requisitos
 * Funciona automáticamente:
 * 1. Si hay SMTP configurado en .env, lo utiliza.
 * 2. Si no hay SMTP configurado o falla, genera automáticamente una cuenta de prueba Ethereal
 *    y permite ver el correo completo en línea sin requerir contraseña de aplicación.
 */
async function enviarCorreoConfirmacion(preinscripcion, customBaseUrl) {
    if (!preinscripcion || !preinscripcion.email) {
        return { success: false, error: 'Datos de preinscripción o correo inválidos' };
    }

    const htmlContent = generarHtmlCorreo(preinscripcion, customBaseUrl);
    const subject = `🎓 Preinscripción y Requisitos: ${preinscripcion.programa_nombre} | USM Postgrado Derecho`;

    // 1. Intentar con SMTP si está configurado en .env
    const hasSmtpConfig = process.env.SMTP_USER &&
        process.env.SMTP_USER !== 'tu_correo@gmail.com' &&
        process.env.SMTP_PASS &&
        process.env.SMTP_PASS !== 'tu_contraseña_de_aplicacion';

    if (hasSmtpConfig) {
        try {
            const transportOptions = (process.env.SMTP_HOST && process.env.SMTP_HOST !== 'smtp.gmail.com')
                ? {
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT || '587', 10),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    },
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                    socketTimeout: 15000
                }
                : {
                    service: 'gmail',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    },
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                    socketTimeout: 15000
                };

            const transporter = nodemailer.createTransport(transportOptions);

            const info = await transporter.sendMail({
                from: `"Universidad Santa María - Postgrado en Derecho" <${process.env.SMTP_USER}>`,
                to: preinscripcion.email,
                subject: subject,
                html: htmlContent
            });

            console.log(`✅ ¡CORREO ENTREGADO EN EL GMAIL DEL USUARIO!: ${preinscripcion.email} (ID: ${info.messageId})`);
            return { success: true, messageId: info.messageId, realDelivery: true };
        } catch (smtpError) {
            console.error(`❌ Error entregando al Gmail real (${smtpError.message}).`);
            return { success: false, error: smtpError.message, realDelivery: false };
        }
    } else {
        console.warn(`⚠️ AVISO: Configure SMTP_USER y SMTP_PASS en el archivo .env para que Google envíe físicamente al buzón de Gmail del usuario.`);
    }

    // 2. Modo Cero Configuración: genera envío de prueba automático sin contraseñas
    try {
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });

        const info = await testTransporter.sendMail({
            from: `"Postgrado Derecho USM" <postgrado.derecho@usm.edu.ve>`,
            to: preinscripcion.email,
            subject: subject,
            html: htmlContent
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`📧 Correo con Requisitos preparado para ${preinscripcion.email}`);
        if (previewUrl) {
            console.log(`🔗 Ver correo en línea (Ethereal Mail): ${previewUrl}`);
        }

        return {
            success: true,
            messageId: info.messageId,
            previewUrl: previewUrl || null
        };
    } catch (testError) {
        console.error('Error en entrega de correo:', testError.message);
        // Aun si no hay internet para Ethereal, el correo se genera en la vista web
        return { success: true, messageId: 'LOCAL-VIEW', previewUrl: null };
    }
}

/**
 * Notificación interna para el coordinador/administrador
 */
async function enviarNotificacionAdmin(preinscripcion) {
    const adminEmail = process.env.ADMIN_EMAIL || 'postgrado.derecho@usm.edu.ve';
    console.log(`🔔 Notificación de preinscripción registrada para ${adminEmail}: ${preinscripcion.codigo_solicitud} (${preinscripcion.nombres} ${preinscripcion.apellidos})`);
    return { success: true };
}

async function verificarCredencialesGmail(user, pass) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
    });
    await transporter.verify();
    return true;
}

module.exports = {
    generarHtmlCorreo,
    enviarCorreoConfirmacion,
    enviarNotificacionAdmin,
    verificarCredencialesGmail
};
