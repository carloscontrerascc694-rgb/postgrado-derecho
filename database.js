// ============================================================
// database.js - Módulo de base de datos en la nube (Supabase)
// Sistema de Preinscripción - Postgrado en Derecho USM
// ============================================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 10 Programas Oficiales de Postgrado USM y sus Planes de Estudio (Pensums)
const PENSUMS_OFICIALES = {
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

const PROGRAMAS_BASE = [
    {
        id: 1,
        nombre: 'Especialización en Derecho Penal',
        tipo: 'Especialización',
        descripcion: 'Programa orientado a profundizar en el estudio del Derecho Penal sustantivo y adjetivo, con énfasis en la dogmática penal y el proceso penal venezolano.',
        duracion: '2 semestres',
        modalidad: 'Presencial',
        activo: 1,
        pensum: PENSUMS_OFICIALES['Especialización en Derecho Penal']
    },
    {
        id: 2,
        nombre: 'Especialización en Derecho Mercantil',
        tipo: 'Especialización',
        descripcion: 'Formación avanzada en el ámbito del Derecho Comercial, contratos mercantiles, derecho bancario y societario.',
        duracion: '2 semestres',
        modalidad: 'Presencial',
        activo: 1,
        pensum: PENSUMS_OFICIALES['Especialización en Derecho Mercantil']
    },
    {
        id: 3,
        nombre: 'Especialización en Derecho Laboral',
        tipo: 'Especialización',
        descripcion: 'Estudio profundo de las relaciones laborales, seguridad social, derecho procesal del trabajo y derecho colectivo.',
        duracion: '2 semestres',
        modalidad: 'Presencial',
        activo: 1,
        pensum: PENSUMS_OFICIALES['Especialización en Derecho Laboral']
    },
    {
        id: 4,
        nombre: 'Especialización en Derecho Procesal',
        tipo: 'Especialización',
        descripcion: 'Análisis detallado de los procedimientos civiles, mercantiles y contencioso-administrativos.',
        duracion: '2 semestres',
        modalidad: 'Presencial',
        activo: 1,
        pensum: PENSUMS_OFICIALES['Especialización en Derecho Procesal']
    },
    {
        id: 5,
        nombre: 'Especialización en Derecho Tributario',
        tipo: 'Especialización',
        descripcion: 'Formación especializada en el sistema tributario venezolano, procedimientos fiscales y planificación tributaria.',
        duracion: '2 semestres',
        modalidad: 'Presencial',
        activo: 1,
        pensum: PENSUMS_OFICIALES['Especialización en Derecho Tributario']
    },
    {
        id: 6,
        nombre: 'Especialización en Derecho Administrativo',
        tipo: 'Especialización',
        descripcion: 'Estudio avanzado de la administración pública, actos administrativos, contrataciones públicas y responsabilidad del Estado.',
        duracion: '2 semestres',
        modalidad: 'Presencial',
        activo: 1,
        pensum: PENSUMS_OFICIALES['Especialización en Derecho Administrativo']
    },
    {
        id: 7,
        nombre: 'Maestría en Derecho Penal',
        tipo: 'Maestría',
        descripcion: 'Programa de investigación en el campo del Derecho Penal con enfoque en criminología y política criminal.',
        duracion: '4 semestres',
        modalidad: 'Presencial',
        activo: 1,
        pensum: PENSUMS_OFICIALES['Maestría en Derecho Penal']
    },
    {
        id: 8,
        nombre: 'Maestría en Derecho Mercantil',
        tipo: 'Maestría',
        descripcion: 'Investigación avanzada en Derecho Comercial, arbitraje comercial y derecho de la competencia.',
        duracion: '4 semestres',
        modalidad: 'Presencial',
        activo: 1,
        pensum: PENSUMS_OFICIALES['Maestría en Derecho Mercantil']
    },
    {
        id: 9,
        nombre: 'Maestría en Derecho Constitucional',
        tipo: 'Maestría',
        descripcion: 'Estudio e investigación en Derecho Constitucional, derechos humanos y justicia constitucional.',
        duracion: '4 semestres',
        modalidad: 'Presencial',
        activo: 1,
        pensum: PENSUMS_OFICIALES['Maestría en Derecho Constitucional']
    },
    {
        id: 10,
        nombre: 'Doctorado en Derecho',
        tipo: 'Doctorado',
        descripcion: 'Programa doctoral orientado a la investigación jurídica de alto nivel, producción de conocimiento original y formación de investigadores.',
        duracion: '6 semestres',
        modalidad: 'Presencial',
        activo: 1,
        pensum: PENSUMS_OFICIALES['Doctorado en Derecho']
    }
];

// Almacenamiento en memoria como respaldo seguro si las credenciales de Supabase aún no se han configurado
let memoriaProgramas = JSON.parse(JSON.stringify(PROGRAMAS_BASE));
let memoriaPreinscripciones = [];

// Instancia de Supabase
let supabase = null;
let supabaseConectado = false;

/**
 * Obtiene o crea el cliente de Supabase
 */
function getSupabaseClient() {
    if (supabase) return supabase;

    const url = (process.env.SUPABASE_URL || '').trim();
    const key = (
        process.env.SUPABASE_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        ''
    ).trim();

    if (url && url.startsWith('http') && key && key.length > 10) {
        try {
            supabase = createClient(url, key, {
                auth: { persistSession: false }
            });
            return supabase;
        } catch (e) {
            console.error('⚠️ Error al crear cliente de Supabase:', e.message);
            return null;
        }
    }
    return null;
}

// ============================================================
// Inicializar la base de datos (Supabase)
// ============================================================
async function inicializarDB() {
    const client = getSupabaseClient();

    if (!client) {
        console.log('');
        console.log('  ⚠️  [Supabase] SUPABASE_URL o SUPABASE_KEY no están configurados todavía.');
        console.log('  ℹ️  El sistema está funcionando con almacenamiento seguro en memoria temporal.');
        console.log('  👉 Para conectar la base de datos en la nube permanente:');
        console.log('     1. Cree su proyecto en https://supabase.com');
        console.log('     2. Pegue y ejecute supabase_schema.sql en el SQL Editor');
        console.log('     3. Añada SUPABASE_URL y SUPABASE_KEY a su archivo .env o en el panel de Render.');
        console.log('');
        return;
    }

    try {
        // Verificar si la tabla de programas ya existe y tiene registros
        const { data, error } = await client
            .from('programas')
            .select('id, nombre')
            .limit(1);

        if (error) {
            console.warn('⚠️ [Supabase] No se pudo leer la tabla programas:', error.message);
            console.warn('👉 Recuerde ejecutar el archivo supabase_schema.sql en el SQL Editor de su proyecto Supabase.');
            return;
        }

        supabaseConectado = true;
        console.log('  ✅ [Supabase] Conexión establecida exitosamente con la base de datos en la nube.');

        // Si la tabla programas está vacía, sembramos automáticamente los 10 programas con sus pensums
        const { count, error: countErr } = await client
            .from('programas')
            .select('*', { count: 'exact', head: true });

        if (!countErr && (count === 0 || count === null)) {
            console.log('  🌱 [Supabase] Sincronizando los 10 programas oficiales y pensums...');
            for (const prog of PROGRAMAS_BASE) {
                await client.from('programas').upsert({
                    id: prog.id,
                    nombre: prog.nombre,
                    tipo: prog.tipo,
                    descripcion: prog.descripcion,
                    duracion: prog.duracion,
                    modalidad: prog.modalidad,
                    activo: 1,
                    pensum: prog.pensum
                });
            }
            console.log('  ✅ [Supabase] 10 programas de postgrado y pensums sincronizados con éxito.');
        }
    } catch (e) {
        console.error('⚠️ [Supabase] Error durante la inicialización:', e.message);
    }
}

// ============================================================
// Funciones de acceso a datos
// ============================================================

/**
 * Obtener todos los programas activos
 */
async function obtenerProgramas() {
    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client
                .from('programas')
                .select('*')
                .eq('activo', 1)
                .order('tipo', { ascending: true })
                .order('nombre', { ascending: true });

            if (!error && Array.isArray(data) && data.length > 0) {
                return data.map(p => {
                    let pensum = p.pensum;
                    if (typeof pensum === 'string') {
                        try { pensum = JSON.parse(pensum); } catch(e) {}
                    }
                    return { ...p, pensum };
                });
            }
        } catch (e) {
            console.warn('⚠️ Fallback a memoria al obtener programas:', e.message);
        }
    }
    return memoriaProgramas.filter(p => p.activo === 1);
}

