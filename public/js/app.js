// ============================================================
// app.js - Lógica del formulario de preinscripción
// Sistema de Preinscripción - Postgrado en Derecho USM
// ============================================================

let programaSeleccionado = null;
let listaProgramas = [];

// ============================================================
// Inicialización
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarProgramas();

    // Establecer fecha máxima dinámica (mínimo 20 años de edad)
    const fnInput = document.getElementById('fecha_nacimiento');
    if (fnInput) {
        const today = new Date();
        const maxYear = today.getFullYear() - 20;
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        fnInput.max = `${maxYear}-${m}-${d}`;
    }

    const form = document.getElementById('formPreinscripcion');
    if (form) {
        form.addEventListener('submit', enviarPreinscripcion);
    }

    // Cerrar modales con clic fuera o con tecla ESC
    const modal = document.getElementById('modalExito');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModal();
        });
    }

    const modalP = document.getElementById('modalPensum');
    if (modalP) {
        modalP.addEventListener('click', (e) => {
            if (e.target === modalP) cerrarModalPensum();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModal();
            cerrarModalPensum();
        }
    });
});

// ============================================================
// Cargar programas desde la API
// ============================================================
async function cargarProgramas() {
    try {
        const response = await fetch('/api/programas');
        const data = await response.json();

        if (data.success) {
            listaProgramas = data.data;
            renderizarProgramas(data.data);
        } else {
            mostrarAlerta('error', 'No se pudieron cargar los programas disponibles.');
        }
    } catch (error) {
        mostrarAlerta('error', 'Error de conexión al cargar los programas. Verifique que el servidor esté activo.');
    }
}

// ============================================================
// Renderizar tarjetas de programas
// ============================================================
function renderizarProgramas(programas) {
    const grid = document.getElementById('programasGrid');

    // Agrupar por tipo
    const tipos = {};
    programas.forEach(p => {
        if (!tipos[p.tipo]) tipos[p.tipo] = [];
        tipos[p.tipo].push(p);
    });

    let html = '';

    for (const [tipo, progs] of Object.entries(tipos)) {
        progs.forEach(p => {
            const tipoClass = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            html += `
                <div class="programa-card" data-id="${p.id}" onclick="seleccionarPrograma(${p.id}, this)">
                    <div class="check-icon">✓</div>
                    <span class="tipo-badge ${tipoClass}">${p.tipo}</span>
                    <h4>${p.nombre}</h4>
                    <p>${p.descripcion || ''}</p>
                    <div class="meta" style="margin-bottom: 8px;">
                        <span>🕐 ${p.duracion}</span>
                        <span>📍 ${p.modalidad}</span>
                    </div>
                    <div style="border-top: 1px solid #e0e0e0; padding-top: 8px; display: flex; justify-content: flex-end;">
                        <button type="button" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 4px 10px;" onclick="event.stopPropagation(); abrirModalPensum(${p.id})">
                            📚 Ver Pensum de Estudios
                        </button>
                    </div>
                </div>
            `;
        });
    }

    grid.innerHTML = html;
}

