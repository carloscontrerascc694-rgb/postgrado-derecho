// ============================================================
// admin.js - Lógica del panel de administración privado
// Sistema de Preinscripción - Postgrado en Derecho USM
// ============================================================

/**
 * Cliente HTTP para peticiones administrativas autenticadas
 */
async function adminFetch(url, options = {}) {
    const response = await fetch(url, options);
    if (response.status === 401) {
        alert('Su sesión de administrador ha expirado o no es válida. Inicie sesión nuevamente.');
        window.location.href = '/login.html';
        throw new Error('No autorizado');
    }
    return response;
}

/**
 * Verificar sesión al cargar
 */
async function verificarAutenticacion() {
    try {
        const response = await fetch('/api/admin/verificar-sesion');
        if (response.status === 401) {
            window.location.href = '/login.html';
            return false;
        }
        const data = await response.json();
        if (!data.autenticado) {
            window.location.href = '/login.html';
            return false;
        }
        const label = document.getElementById('adminUserLabel');
        if (label && data.usuario) {
            label.textContent = data.usuario;
        }
        return true;
    } catch (e) {
        window.location.href = '/login.html';
        return false;
    }
}

/**
 * Cerrar sesión del administrador
 */
async function cerrarSesion() {
    if (!confirm('¿Desea cerrar su sesión de administrador?')) {
        return;
    }
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {}
    window.location.href = '/login.html';
}

// ============================================================
// Inicialización
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const ok = await verificarAutenticacion();
    if (!ok) return;

    cargarEstadisticas();
    cargarProgramasFiltro();
    cargarPreinscripciones();
    verificarEstadoGmail();
    cargarInfoRed();

    // Filtrar al escribir (con debounce)
    let debounce;
    const filtBusqueda = document.getElementById('filtBusqueda');
    if (filtBusqueda) {
        filtBusqueda.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(cargarPreinscripciones, 400);
        });
    }

    const filtEstado = document.getElementById('filtEstado');
    if (filtEstado) filtEstado.addEventListener('change', cargarPreinscripciones);

    const filtPrograma = document.getElementById('filtPrograma');
    if (filtPrograma) filtPrograma.addEventListener('change', cargarPreinscripciones);
});