/**
 * Obtener un programa por su ID numérico
 */
async function obtenerProgramaPorId(id) {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return null;

    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client
                .from('programas')
                .select('*')
                .eq('id', numId)
                .maybeSingle();

            if (!error && data) {
                let pensum = data.pensum;
                if (typeof pensum === 'string') {
                    try { pensum = JSON.parse(pensum); } catch(e) {}
                }
                return { ...data, pensum };
            }
        } catch (e) {
            console.warn('⚠️ Fallback a memoria al obtener programa por id:', e.message);
        }
    }

    return memoriaProgramas.find(p => p.id === numId) || null;
}

/**
 * Registrar una nueva preinscripción
 */
async function crearPreinscripcion(datos) {
    const nowIso = new Date().toISOString();
    const registro = {
        codigo_solicitud: datos.codigo_solicitud,
        cedula: datos.cedula,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        fecha_nacimiento: datos.fecha_nacimiento || null,
        genero: datos.genero || null,
        email: datos.email,
        telefono: datos.telefono,
        direccion: datos.direccion || null,
        ciudad: datos.ciudad || null,
        estado: datos.estado || null,
        universidad_egreso: datos.universidad_egreso || null,
        titulo_obtenido: datos.titulo_obtenido || null,
        anio_egreso: datos.anio_egreso && !isNaN(parseInt(datos.anio_egreso, 10)) ? parseInt(datos.anio_egreso, 10) : null,
        programa_id: parseInt(datos.programa_id, 10),
        motivacion: datos.motivacion || null,
        estado_solicitud: datos.estado_solicitud || 'pendiente',
        fecha_registro: nowIso,
        fecha_actualizacion: nowIso,
        correo_enviado: 0
    };

    const client = getSupabaseClient();
    if (client) {
        const { data, error } = await client
            .from('preinscripciones')
            .insert([registro])
            .select();

        if (error) {
            console.error('❌ Error al insertar preinscripción en Supabase:', error.message);
            throw error;
        }
        return data && data[0] ? data[0] : registro;
    }

    // Fallback en memoria
    registro.id = memoriaPreinscripciones.length + 1;
    memoriaPreinscripciones.push(registro);
    return registro;
}