// ============================================================
// Modal de Pensum de Estudios
// ============================================================
function abrirModalPensum(id) {
    const prog = listaProgramas.find(p => p.id === id);
    if (!prog) return;

    document.getElementById('pensumModalTipo').textContent = prog.tipo;
    document.getElementById('pensumModalTitulo').textContent = prog.nombre;
    document.getElementById('pensumModalMeta').textContent = `Duración: ${prog.duracion} • Modalidad: ${prog.modalidad}`;

    const container = document.getElementById('pensumModalContenido');

    // Parsear pensum si viene como string
    let pensum = prog.pensum;
    if (typeof pensum === 'string') {
        try { pensum = JSON.parse(pensum); } catch(e) { pensum = null; }
    }

    if (!pensum || !pensum.semestres) {
        container.innerHTML = `
            <p style="color: #666; padding: 20px 0;">El pensum detallado de este programa estará disponible próximamente en secretaría académica.</p>
        `;
    } else {
        let phtml = '';

        if (pensum.titulo || pensum.total_uc) {
            phtml += `
                <div style="background: #e8eaf6; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 13px;">
                    <div><strong>Título a Obtener:</strong> ${pensum.titulo || prog.nombre}</div>
                    <div><strong>Unidades de Crédito Totales:</strong> <span style="color: #1a237e; font-weight: bold;">${pensum.total_uc} UC</span></div>
                </div>
            `;
        }

        pensum.semestres.forEach(sem => {
            phtml += `
                <div style="margin-bottom: 22px;">
                    <h4 style="color: #1a237e; border-bottom: 2px solid #c9a84c; padding-bottom: 4px; margin-bottom: 10px; font-size: 15px;">
                        📌 ${sem.nombre}
                    </h4>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                                <tr style="background: #f1f3f7; text-align: left;">
                                    <th style="padding: 8px 10px; border-bottom: 1px solid #ddd;">Código</th>
                                    <th style="padding: 8px 10px; border-bottom: 1px solid #ddd;">Asignatura / Materia</th>
                                    <th style="padding: 8px 10px; border-bottom: 1px solid #ddd; text-align: center;">U.C.</th>
                                    <th style="padding: 8px 10px; border-bottom: 1px solid #ddd; text-align: center;">Horas</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sem.materias.map(m => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 8px 10px; font-family: monospace; color: #1a237e; font-weight: bold;">${m.codigo}</td>
                                        <td style="padding: 8px 10px;">${m.nombre}</td>
                                        <td style="padding: 8px 10px; text-align: center; font-weight: 600;">${m.uc}</td>
                                        <td style="padding: 8px 10px; text-align: center; color: #666;">${m.horas || '-'}h</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        });

        container.innerHTML = phtml;
    }

    // Botón de selección dentro del modal
    const btnSelect = document.getElementById('btnSeleccionarDesdePensum');
    btnSelect.onclick = () => {
        const card = document.querySelector(`.programa-card[data-id="${id}"]`);
        if (card) {
            seleccionarPrograma(id, card);
        }
        cerrarModalPensum();
        // Scroll suave a los datos del aspirante
        const datosHeader = document.querySelector('.card:nth-of-type(2)');
        if (datosHeader) {
            datosHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    document.getElementById('modalPensum').classList.add('active');
}

function cerrarModalPensum() {
    const modalP = document.getElementById('modalPensum');
    if (modalP) modalP.classList.remove('active');
}

// ============================================================
// Seleccionar programa
// ============================================================
function seleccionarPrograma(id, element) {
    // Remover selección anterior
    document.querySelectorAll('.programa-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Seleccionar nuevo
    element.classList.add('selected');
    programaSeleccionado = id;
    document.getElementById('programa_id').value = id;
    document.getElementById('programaError').style.display = 'none';
}

// ============================================================
// Enviar formulario de preinscripción
// ============================================================
async function enviarPreinscripcion(e) {
    e.preventDefault();

    // Validar
    if (!validarFormulario()) return;

    // Mostrar loading
    document.getElementById('loadingOverlay').classList.add('active');
    document.getElementById('btnSubmit').disabled = true;

    const formData = {
        cedula: document.getElementById('cedula').value.trim(),
        nombres: document.getElementById('nombres').value.trim(),
        apellidos: document.getElementById('apellidos').value.trim(),
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value || null,
        genero: document.getElementById('genero').value || null,
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        direccion: document.getElementById('direccion').value.trim() || null,
        ciudad: document.getElementById('ciudad').value.trim() || null,
        estado: document.getElementById('estado_residencia').value || null,
        universidad_egreso: document.getElementById('universidad_egreso').value.trim() || null,
        titulo_obtenido: document.getElementById('titulo_obtenido').value.trim() || null,
        anio_egreso: document.getElementById('anio_egreso').value || null,
        programa_id: programaSeleccionado,
        motivacion: document.getElementById('motivacion').value.trim() || null
    };

    try {
        const response = await fetch('/api/preinscripcion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            // Mostrar modal de éxito
            document.getElementById('codigoSolicitud').textContent = data.data.codigo_solicitud;
            const correoSpan = document.getElementById('correoConfirmado');
            if (correoSpan) correoSpan.textContent = formData.email;
            document.getElementById('linkConsulta').href = data.data.link_consulta;
            
            const btnCorreo = document.getElementById('linkVerCorreo');
            if (btnCorreo) {
                btnCorreo.href = data.data.preview_correo_url || data.data.link_correo;
            }

            document.getElementById('modalExito').classList.add('active');

            // Limpiar formulario
            document.getElementById('formPreinscripcion').reset();
            const progInput = document.getElementById('programa_id');
            if (progInput) progInput.value = '';
            programaSeleccionado = null;
            document.querySelectorAll('.programa-card').forEach(c => c.classList.remove('selected'));

            mostrarAlerta('success', `¡Preinscripción exitosa! El correo con los recaudos y enlaces oficiales ha sido enviado a ${formData.email}.`);
        } else {
            mostrarAlerta('error', data.message);
        }
    } catch (error) {
        mostrarAlerta('error', 'Error de conexión. Por favor intente nuevamente.');
    } finally {
        document.getElementById('loadingOverlay').classList.remove('active');
        document.getElementById('btnSubmit').disabled = false;
    }
}

// ============================================================
// Validación del formulario
// ============================================================
function validarFormulario() {
    let valido = true;

    // Limpiar errores previos
    document.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
    document.querySelectorAll('input, select').forEach(i => i.classList.remove('error'));

    // Programa
    if (!programaSeleccionado) {
        document.getElementById('programaError').style.display = 'block';
        valido = false;
    }

    // Campos obligatorios
    const camposRequeridos = [
        { id: 'cedula', msg: 'Ingrese su número de cédula.' },
        { id: 'nombres', msg: 'Ingrese sus nombres.' },
        { id: 'apellidos', msg: 'Ingrese sus apellidos.' },
        { id: 'email', msg: 'Ingrese un correo electrónico válido.' },
        { id: 'telefono', msg: 'Ingrese su número de teléfono.' }
    ];

    camposRequeridos.forEach(campo => {
        const input = document.getElementById(campo.id);
        if (!input.value.trim()) {
            input.classList.add('error');
            input.closest('.form-group').classList.add('has-error');
            valido = false;
        }
    });

    // Validar email
    const emailInput = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailInput.value.trim() && !emailRegex.test(emailInput.value.trim())) {
        emailInput.classList.add('error');
        emailInput.closest('.form-group').classList.add('has-error');
        valido = false;
    }

    // Validar fecha de nacimiento y edad mínima para postgrado
    const fnInput = document.getElementById('fecha_nacimiento');
    const fnVal = fnInput.value;
    const fnErrorMsg = document.getElementById('fechaNacimientoError');

    if (!fnVal) {
        fnInput.classList.add('error');
        fnInput.closest('.form-group').classList.add('has-error');
        if (fnErrorMsg) fnErrorMsg.textContent = 'Ingrese su fecha de nacimiento.';
        valido = false;
    } else {
        const parts = fnVal.trim().split('-');
        const bYear = parseInt(parts[0], 10);
        const bMonth = parseInt(parts[1], 10);
        const bDay = parseInt(parts[2], 10);

        const now = new Date();
        let age = now.getFullYear() - bYear;
        const currM = now.getMonth() + 1;
        const currD = now.getDate();
        if (currM < bMonth || (currM === bMonth && currD < bDay)) age--;

        if (isNaN(bYear) || isNaN(bMonth) || isNaN(bDay) || bMonth < 1 || bMonth > 12 || bDay < 1 || bDay > 31) {
            fnInput.classList.add('error');
            fnInput.closest('.form-group').classList.add('has-error');
            if (fnErrorMsg) fnErrorMsg.textContent = 'Fecha de nacimiento inválida.';
            valido = false;
        } else if (age < 20) {
            fnInput.classList.add('error');
            fnInput.closest('.form-group').classList.add('has-error');
            if (fnErrorMsg) fnErrorMsg.textContent = `Debe tener al menos 20 años para postularse al postgrado (edad calculada: ${age >= 0 ? age : 0} años).`;
            valido = false;
        } else if (age > 95) {
            fnInput.classList.add('error');
            fnInput.closest('.form-group').classList.add('has-error');
            if (fnErrorMsg) fnErrorMsg.textContent = 'La fecha de nacimiento ingresada no es válida.';
            valido = false;
        }
    }

    if (!valido) {
        mostrarAlerta('error', 'Por favor complete todos los campos obligatorios marcados con (*).');
        // Scroll al primer error
        const primerError = document.querySelector('.error, #programaError[style*="block"]');
        if (primerError) {
            primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return valido;
}

// ============================================================
// Mostrar alertas
// ============================================================
function mostrarAlerta(tipo, mensaje) {
    const container = document.getElementById('alertContainer');
    const iconos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const alert = document.createElement('div');
    alert.className = `alert alert-${tipo}`;
    alert.innerHTML = `<span>${iconos[tipo]}</span><span>${mensaje}</span>`;

    container.prepend(alert);

    // Auto-remover después de 8 segundos
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 8000);
}

// ============================================================
// Cerrar modal
// ============================================================
function cerrarModal() {
    document.getElementById('modalExito').classList.remove('active');
}

