// Contenido original de demostración. No representa preguntas oficiales.
import { extraQuestions } from './demo-extra.js';
export const demoCatalog = {
  courses: [
    {
      id: 'educacion-fisica',
      title: 'Educación Física',
      description: 'Preparación de muestra para el nombramiento docente en Perú. Preguntas originales de demostración, no oficiales.',
      topics: [
        { id: 'planificacion', title: 'Planificación de la sesión', description: 'Propósitos, actividades y evaluación formativa.', questionCount: 9, audioUrl: null },
        { id: 'movimiento', title: 'Movimiento y salud', description: 'Seguridad, progresión y hábitos de actividad física.', questionCount: 9, audioUrl: null },
        { id: 'convivencia', title: 'Juego y convivencia', description: 'Participación, acuerdos e inclusión.', questionCount: 9, audioUrl: null },
      ],
    },
  ],
};

export const demoQuestions = [
  {
    id: 'demo-plan-1', topicId: 'planificacion', prompt: 'Antes de iniciar una sesión de Educación Física, ¿qué decisión ayuda más a que las actividades respondan al aprendizaje esperado?',
    options: ['Elegir el juego más popular sin revisar el propósito.', 'Definir un propósito observable y adaptar las actividades a él.', 'Repetir la sesión anterior para ahorrar tiempo.'], correctIndex: 1,
    explanation: 'Un propósito observable orienta la secuencia de actividades y permite recoger evidencias del aprendizaje.',
    optionExplanations: ['La popularidad no garantiza relación con el aprendizaje.', 'Correcta: el propósito guía actividades y evaluación.', 'Repetir una sesión no asegura que responda al grupo actual.'],
  },
  {
    id: 'demo-plan-2', topicId: 'planificacion', prompt: 'Durante una actividad de equilibrio, varios estudiantes necesitan más apoyo. ¿Qué ajuste es más útil?',
    options: ['Eliminar el reto para todo el grupo.', 'Aumentar la dificultad para terminar más rápido.', 'Ofrecer variantes con diferentes apoyos y observar el avance.'], correctIndex: 2,
    explanation: 'Las variantes permiten participar y progresar desde distintos puntos de partida; la observación aporta evidencia para orientar.',
    optionExplanations: ['Eliminar el reto impide practicar la habilidad.', 'Más dificultad no atiende la necesidad observada.', 'Correcta: ajusta el reto y observa el progreso.'],
  },
  {
    id: 'demo-plan-3', topicId: 'planificacion', prompt: '¿Cuál es un ejemplo de retroalimentación formativa después de practicar un lanzamiento?',
    options: ['“Mal, inténtalo otra vez”.', '“Sacaste ocho; seguimos”.', '“Lograste orientar el cuerpo al blanco; ahora prueba soltar la pelota un poco antes”.'], correctIndex: 2,
    explanation: 'La retroalimentación describe un logro observable y propone un siguiente paso concreto.',
    optionExplanations: ['No indica qué mejorar.', 'Solo comunica un resultado.', 'Correcta: describe el desempeño y orienta el siguiente intento.'],
  },
  {
    id: 'demo-mov-1', topicId: 'movimiento', prompt: 'En una sesión que incluye carrera y saltos, ¿qué secuencia es la más razonable?',
    options: ['Comenzar con la máxima intensidad y terminar sin pausa.', 'Activación progresiva, tarea principal y vuelta a la calma.', 'Solo estiramientos intensos antes de correr.'], correctIndex: 1,
    explanation: 'La activación progresiva prepara para la tarea y la vuelta a la calma facilita una transición ordenada al cierre.',
    optionExplanations: ['Iniciar al máximo omite la preparación gradual.', 'Correcta: organiza inicio, desarrollo y cierre.', 'No sustituye una activación gradual.'],
  },
  {
    id: 'demo-mov-2', topicId: 'movimiento', prompt: 'Un estudiante dice que siente mareo durante una actividad intensa. ¿Qué debe hacer primero el docente?',
    options: ['Pedirle que continúe para no perder el ritmo.', 'Detener su participación, llevarlo a un lugar seguro y activar el protocolo de atención.', 'Esperar al final de la clase para preguntar cómo se siente.'], correctIndex: 1,
    explanation: 'Ante una señal de malestar se prioriza la seguridad y el protocolo del centro educativo.',
    optionExplanations: ['Continuar puede agravar el malestar.', 'Correcta: detiene la actividad y busca atención según protocolo.', 'La atención no debe esperar.'],
  },
  {
    id: 'demo-mov-3', topicId: 'movimiento', prompt: '¿Qué propuesta favorece un hábito sostenible de actividad física?',
    options: ['Una rutina única e intensa para todas las personas.', 'Metas graduales y opciones que el estudiante disfrute y pueda sostener.', 'Actividad solo antes de una evaluación.'], correctIndex: 1,
    explanation: 'La progresión y el disfrute favorecen la continuidad; la propuesta debe adaptarse a la persona y su contexto.',
    optionExplanations: ['No considera diferencias individuales.', 'Correcta: combina progresión y adherencia.', 'La continuidad requiere práctica regular.'],
  },
  {
    id: 'demo-conv-1', topicId: 'convivencia', prompt: 'En un juego por equipos, dos estudiantes casi no reciben pases. ¿Qué intervención favorece la participación?',
    options: ['Mantener las reglas porque el marcador es lo principal.', 'Cambiar acuerdos de juego para distribuir oportunidades y observar la participación.', 'Retirar del juego a quienes reciben menos pases.'], correctIndex: 1,
    explanation: 'Los acuerdos pueden ajustarse para que más estudiantes tengan oportunidades reales de actuar.',
    optionExplanations: ['El resultado no justifica excluir.', 'Correcta: ajusta reglas y verifica que funcionen.', 'Retirarlos reduce aún más su participación.'],
  },
  {
    id: 'demo-conv-2', topicId: 'convivencia', prompt: '¿Qué forma de resolver una discrepancia sobre una regla promueve mejor la convivencia?',
    options: ['Dejar que el equipo más fuerte decida.', 'Escuchar las versiones, revisar el acuerdo y decidir con criterios compartidos.', 'Ignorar la discrepancia.'], correctIndex: 1,
    explanation: 'Escuchar y volver a un acuerdo conocido ayuda a resolver el conflicto de forma justa y comprensible.',
    optionExplanations: ['La fuerza deportiva no da autoridad para decidir.', 'Correcta: usa diálogo y criterios compartidos.', 'El problema seguirá afectando el juego.'],
  },
  {
    id: 'demo-conv-3', topicId: 'convivencia', prompt: 'Un estudiante necesita una variante de una actividad para participar con seguridad. ¿Qué opción se ajusta mejor a un enfoque inclusivo?',
    options: ['Excluirlo de la práctica.', 'Ofrecer una variante con el mismo propósito de aprendizaje y acordarla con él.', 'Asignarle únicamente la función de observar.'], correctIndex: 1,
    explanation: 'Una variante accesible mantiene la oportunidad de aprender y participar en la actividad.',
    optionExplanations: ['Excluye una oportunidad de aprendizaje.', 'Correcta: adapta el medio sin perder el propósito.', 'Observar puede ser útil de forma puntual, pero no sustituye siempre la participación.'],
  },
].map((question) => ({ ...question, source: 'Contenido original de demostración', year: 2026, isDemo: true }));

export const allDemoQuestions = [...demoQuestions, ...extraQuestions];
export const demoExams = [
  { id: 'demo-1', title: 'Simulacro 1 · Fundamentos', type: 'demo', durationMinutes: 8, questionIds: demoQuestions.map(question => question.id) },
  { id: 'demo-2', title: 'Simulacro 2 · Decisiones de aula', type: 'demo', durationMinutes: 8, questionIds: extraQuestions.filter(question => question.id.startsWith('demo2-')).map(question => question.id) },
  { id: 'demo-3', title: 'Simulacro 3 · Aplicación pedagógica', type: 'demo', durationMinutes: 8, questionIds: extraQuestions.filter(question => question.id.startsWith('demo3-')).map(question => question.id) },
];