// ============================================================
// Cargar estadísticas
// ============================================================
async function cargarEstadisticas() {
    try {
        const response = await adminFetch('/api/admin/estadisticas');
        const data = await response.json();

        if (data.success) {
            const stats = data.data;
            document.getElementById('statTotal').textContent = stats.total;

            const porEstado = {};
            stats.porEstado.forEach(e => porEstado[e.estado_solicitud] = e.total);

            document.getElementById('statPendientes').textContent = (porEstado.pendiente || 0) + (porEstado.revisada || 0);
            document.getElementById('statAceptadas').textContent = porEstado.aceptada || 0;
            document.getElementById('statRechazadas').textContent = porEstado.rechazada || 0;
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// ============================================================
// Cargar programas en el filtro
// ============================================================
async function cargarProgramasFiltro() {
    try {
        const response = await fetch('/api/programas');
        const data = await response.json();

        if (data.success) {
            const select = document.getElementById('filtPrograma');
            if (select) {
                // Guardar primer elemento si existe
                select.innerHTML = '<option value="">Todos los programas</option>';
                data.data.forEach(p => {
                    const option = document.createElement('option');
                    option.value = p.id;
                    option.textContent = p.nombre;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error cargando programas:', error);
    }
}

// ============================================================
// Cargar preinscripciones
// ============================================================
async function cargarPreinscripciones() {
    const params = new URLSearchParams();
    const filtBusqueda = document.getElementById('filtBusqueda');
    const filtEstado = document.getElementById('filtEstado');
    const filtPrograma = document.getElementById('filtPrograma');

    const busqueda = filtBusqueda ? filtBusqueda.value.trim() : '';
    const estado = filtEstado ? filtEstado.value : '';
    const programa = filtPrograma ? filtPrograma.value : '';

    if (busqueda) params.set('busqueda', busqueda);
    if (estado) params.set('estado', estado);
    if (programa) params.set('programa_id', programa);

    try {
        const response = await adminFetch(`/api/admin/preinscripciones?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
            renderizarTabla(data.data);
        }
    } catch (error) {
        console.error('Error cargando preinscripciones:', error);
    }
}

// ============================================================
// Helpers seguros
// ============================================================
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return 'N/A';
    try {
        const d = new Date(String(fechaStr).replace(' ', 'T'));
        if (isNaN(d.getTime())) return String(fechaStr);
        return d.toLocaleDateString('es-VE', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    } catch (e) {
        return String(fechaStr);
    }
}

let listaPreinscripciones = [];

// ============================================================
// Renderizar tabla con Aprobación Rápida
// ============================================================
function renderizarTabla(preinscripciones) {
    listaPreinscripciones = Array.isArray(preinscripciones) ? preinscripciones : [];
    const tbody = document.getElementById('tablaBody');

    if (!Array.isArray(preinscripciones) || preinscripciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted" style="padding: 30px;">
                    No se encontraron preinscripciones registradas.
                </td>
            </tr>
        `;
        return;
    }

    const estadoColores = {
        pendiente: { bg: '#fff3e0', color: '#e65100', text: '⏳ Pendiente' },
        revisada: { bg: '#e3f2fd', color: '#1565c0', text: '👁️ Revisada' },
        aceptada: { bg: '#e8f5e9', color: '#2e7d32', text: '✅ Aceptada' },
        rechazada: { bg: '#ffebee', color: '#c62828', text: '❌ Rechazada' }
    };

    tbody.innerHTML = preinscripciones.map(p => {
        const est = estadoColores[p.estado_solicitud] || estadoColores.pendiente;
        const fecha = formatearFecha(p.fecha_registro);
        const nombreCompleto = `${escapeHtml(p.nombres)} ${escapeHtml(p.apellidos)}`;
        const esAceptada = p.estado_solicitud === 'aceptada';
        const esRechazada = p.estado_solicitud === 'rechazada';
        const cod = escapeHtml(p.codigo_solicitud);

        return `
            <tr>
                <td><code style="font-size: 11px; color: #1a237e; font-weight: bold;">${cod}</code></td>
                <td><strong>${nombreCompleto}</strong></td>
                <td>${escapeHtml(p.cedula)}</td>
                <td><a href="mailto:${encodeURIComponent(p.email)}" style="color: #1565c0;">${escapeHtml(p.email)}</a></td>
                <td style="font-size: 12px;">${escapeHtml(p.programa_nombre)}</td>
                <td style="white-space: nowrap;">${fecha}</td>
                <td>
                    <span class="badge-estado" style="background: ${est.bg}; color: ${est.color}; font-weight: bold;">
                        ${est.text}
                    </span>
                </td>
                <td style="white-space: nowrap;">
                    <div style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap;">
                        <!-- Botón Aceptar Rápido -->
                        ${!esAceptada ? `
                            <button type="button" onclick="accionAceptar('${cod}')"
                                    class="btn btn-sm" style="padding: 4px 8px; font-size: 11px; font-weight: 700; background: #2e7d32; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;"
                                    title="Aceptar y aprobar esta solicitud">
                                ✅ Aceptar
                            </button>
                        ` : `
                            <span style="font-size: 11px; color: #2e7d32; font-weight: 700; background: #e8f5e9; padding: 3px 6px; border-radius: 4px;">
                                Aprobada
                            </span>
                        `}

                        <!-- Botón Rechazar Rápido -->
                        ${!esRechazada ? `
                            <button type="button" onclick="accionRechazar('${cod}')"
                                    class="btn btn-sm" style="padding: 4px 8px; font-size: 11px; font-weight: 700; background: #c62828; color: #ffffff; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;"
                                    title="Rechazar esta solicitud">
                                ❌ Rechazar
                            </button>
                        ` : ''}

                        <!-- Menú desplegable para otros estados -->
                        <select onchange="cambiarEstado('${cod}', this.value, this)" 
                                style="padding: 3px 5px; font-size: 11px; border: 1px solid #ccc; border-radius: 4px; background: #fff;">
                            <option value="">Cambiar...</option>
                            <option value="pendiente" ${p.estado_solicitud === 'pendiente' ? 'disabled' : ''}>⏳ Pendiente</option>
                            <option value="revisada" ${p.estado_solicitud === 'revisada' ? 'disabled' : ''}>👁️ Revisada</option>
                            <option value="aceptada" ${p.estado_solicitud === 'aceptada' ? 'disabled' : ''}>✅ Aceptar</option>
                            <option value="rechazada" ${p.estado_solicitud === 'rechazada' ? 'disabled' : ''}>❌ Rechazar</option>
                        </select>

                        <!-- Reenviar Correo -->
                        <button type="button" onclick="accionReenviar('${cod}', this)"
                                class="btn btn-sm btn-primary" style="padding: 4px 8px; font-size: 11px; font-weight: 700; background: #1a237e; border: none; white-space: nowrap;"
                                title="Enviar o reenviar requisitos directamente a la bandeja de Gmail del aspirante">
                            ✉️ Reenviar
                        </button>

                        <!-- Ver Correo -->
                        <a href="/api/preinscripcion/${encodeURIComponent(p.codigo_solicitud)}/correo" target="_blank" 
                           class="btn btn-sm btn-outline" style="padding: 3px 7px; font-size: 11px; text-decoration: none;" title="Ver correo y requisitos">
                            📄 Ver
                        </a>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Helpers seguros para delegación de eventos sin inyección de caracteres especiales
function accionAceptar(codigo) {
    const p = listaPreinscripciones.find(item => item.codigo_solicitud === codigo);
    const nombre = p ? `${p.nombres} ${p.apellidos}` : codigo;
    aceptarSolicitud(codigo, nombre);
}

function accionRechazar(codigo) {
    const p = listaPreinscripciones.find(item => item.codigo_solicitud === codigo);
    const nombre = p ? `${p.nombres} ${p.apellidos}` : codigo;
    rechazarSolicitud(codigo, nombre);
}

function accionReenviar(codigo, btn) {
    const p = listaPreinscripciones.find(item => item.codigo_solicitud === codigo);
    const email = p ? p.email : '';
    reenviarCorreoAspirante(codigo, email, btn);
}

// ============================================================
// Funciones directas para Aceptar / Rechazar Solicitudes
// ============================================================
async function aceptarSolicitud(codigo, nombre) {
    if (!confirm(`¿Confirma que desea ACEPTAR y aprobar la solicitud de preinscripción de ${nombre}?\n\nCódigo: ${codigo}`)) {
        return;
    }

    try {
        const response = await adminFetch(`/api/admin/preinscripcion/${encodeURIComponent(codigo)}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'aceptada' })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ ¡Solicitud de ${nombre} ACEPTADA exitosamente!`);
            cargarPreinscripciones();
            cargarEstadisticas();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error al aceptar solicitud:', error);
    }
}

async function rechazarSolicitud(codigo, nombre) {
    if (!confirm(`¿Confirma que desea RECHAZAR la preinscripción de ${nombre}?\n\nCódigo: ${codigo}`)) {
        return;
    }

    try {
        const response = await adminFetch(`/api/admin/preinscripcion/${encodeURIComponent(codigo)}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'rechazada' })
        });

        const data = await response.json();

        if (data.success) {
            alert(`❌ La solicitud de ${nombre} ha sido marcada como rechazada.`);
            cargarPreinscripciones();
            cargarEstadisticas();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error al rechazar solicitud:', error);
    }
}

// ============================================================
// Cambiar estado manual
// ============================================================
async function cambiarEstado(codigo, nuevoEstado, selectEl) {
    if (!nuevoEstado) return;

    const confirmMsg = nuevoEstado === 'aceptada'
        ? '¿Confirma que desea ACEPTAR esta preinscripción?'
        : nuevoEstado === 'rechazada'
            ? '¿Confirma que desea RECHAZAR esta preinscripción?'
            : `¿Cambiar el estado a "${nuevoEstado}"?`;

    if (!confirm(confirmMsg)) {
        if (selectEl) selectEl.value = '';
        return;
    }

    try {
        const response = await adminFetch(`/api/admin/preinscripcion/${encodeURIComponent(codigo)}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        const data = await response.json();

        if (data.success) {
            cargarPreinscripciones();
            cargarEstadisticas();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error al cambiar estado:', error);
    }
}

// ============================================================
// Activación y Estado de Gmail Real
// ============================================================
async function verificarEstadoGmail() {
    try {
        const response = await adminFetch('/api/admin/estado-correo');
        const data = await response.json();

        if (data.success) {
            const badge = document.getElementById('badgeEstadoGmail');
            const userInput = document.getElementById('inputGmailUser');
            if (userInput && data.data.email) {
                userInput.value = data.data.email;
            }

            if (badge) {
                if (data.data.conectado) {
                    badge.textContent = '🟢 Envío Real Activo';
                    badge.style.background = '#e8f5e9';
                    badge.style.color = '#2e7d32';
                } else {
                    badge.textContent = '🟡 Pendiente Clave';
                    badge.style.background = '#fff3e0';
                    badge.style.color = '#e65100';
                }
            }
        }
    } catch (e) {
        console.error('Error consultando estado de correo:', e);
    }
}

async function activarGmailReal(e) {
    e.preventDefault();

    const btn = document.getElementById('btnActivarGmail');
    const alerta = document.getElementById('alertaGmail');
    const email = document.getElementById('inputGmailUser').value.trim();
    const pass = document.getElementById('inputGmailPass').value.trim();

    btn.disabled = true;
    btn.innerHTML = '⏳ Verificando con Google...';
    alerta.innerHTML = '';

    try {
        const response = await adminFetch('/api/admin/activar-gmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, pass })
        });

        const data = await response.json();

        if (data.success) {
            alerta.innerHTML = `
                <div class="alert alert-success" style="margin-bottom: 15px;">
                    <span>✅</span>
                    <div>
                        <strong>¡Conexión Exitosa con Gmail!</strong>
                        <p>${data.message}</p>
                    </div>
                </div>
            `;
            document.getElementById('inputGmailPass').value = '';
            verificarEstadoGmail();
        } else {
            alerta.innerHTML = `
                <div class="alert alert-error" style="margin-bottom: 15px;">
                    <span>❌</span>
                    <div>
                        <strong>No se pudo conectar:</strong>
                        <p>${data.message}</p>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        alerta.innerHTML = `
            <div class="alert alert-error" style="margin-bottom: 15px;">
                <span>❌</span>
                <div>
                    <strong>Error de conexión:</strong>
                    <p>No se pudo comunicar con el servidor.</p>
                </div>
            </div>
        `;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🚀 Conectar y Activar Envío Real';
    }
}

// ============================================================
// Reenviar correo con requisitos directamente al Gmail del aspirante
// ============================================================
async function reenviarCorreoAspirante(codigo, email, btn) {
    if (!confirm(`¿Desea reenviar el correo oficial con los requisitos y enlaces USM directamente al Gmail de ${email}?`)) {
        return;
    }

    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ Enviando...';

    try {
        const response = await adminFetch(`/api/admin/preinscripcion/${encodeURIComponent(codigo)}/reenviar-correo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ ${data.message}`);
            cargarPreinscripciones();
        } else {
            alert(`❌ Error al enviar: ${data.message}`);
        }
    } catch (err) {
        alert('❌ Error de comunicación con el servidor.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = textoOriginal;
    }
}

// ============================================================
// Enviar correo de prueba a cualquier dirección
// ============================================================
async function probarEnvioGmail(e) {
    e.preventDefault();

    const input = document.getElementById('inputDestinoPrueba');
    const btn = document.getElementById('btnProbarEnvio');
    const alerta = document.getElementById('alertaPrueba');
    const destino = input.value.trim();

    if (!destino) return;

    btn.disabled = true;
    btn.innerHTML = '⏳ Enviando prueba...';
    alerta.innerHTML = '';

    try {
        const response = await adminFetch('/api/admin/probar-correo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destino })
        });

        const data = await response.json();

        if (data.success) {
            alerta.innerHTML = `
                <div class="alert alert-success" style="margin-top: 10px; font-size: 13px;">
                    <span>✅</span>
                    <div>
                        <strong>${data.message}</strong>
                        <p style="margin: 4px 0 0; font-size: 12px;">Por favor abre tu Gmail (${destino}) en la bandeja principal o en Spam para verificarlo.</p>
                    </div>
                </div>
            `;
        } else {
            alerta.innerHTML = `
                <div class="alert alert-error" style="margin-top: 10px; font-size: 13px;">
                    <span>❌</span>
                    <div>
                        <strong>Error al enviar:</strong>
                        <p style="margin: 4px 0 0;">${data.message}</p>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        alerta.innerHTML = `
            <div class="alert alert-error" style="margin-top: 10px; font-size: 13px;">
                <span>❌</span>
                <div><strong>Error:</strong> No se pudo conectar con el servidor.</div>
            </div>
        `;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '✉️ Enviar Correo de Prueba';
    }
}

// ============================================================
// Cargar información de red local y QR para teléfonos
// ============================================================
async function cargarInfoRed() {
    try {
        const response = await fetch('/api/info-red');
        const data = await response.json();

        if (data.success && data.data) {
            const input = document.getElementById('inputUrlRed');
            const btnAbrir = document.getElementById('btnAbrirUrlRed');
            const imgQr = document.getElementById('imgQrRed');

            const publicUrl = data.data.urlCloudflare || data.data.urlFacil || data.data.urlRed || data.data.urlLocal;

            if (input) input.value = publicUrl;
            if (btnAbrir) btnAbrir.href = publicUrl;
            if (imgQr) {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(publicUrl)}`;
                imgQr.src = qrUrl;
            }
        }
    } catch (e) {
        console.warn('No se pudo cargar info de red dinámica:', e);
    }
}

function copiarUrlRed() {
    const input = document.getElementById('inputUrlRed');
    if (!input) return;

    input.select();
    input.setSelectionRange(0, 99999);

    navigator.clipboard.writeText(input.value)
        .then(() => alert('📋 ¡Enlace copiado al portapapeles! Puedes compartirlo con los aspirantes.'))
        .catch(() => alert('Enlace: ' + input.value));
}