/**
 * Obtener preinscripción detallada por código único
 */
async function obtenerPreinscripcionPorCodigo(codigo) {
    if (!codigo) return null;
    const cod = String(codigo).trim();

    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client
                .from('preinscripciones')
                .select('*')
                .eq('codigo_solicitud', cod)
                .maybeSingle();

            if (!error && data) {
                const prog = await obtenerProgramaPorId(data.programa_id);
                return {
                    ...data,
                    programa_nombre: prog ? prog.nombre : '',
                    programa_tipo: prog ? prog.tipo : '',
                    programa_duracion: prog ? prog.duracion : '',
                    programa_modalidad: prog ? prog.modalidad : 'Presencial',
                    programa_descripcion: prog ? prog.descripcion : ''
                };
            }
        } catch (e) {
            console.warn('⚠️ Fallback a memoria al obtener preinscripción por código:', e.message);
        }
    }

    const item = memoriaPreinscripciones.find(p => p.codigo_solicitud === cod);
    if (!item) return null;

    const prog = await obtenerProgramaPorId(item.programa_id);
    return {
        ...item,
        programa_nombre: prog ? prog.nombre : '',
        programa_tipo: prog ? prog.tipo : '',
        programa_duracion: prog ? prog.duracion : '',
        programa_modalidad: prog ? prog.modalidad : 'Presencial',
        programa_descripcion: prog ? prog.descripcion : ''
    };
}

/**
 * Obtener listado de preinscripciones con filtros (Panel Admin)
 */
async function obtenerTodasPreinscripciones(filtros = {}) {
    const client = getSupabaseClient();
    if (client) {
        try {
            let query = client.from('preinscripciones').select('*');

            if (filtros.estado) {
                query = query.eq('estado_solicitud', filtros.estado);
            }

            if (filtros.programa_id) {
                query = query.eq('programa_id', parseInt(filtros.programa_id, 10));
            }

            if (filtros.busqueda) {
                const term = String(filtros.busqueda).trim();
                query = query.or(`nombres.ilike.%${term}%,apellidos.ilike.%${term}%,cedula.ilike.%${term}%,email.ilike.%${term}%`);
            }

            query = query.order('fecha_registro', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;

            const progs = await obtenerProgramas();
            const progMap = new Map(progs.map(p => [p.id, p]));

            return (data || []).map(p => {
                const prog = progMap.get(p.programa_id);
                return {
                    ...p,
                    programa_nombre: prog ? prog.nombre : '',
                    programa_tipo: prog ? prog.tipo : ''
                };
            });
        } catch (e) {
            console.warn('⚠️ Fallback a memoria al listar preinscripciones:', e.message);
        }
    }

    // Fallback en memoria
    let lista = [...memoriaPreinscripciones];

    if (filtros.estado) {
        lista = lista.filter(p => p.estado_solicitud === filtros.estado);
    }

    if (filtros.programa_id) {
        lista = lista.filter(p => p.programa_id === parseInt(filtros.programa_id, 10));
    }

    if (filtros.busqueda) {
        const t = String(filtros.busqueda).toLowerCase();
        lista = lista.filter(p =>
            (p.nombres && p.nombres.toLowerCase().includes(t)) ||
            (p.apellidos && p.apellidos.toLowerCase().includes(t)) ||
            (p.cedula && p.cedula.toLowerCase().includes(t)) ||
            (p.email && p.email.toLowerCase().includes(t))
        );
    }

    lista.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro));

    const progs = await obtenerProgramas();
    const progMap = new Map(progs.map(p => [p.id, p]));

    return lista.map(p => {
        const prog = progMap.get(p.programa_id);
        return {
            ...p,
            programa_nombre: prog ? prog.nombre : '',
            programa_tipo: prog ? prog.tipo : ''
        };
    });
}

