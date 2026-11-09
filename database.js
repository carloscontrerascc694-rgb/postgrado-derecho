// ============================================================
// database.js - Módulo de base de datos SQLite (sql.js)
// Sistema de Preinscripción - Postgrado en Derecho USM
// ============================================================

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// Crear directorio de datos si no existe
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'preinscripciones.db');
let db = null;

// ============================================================
// Inicializar la base de datos
// ============================================================
async function inicializarDB() {
    const SQL = await initSqlJs();

    // Cargar DB existente o crear nueva
    if (fs.existsSync(dbPath)) {
        const buffer = fs.readFileSync(dbPath);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    // Crear tablas
    db.run(`
        CREATE TABLE IF NOT EXISTS programas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            tipo TEXT NOT NULL,
            descripcion TEXT,
            duracion TEXT,
            modalidad TEXT DEFAULT 'Presencial',
            pensum TEXT,
            activo INTEGER DEFAULT 1
        )
    `);

    // Asegurar que la columna pensum exista si la tabla ya existía
    try {
        db.run("ALTER TABLE programas ADD COLUMN pensum TEXT");
    } catch(e) {}

    db.run(`
        CREATE TABLE IF NOT EXISTS preinscripciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_solicitud TEXT UNIQUE NOT NULL,
            cedula TEXT NOT NULL,
            nombres TEXT NOT NULL,
            apellidos TEXT NOT NULL,
            fecha_nacimiento TEXT,
            genero TEXT,
            email TEXT NOT NULL,
            telefono TEXT NOT NULL,
            direccion TEXT,
            ciudad TEXT,
            estado TEXT,
            universidad_egreso TEXT,
            titulo_obtenido TEXT,
            anio_egreso INTEGER,
            programa_id INTEGER NOT NULL,
            motivacion TEXT,
            estado_solicitud TEXT DEFAULT 'pendiente',
            fecha_registro DATETIME DEFAULT (datetime('now','localtime')),
            fecha_actualizacion DATETIME DEFAULT (datetime('now','localtime')),
            correo_enviado INTEGER DEFAULT 0,
            FOREIGN KEY (programa_id) REFERENCES programas(id)
        )
    `);

    // Índices
    try { db.run("CREATE INDEX IF NOT EXISTS idx_preinscripciones_codigo ON preinscripciones(codigo_solicitud)"); } catch(e) {}
    try { db.run("CREATE INDEX IF NOT EXISTS idx_preinscripciones_cedula ON preinscripciones(cedula)"); } catch(e) {}
    try { db.run("CREATE INDEX IF NOT EXISTS idx_preinscripciones_email ON preinscripciones(email)"); } catch(e) {}

    // ============================================================
    // Pensums oficiales por programa (Plan de Estudios USM)
    // ============================================================
    const pensumsData = {
        'Especialización en Derecho Penal': {
            titulo: 'Especialista en Derecho Penal',
            total_uc: 24,
            semestres: [
                {
                    nombre: 'Primer Semestre',
                    materias: [
                        { codigo: 'EDP-101', nombre: 'Teoría del Delito y Dogmática Penal', uc: 3, horas: 48 },
                        { codigo: 'EDP-102', nombre: 'Derecho Penal Especial: Delitos contra Personas y Patrimonio', uc: 3, horas: 48 },
                        { codigo: 'EDP-103', nombre: 'Garantías Constitucionales y Sistema Penal Acusatorio', uc: 3, horas: 48 },
                        { codigo: 'EDP-104', nombre: 'Metodología de la Investigación Jurídica I', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Segundo Semestre',
                    materias: [
                        { codigo: 'EDP-201', nombre: 'Procedimientos Penales Especiales y Recursos Ordinarios', uc: 3, horas: 48 },
                        { codigo: 'EDP-202', nombre: 'Criminología Clínica y Política Criminal', uc: 3, horas: 48 },
                        { codigo: 'EDP-203', nombre: 'Sistema Penal de Responsabilidad del Adolescente', uc: 2, horas: 32 },
                        { codigo: 'EDP-204', nombre: 'Trabajo Especial de Grado (T.E.G.)', uc: 4, horas: 64 }
                    ]
                }
            ]
        },
        'Especialización en Derecho Mercantil': {
            titulo: 'Especialista en Derecho Mercantil',
            total_uc: 24,
            semestres: [
                {
                    nombre: 'Primer Semestre',
                    materias: [
                        { codigo: 'EDM-101', nombre: 'Teoría General del Derecho Mercantil y Derecho Societario', uc: 3, horas: 48 },
                        { codigo: 'EDM-102', nombre: 'Contratos Mercantiles Modernos y Operaciones Bancarias', uc: 3, horas: 48 },
                        { codigo: 'EDM-103', nombre: 'Títulos Valores e Instrumentos Financieros Negociables', uc: 3, horas: 48 },
                        { codigo: 'EDM-104', nombre: 'Metodología de la Investigación Jurídica', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Segundo Semestre',
                    materias: [
                        { codigo: 'EDM-201', nombre: 'Régimen Concursal, Reestructuración y Quiebras', uc: 3, horas: 48 },
                        { codigo: 'EDM-202', nombre: 'Derecho de Seguros y Fianzas Comerciales', uc: 3, horas: 48 },
                        { codigo: 'EDM-203', nombre: 'Arbitraje Comercial Nacional e Internacional', uc: 2, horas: 32 },
                        { codigo: 'EDM-204', nombre: 'Trabajo Especial de Grado (T.E.G.)', uc: 4, horas: 64 }
                    ]
                }
            ]
        },
        'Especialización en Derecho Laboral': {
            titulo: 'Especialista en Derecho del Trabajo',
            total_uc: 24,
            semestres: [
                {
                    nombre: 'Primer Semestre',
                    materias: [
                        { codigo: 'EDL-101', nombre: 'Relaciones Individuales de Trabajo y Contratación', uc: 3, horas: 48 },
                        { codigo: 'EDL-102', nombre: 'Régimen de Prestaciones Sociales y Salario', uc: 3, horas: 48 },
                        { codigo: 'EDL-103', nombre: 'Seguridad y Salud en el Trabajo (LOPCYMAT) y Seguridad Social', uc: 3, horas: 48 },
                        { codigo: 'EDL-104', nombre: 'Metodología de la Investigación Jurídica', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Segundo Semestre',
                    materias: [
                        { codigo: 'EDL-201', nombre: 'Derecho Colectivo del Trabajo y Negociación Colectiva', uc: 3, horas: 48 },
                        { codigo: 'EDL-202', nombre: 'Derecho Procesal del Trabajo y Litigación Oral', uc: 3, horas: 48 },
                        { codigo: 'EDL-203', nombre: 'Recurso de Casación en Materia Laboral', uc: 2, horas: 32 },
                        { codigo: 'EDL-204', nombre: 'Trabajo Especial de Grado (T.E.G.)', uc: 4, horas: 64 }
                    ]
                }
            ]
        },
        'Especialización en Derecho Procesal': {
            titulo: 'Especialista en Derecho Procesal',
            total_uc: 24,
            semestres: [
                {
                    nombre: 'Primer Semestre',
                    materias: [
                        { codigo: 'EDPR-101', nombre: 'Teoría General del Proceso y Tutela Judicial Efectiva', uc: 3, horas: 48 },
                        { codigo: 'EDPR-102', nombre: 'Derecho Probatorio y Carga Dinámica de la Prueba', uc: 3, horas: 48 },
                        { codigo: 'EDPR-103', nombre: 'Procedimiento Ordinario Civil y Medidas Cautelares', uc: 3, horas: 48 },
                        { codigo: 'EDPR-104', nombre: 'Metodología de la Investigación Procesal', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Segundo Semestre',
                    materias: [
                        { codigo: 'EDPR-201', nombre: 'Procesos de Ejecución y Vías de Apremio', uc: 3, horas: 48 },
                        { codigo: 'EDPR-202', nombre: 'Medios de Impugnación y Casación Civil', uc: 3, horas: 48 },
                        { codigo: 'EDPR-203', nombre: 'Oralidad y Técnicas de Argumentación Procesal', uc: 2, horas: 32 },
                        { codigo: 'EDPR-204', nombre: 'Trabajo Especial de Grado (T.E.G.)', uc: 4, horas: 64 }
                    ]
                }
            ]
        },
        'Especialización en Derecho Tributario': {
            titulo: 'Especialista en Derecho Tributario',
            total_uc: 24,
            semestres: [
                {
                    nombre: 'Primer Semestre',
                    materias: [
                        { codigo: 'EDT-101', nombre: 'Principios Constitucionales Tributarios y Código Orgánico Tributario', uc: 3, horas: 48 },
                        { codigo: 'EDT-102', nombre: 'Imposición Directa: Impuesto Sobre la Renta (ISLR)', uc: 3, horas: 48 },
                        { codigo: 'EDT-103', nombre: 'Imposición Indirecta: Impuesto al Valor Agregado (IVA)', uc: 3, horas: 48 },
                        { codigo: 'EDT-104', nombre: 'Metodología de la Investigación Tributaria', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Segundo Semestre',
                    materias: [
                        { codigo: 'EDT-201', nombre: 'Tributación Estadal y Municipal', uc: 3, horas: 48 },
                        { codigo: 'EDT-202', nombre: 'Procedimientos Administrativos Tributarios e Ilícitos Fiscales', uc: 3, horas: 48 },
                        { codigo: 'EDT-203', nombre: 'Juicio Contencioso Tributario y Recursos', uc: 2, horas: 32 },
                        { codigo: 'EDT-204', nombre: 'Trabajo Especial de Grado (T.E.G.)', uc: 4, horas: 64 }
                    ]
                }
            ]
        },
        'Especialización en Derecho Administrativo': {
            titulo: 'Especialista en Derecho Administrativo',
            total_uc: 24,
            semestres: [
                {
                    nombre: 'Primer Semestre',
                    materias: [
                        { codigo: 'EDA-101', nombre: 'Bases del Derecho Administrativo y Teoría del Acto Administrativo', uc: 3, horas: 48 },
                        { codigo: 'EDA-102', nombre: 'Procedimiento Administrativo Ordinario y Potestad Sancionatoria', uc: 3, horas: 48 },
                        { codigo: 'EDA-103', nombre: 'Régimen de Contrataciones Públicas y Licitaciones', uc: 3, horas: 48 },
                        { codigo: 'EDA-104', nombre: 'Metodología de la Investigación Jurídica', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Segundo Semestre',
                    materias: [
                        { codigo: 'EDA-201', nombre: 'Jurisdicción Contencioso-Administrativa y Amparo', uc: 3, horas: 48 },
                        { codigo: 'EDA-202', nombre: 'Responsabilidad Patrimonial del Estado y de los Funcionarios', uc: 3, horas: 48 },
                        { codigo: 'EDA-203', nombre: 'Servicios Públicos y Actividad Regulatoria Económica', uc: 2, horas: 32 },
                        { codigo: 'EDA-204', nombre: 'Trabajo Especial de Grado (T.E.G.)', uc: 4, horas: 64 }
                    ]
                }
            ]
        },
        'Maestría en Derecho Penal': {
            titulo: 'Magíster Scientiarum en Derecho Penal',
            total_uc: 44,
            semestres: [
                {
                    nombre: 'Primer Semestre',
                    materias: [
                        { codigo: 'MDP-101', nombre: 'Epistemología Jurídica y Filosofía Penal', uc: 3, horas: 48 },
                        { codigo: 'MDP-102', nombre: 'Teoría Avanzada de la Imputación Penal y Culpabilidad', uc: 3, horas: 48 },
                        { codigo: 'MDP-103', nombre: 'Derecho Penal Internacional y Derechos Humanos', uc: 3, horas: 48 },
                        { codigo: 'MDP-104', nombre: 'Metodología de la Investigación Jurídica I', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Segundo Semestre',
                    materias: [
                        { codigo: 'MDP-201', nombre: 'Criminología Crítica y Sociología Jurídico-Penal', uc: 3, horas: 48 },
                        { codigo: 'MDP-202', nombre: 'Dogmática Procesal Penal Comparada', uc: 3, horas: 48 },
                        { codigo: 'MDP-203', nombre: 'Delincuencia Organizada y Delitos Económicos', uc: 3, horas: 48 },
                        { codigo: 'MDP-204', nombre: 'Seminario de Tesis I (Formulación de Proyecto)', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Tercer Semestre',
                    materias: [
                        { codigo: 'MDP-301', nombre: 'Política Criminal y Modelos Penitenciarios', uc: 3, horas: 48 },
                        { codigo: 'MDP-302', nombre: 'Análisis Jurisprudencial y Casación Penal Avanzada', uc: 3, horas: 48 },
                        { codigo: 'MDP-303', nombre: 'Seminario de Tesis II (Avance de Investigación)', uc: 4, horas: 64 }
                    ]
                },
                {
                    nombre: 'Cuarto Semestre',
                    materias: [
                        { codigo: 'MDP-401', nombre: 'Seminario Tutorial y Redacción de Tesis', uc: 4, horas: 64 },
                        { codigo: 'MDP-402', nombre: 'Defensa de Trabajo de Grado de Maestría', uc: 9, horas: 144 }
                    ]
                }
            ]
        },
        'Maestría en Derecho Mercantil': {
            titulo: 'Magíster Scientiarum en Derecho Mercantil',
            total_uc: 44,
            semestres: [
                {
                    nombre: 'Primer Semestre',
                    materias: [
                        { codigo: 'MDM-101', nombre: 'Fundamentos Epistemológicos del Derecho Patrimonial', uc: 3, horas: 48 },
                        { codigo: 'MDM-102', nombre: 'Derecho Societario Avanzado, Fusiones y Adquisiciones', uc: 3, horas: 48 },
                        { codigo: 'MDM-103', nombre: 'Mercado de Capitales y Sistema Financiero Internacional', uc: 3, horas: 48 },
                        { codigo: 'MDM-104', nombre: 'Metodología de la Investigación Jurídica I', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Segundo Semestre',
                    materias: [
                        { codigo: 'MDM-201', nombre: 'Contratación Comercial Internacional e Incoterms', uc: 3, horas: 48 },
                        { codigo: 'MDM-202', nombre: 'Propiedad Intelectual, Marcas, Patentes y Derecho Digital', uc: 3, horas: 48 },
                        { codigo: 'MDM-203', nombre: 'Derecho de la Competencia y Antimonopolio', uc: 3, horas: 48 },
                        { codigo: 'MDM-204', nombre: 'Seminario de Tesis I', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Tercer Semestre',
                    materias: [
                        { codigo: 'MDM-301', nombre: 'Solución de Controversias Comerciales y Arbitraje CIADI', uc: 3, horas: 48 },
                        { codigo: 'MDM-302', nombre: 'Insolvencia Transfronteriza y Reestructuración Empresarial', uc: 3, horas: 48 },
                        { codigo: 'MDM-303', nombre: 'Seminario de Tesis II', uc: 4, horas: 64 }
                    ]
                },
                {
                    nombre: 'Cuarto Semestre',
                    materias: [
                        { codigo: 'MDM-401', nombre: 'Seminario Tutorial de Investigación', uc: 4, horas: 64 },
                        { codigo: 'MDM-402', nombre: 'Defensa de Trabajo de Grado de Maestría', uc: 9, horas: 144 }
                    ]
                }
            ]
        },
        'Maestría en Derecho Constitucional': {
            titulo: 'Magíster Scientiarum en Derecho Constitucional',
            total_uc: 44,
            semestres: [
                {
                    nombre: 'Primer Semestre',
                    materias: [
                        { codigo: 'MDC-101', nombre: 'Teoría Constitucional Contemporánea y Neoconstitucionalismo', uc: 3, horas: 48 },
                        { codigo: 'MDC-102', nombre: 'Interpretación Constitucional y Principialística', uc: 3, horas: 48 },
                        { codigo: 'MDC-103', nombre: 'Derechos Fundamentales y Sistema Interamericano (CIDH)', uc: 3, horas: 48 },
                        { codigo: 'MDC-104', nombre: 'Metodología de la Investigación Jurídica I', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Segundo Semestre',
                    materias: [
                        { codigo: 'MDC-201', nombre: 'Justicia Constitucional y Modelos de Control de Constitucionalidad', uc: 3, horas: 48 },
                        { codigo: 'MDC-202', nombre: 'Acción de Amparo Constitucional y Garantías Procesales', uc: 3, horas: 48 },
                        { codigo: 'MDC-203', nombre: 'Separación de Poderes y Estructura del Estado', uc: 3, horas: 48 },
                        { codigo: 'MDC-204', nombre: 'Seminario de Tesis I', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Tercer Semestre',
                    materias: [
                        { codigo: 'MDC-301', nombre: 'Derecho Procesal Constitucional Comparado', uc: 3, horas: 48 },
                        { codigo: 'MDC-302', nombre: 'Democracia, Estado de Derecho y Régimen Político', uc: 3, horas: 48 },
                        { codigo: 'MDC-303', nombre: 'Seminario de Tesis II', uc: 4, horas: 64 }
                    ]
                },
                {
                    nombre: 'Cuarto Semestre',
                    materias: [
                        { codigo: 'MDC-401', nombre: 'Seminario Tutorial y Redacción de Tesis', uc: 4, horas: 64 },
                        { codigo: 'MDC-402', nombre: 'Defensa de Trabajo de Grado de Maestría', uc: 9, horas: 144 }
                    ]
                }
            ]
        },
        'Doctorado en Derecho': {
            titulo: 'Doctor en Derecho',
            total_uc: 60,
            semestres: [
                {
                    nombre: 'Primer Semestre',
                    materias: [
                        { codigo: 'DDR-101', nombre: 'Epistemología Jurídica y Filosofía de la Ciencia', uc: 4, horas: 64 },
                        { codigo: 'DDR-102', nombre: 'Metodología Avanzada de la Investigación Doctoral', uc: 4, horas: 64 },
                        { codigo: 'DDR-103', nombre: 'Historia del Pensamiento Jurídico y Teoría del Estado', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Segundo Semestre',
                    materias: [
                        { codigo: 'DDR-201', nombre: 'Teoría Crítica del Derecho Contemporáneo', uc: 4, horas: 64 },
                        { codigo: 'DDR-202', nombre: 'Seminario de Investigación Doctoral I', uc: 4, horas: 64 },
                        { codigo: 'DDR-203', nombre: 'Seminario Electivo de Profundización I', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Tercer Semestre',
                    materias: [
                        { codigo: 'DDR-301', nombre: 'Análisis Económico, Social y Cultural del Derecho', uc: 4, horas: 64 },
                        { codigo: 'DDR-302', nombre: 'Seminario de Investigación Doctoral II (Proyecto Doctoral)', uc: 4, horas: 64 },
                        { codigo: 'DDR-303', nombre: 'Seminario Electivo de Profundización II', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Cuarto Semestre',
                    materias: [
                        { codigo: 'DDR-401', nombre: 'Avance de Tesis Doctoral I (Trabajo de Fuentes)', uc: 5, horas: 80 },
                        { codigo: 'DDR-402', nombre: 'Coloquio Epistémico Doctoral', uc: 3, horas: 48 }
                    ]
                },
                {
                    nombre: 'Quinto Semestre',
                    materias: [
                        { codigo: 'DDR-501', nombre: 'Avance de Tesis Doctoral II (Estructuración y Redacción)', uc: 6, horas: 96 }
                    ]
                },
                {
                    nombre: 'Sexto Semestre',
                    materias: [
                        { codigo: 'DDR-601', nombre: 'Disertación y Defensa Pública de la Tesis Doctoral', uc: 16, horas: 256 }
                    ]
                }
            ]
        }
    };

    // Actualizar pensums en la base de datos
    const updatePensumStmt = db.prepare("UPDATE programas SET pensum = ? WHERE nombre = ?");
    for (const [nombreProg, pensumObj] of Object.entries(pensumsData)) {
        updatePensumStmt.run([JSON.stringify(pensumObj), nombreProg]);
    }
    updatePensumStmt.free();
    guardarDB();
    const countResult = db.exec("SELECT COUNT(*) as total FROM programas");
    const count = countResult[0].values[0][0];

    if (count === 0) {
        const programas = [
            ['Especialización en Derecho Penal', 'Especialización',
             'Programa orientado a profundizar en el estudio del Derecho Penal sustantivo y adjetivo, con énfasis en la dogmática penal y el proceso penal venezolano.',
             '2 semestres', 'Presencial'],
            ['Especialización en Derecho Mercantil', 'Especialización',
             'Formación avanzada en el ámbito del Derecho Comercial, contratos mercantiles, derecho bancario y societario.',
             '2 semestres', 'Presencial'],
            ['Especialización en Derecho Laboral', 'Especialización',
             'Estudio profundo de las relaciones laborales, seguridad social, derecho procesal del trabajo y derecho colectivo.',
             '2 semestres', 'Presencial'],
            ['Especialización en Derecho Procesal', 'Especialización',
             'Análisis detallado de los procedimientos civiles, mercantiles y contencioso-administrativos.',
             '2 semestres', 'Presencial'],
            ['Especialización en Derecho Tributario', 'Especialización',
             'Formación especializada en el sistema tributario venezolano, procedimientos fiscales y planificación tributaria.',
             '2 semestres', 'Presencial'],
            ['Especialización en Derecho Administrativo', 'Especialización',
             'Estudio avanzado de la administración pública, actos administrativos, contrataciones públicas y responsabilidad del Estado.',
             '2 semestres', 'Presencial'],
            ['Maestría en Derecho Penal', 'Maestría',
             'Programa de investigación en el campo del Derecho Penal con enfoque en criminología y política criminal.',
             '4 semestres', 'Presencial'],
            ['Maestría en Derecho Mercantil', 'Maestría',
             'Investigación avanzada en Derecho Comercial, arbitraje comercial y derecho de la competencia.',
             '4 semestres', 'Presencial'],
            ['Maestría en Derecho Constitucional', 'Maestría',
             'Estudio e investigación en Derecho Constitucional, derechos humanos y justicia constitucional.',
             '4 semestres', 'Presencial'],
            ['Doctorado en Derecho', 'Doctorado',
             'Programa doctoral orientado a la investigación jurídica de alto nivel, producción de conocimiento original y formación de investigadores.',
             '6 semestres', 'Presencial'],
        ];

        const stmt = db.prepare("INSERT INTO programas (nombre, tipo, descripcion, duracion, modalidad) VALUES (?, ?, ?, ?, ?)");
        for (const p of programas) {
            stmt.run(p);
        }
        stmt.free();
        guardarDB();
        console.log('✅ Programas de postgrado insertados correctamente.');
    }

    console.log('✅ Base de datos inicializada correctamente.');
    return db;
}

// ============================================================
// Guardar la base de datos al disco
// ============================================================
function guardarDB() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

// ============================================================
// Helpers para consultas seguras (libera memoria WASM siempre)
// ============================================================
function queryOne(sql, params = []) {
    if (!db) throw new Error('Base de datos no inicializada');
    const stmt = db.prepare(sql);
    try {
        const safeParams = Array.isArray(params) ? params.map(p => p === undefined ? null : p) : [];
        stmt.bind(safeParams);
        if (stmt.step()) {
            const columns = stmt.getColumnNames();
            const values = stmt.get();
            const result = {};
            columns.forEach((col, i) => {
                result[col] = values[i];
            });
            return result;
        }
        return null;
    } finally {
        stmt.free();
    }
}

function queryAll(sql, params = []) {
    if (!db) throw new Error('Base de datos no inicializada');
    const stmt = db.prepare(sql);
    try {
        const safeParams = Array.isArray(params) ? params.map(p => p === undefined ? null : p) : [];
        stmt.bind(safeParams);
        const results = [];
        const columns = stmt.getColumnNames();
        while (stmt.step()) {
            const values = stmt.get();
            const obj = {};
            columns.forEach((col, i) => {
                obj[col] = values[i];
            });
            results.push(obj);
        }
        return results;
    } finally {
        stmt.free();
    }
}

// ============================================================
// Funciones de acceso a datos
// ============================================================

function obtenerProgramas() {
    const list = queryAll('SELECT * FROM programas WHERE activo = 1 ORDER BY tipo, nombre');
    return list.map(p => {
        if (p.pensum && typeof p.pensum === 'string') {
            try { p.pensum = JSON.parse(p.pensum); } catch(e) {}
        }
        return p;
    });
}

function obtenerProgramaPorId(id) {
    const p = queryOne('SELECT * FROM programas WHERE id = ?', [id]);
    if (p && p.pensum && typeof p.pensum === 'string') {
        try { p.pensum = JSON.parse(p.pensum); } catch(e) {}
    }
    return p;
}

function crearPreinscripcion(datos) {
    if (!db) throw new Error('Base de datos no inicializada');
    const stmt = db.prepare(`
        INSERT INTO preinscripciones (
            codigo_solicitud, cedula, nombres, apellidos, fecha_nacimiento, genero,
            email, telefono, direccion, ciudad, estado,
            universidad_egreso, titulo_obtenido, anio_egreso,
            programa_id, motivacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
        stmt.run([
            datos.codigo_solicitud ?? null,
            datos.cedula ?? null,
            datos.nombres ?? null,
            datos.apellidos ?? null,
            datos.fecha_nacimiento ?? null,
            datos.genero ?? null,
            datos.email ?? null,
            datos.telefono ?? null,
            datos.direccion ?? null,
            datos.ciudad ?? null,
            datos.estado ?? null,
            datos.universidad_egreso ?? null,
            datos.titulo_obtenido ?? null,
            datos.anio_egreso ?? null,
            datos.programa_id ?? null,
            datos.motivacion ?? null
        ]);
        guardarDB();
    } finally {
        stmt.free();
    }
}

function obtenerPreinscripcionPorCodigo(codigo) {
    return queryOne(`
        SELECT p.*, pr.nombre as programa_nombre, pr.tipo as programa_tipo,
               pr.duracion as programa_duracion, pr.modalidad as programa_modalidad,
               pr.descripcion as programa_descripcion
        FROM preinscripciones p
        JOIN programas pr ON p.programa_id = pr.id
        WHERE p.codigo_solicitud = ?
    `, [codigo]);
}

function obtenerTodasPreinscripciones(filtros = {}) {
    let query = `
        SELECT p.*, pr.nombre as programa_nombre, pr.tipo as programa_tipo
        FROM preinscripciones p
        JOIN programas pr ON p.programa_id = pr.id
    `;

    const conditions = [];
    const params = [];

    if (filtros.estado) {
        conditions.push('p.estado_solicitud = ?');
        params.push(filtros.estado);
    }

    if (filtros.programa_id) {
        conditions.push('p.programa_id = ?');
        params.push(filtros.programa_id);
    }

    if (filtros.busqueda) {
        conditions.push('(p.nombres LIKE ? OR p.apellidos LIKE ? OR p.cedula LIKE ? OR p.email LIKE ?)');
        const term = `%${filtros.busqueda}%`;
        params.push(term, term, term, term);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.fecha_registro DESC';

    return queryAll(query, params);
}

function actualizarEstado(codigo, nuevoEstado) {
    db.run("UPDATE preinscripciones SET estado_solicitud = ?, fecha_actualizacion = datetime('now','localtime') WHERE codigo_solicitud = ?",
        [nuevoEstado, codigo]);
    const changes = db.getRowsModified();
    guardarDB();
    return { changes };
}

function marcarCorreoEnviado(codigo) {
    db.run("UPDATE preinscripciones SET correo_enviado = 1 WHERE codigo_solicitud = ?", [codigo]);
    guardarDB();
}

function obtenerEstadisticas() {
    const totalResult = queryOne('SELECT COUNT(*) as total FROM preinscripciones');
    const porEstado = queryAll(`
        SELECT estado_solicitud, COUNT(*) as total
        FROM preinscripciones
        GROUP BY estado_solicitud
    `);
    const porPrograma = queryAll(`
        SELECT pr.nombre, pr.tipo, COUNT(*) as total
        FROM preinscripciones p
        JOIN programas pr ON p.programa_id = pr.id
        GROUP BY p.programa_id
        ORDER BY total DESC
    `);

    return {
        total: totalResult ? totalResult.total : 0,
        porEstado,
        porPrograma
    };
}

function existePreinscripcion(cedula, programaId) {
    const result = queryOne(
        "SELECT COUNT(*) as total FROM preinscripciones WHERE cedula = ? AND programa_id = ? AND estado_solicitud != 'rechazada'",
        [cedula, programaId]
    );
    return result ? result.total > 0 : false;
}

function eliminarPreinscripcion(codigo) {
    if (!db) throw new Error('Base de datos no inicializada');
    db.run("DELETE FROM preinscripciones WHERE codigo_solicitud = ?", [codigo]);
    const changes = db.getRowsModified();
    guardarDB();
    return { changes };
}

module.exports = {
    inicializarDB,
    getDb: () => db,
    obtenerProgramas,
    obtenerProgramaPorId,
    crearPreinscripcion,
    obtenerPreinscripcionPorCodigo,
    obtenerTodasPreinscripciones,
    actualizarEstado,
    marcarCorreoEnviado,
    obtenerEstadisticas,
    existePreinscripcion,
    eliminarPreinscripcion
};