/**
 * Actualizar el estado de una preinscripción (Aceptar / Rechazar / Revisada)
 */
async function actualizarEstado(codigo, nuevoEstado) {
    const nowIso = new Date().toISOString();
    const client = getSupabaseClient();

    if (client) {
        const { data, error } = await client
            .from('preinscripciones')
            .update({
                estado_solicitud: nuevoEstado,
                fecha_actualizacion: nowIso
            })
            .eq('codigo_solicitud', codigo)
            .select();

        if (error) {
            console.error('❌ Error actualizando estado en Supabase:', error.message);
            throw error;
        }
        return { changes: data ? data.length : 0 };
    }

    // Fallback en memoria
    const item = memoriaPreinscripciones.find(p => p.codigo_solicitud === codigo);
    if (item) {
        item.estado_solicitud = nuevoEstado;
        item.fecha_actualizacion = nowIso;
        return { changes: 1 };
    }
    return { changes: 0 };
}

/**
 * Marcar que el correo con requisitos fue entregado
 */
async function marcarCorreoEnviado(codigo) {
    const client = getSupabaseClient();
    if (client) {
        try {
            await client
                .from('preinscripciones')
                .update({ correo_enviado: 1 })
                .eq('codigo_solicitud', codigo);
            return;
        } catch (e) {
            console.warn('⚠️ Error marcando correo en Supabase:', e.message);
        }
    }

    const item = memoriaPreinscripciones.find(p => p.codigo_solicitud === codigo);
    if (item) item.correo_enviado = 1;
}

/**
 * Obtener estadísticas globales para el panel administrativo
 */
async function obtenerEstadisticas() {
    let rows = [];
    const client = getSupabaseClient();

    if (client) {
        try {
            const { data, error } = await client
                .from('preinscripciones')
                .select('id, estado_solicitud, programa_id');

            if (!error && Array.isArray(data)) {
                rows = data;
            }
        } catch (e) {
            console.warn('⚠️ Error al consultar estadísticas en Supabase:', e.message);
        }
    }

    if (rows.length === 0 && memoriaPreinscripciones.length > 0) {
        rows = memoriaPreinscripciones;
    }

    const total = rows.length;
    const estadoMap = {};
    const progCountMap = {};

    rows.forEach(r => {
        const est = r.estado_solicitud || 'pendiente';
        estadoMap[est] = (estadoMap[est] || 0) + 1;
        const pid = r.programa_id;
        progCountMap[pid] = (progCountMap[pid] || 0) + 1;
    });

    const porEstado = Object.keys(estadoMap).map(k => ({
        estado_solicitud: k,
        total: estadoMap[k]
    }));

    const progs = await obtenerProgramas();
    const porPrograma = progs.map(p => ({
        nombre: p.nombre,
        tipo: p.tipo,
        total: progCountMap[p.id] || 0
    })).filter(p => p.total > 0).sort((a, b) => b.total - a.total);

    return {
        total,
        porEstado,
        porPrograma
    };
}

/**
 * Verifica si ya existe una preinscripción activa con esa cédula en el mismo programa
 */
async function existePreinscripcion(cedula, programaId) {
    const cleanCedula = String(cedula).trim();
    const progId = parseInt(programaId, 10);

    const client = getSupabaseClient();
    if (client) {
        try {
            const { data, error } = await client
                .from('preinscripciones')
                .select('id')
                .eq('cedula', cleanCedula)
                .eq('programa_id', progId)
                .neq('estado_solicitud', 'rechazada');

            if (!error && Array.isArray(data)) {
                return data.length > 0;
            }
        } catch (e) {
            console.warn('⚠️ Error al verificar duplicados en Supabase:', e.message);
        }
    }

    return memoriaPreinscripciones.some(p =>
        p.cedula === cleanCedula &&
        p.programa_id === progId &&
        p.estado_solicitud !== 'rechazada'
    );
}

/**
 * Eliminar una preinscripción por código
 */
async function eliminarPreinscripcion(codigo) {
    const client = getSupabaseClient();
    if (client) {
        const { data, error } = await client
            .from('preinscripciones')
            .delete()
            .eq('codigo_solicitud', codigo)
            .select();

        if (error) throw error;
        return { changes: data ? data.length : 0 };
    }

    const idx = memoriaPreinscripciones.findIndex(p => p.codigo_solicitud === codigo);
    if (idx !== -1) {
        memoriaPreinscripciones.splice(idx, 1);
        return { changes: 1 };
    }
    return { changes: 0 };
}

module.exports = {
    inicializarDB,
    getDb: getSupabaseClient,
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
