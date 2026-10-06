# Datos y acceso

## Estado de esta versión

La app funciona como **demostración local** sin Supabase. Sus nueve preguntas tienen tres alternativas (A/B/C) y son contenido original de demostración, no exámenes oficiales ni material de Edwin Requejos. El simulacro es una versión abreviada para probar el flujo, no reproduce la cantidad ni duración de la prueba oficial. El avance se guarda en `localStorage` del navegador; cambiar de navegador o borrar sus datos elimina ese avance. No hay registro ni recuperación de contraseña en modo demo.

El SQL y el adaptador de datos están preparados, pero **no se ha creado ni conectado un proyecto Supabase**. La clave publicable y la URL son las únicas variables previstas para el navegador. Nunca colocar `service_role`, secret key, contraseña de base de datos ni tokens personales en variables `VITE_`.

## Activación futura en un proyecto elegido

1. Elegir explícitamente un proyecto Supabase para esta aplicación, sin modificar los proyectos existentes por accidente.
2. Ejecutar [`supabase/schema.sql`](supabase/schema.sql) en SQL Editor de ese proyecto. Está diseñado para una sola aplicación y no debe ejecutarse en una base con tablas homónimas sin revisión previa. Crea `courses`, `topics`, `questions`, `attempts`, `topic_progress`, políticas RLS y `submit_answer`.
3. Cargar cursos, temas y preguntas mediante SQL Editor. Marcar `is_published = true` solo tras revisar contenido y fuente. `source` y `year` documentan procedencia; `is_demo` distingue muestras. El audio es opcional y `audio_url` debe apuntar a un recurso publicado con autorización.
4. Copiar `.env.example` a `.env.local`, rellenar `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` de ese proyecto. Mantener `.env.local` fuera de Git. Para GitHub Pages, configurar las mismas variables como secretos/variables del despliegue antes de construir; Vite las inserta en el JavaScript público. La clave publicable puede ser pública; la protección de datos depende de RLS.
5. En Supabase **Authentication → URL Configuration**, fijar la URL real de GitHub Pages (`https://USUARIO.github.io/REPOSITORIO/`, reemplazando ambos segmentos por los publicados) como Site URL y añadirla a Redirect URLs. Para desarrollo, añadir `http://localhost:5173/`. El adaptador usa la base de Vite para el retorno de confirmación y recuperación de contraseña.
6. Probar registro, confirmación de correo, inicio de sesión, cierre, recuperación y cambio de contraseña con dos cuentas de prueba; comprobar que cada cuenta solo lee sus intentos y progreso. Revisar Security Advisor y Data API grants antes de producción.

## Contrato del frontend

`src/data/store.js` exporta `getCatalog`, `getQuestions(topicId)`, `recordAnswer({questionId,selectedIndex,mode})`, `getProgress`, `getMistakes`, `signUp`, `signIn`, `signOut`, `resetPassword`, `updatePassword`, `getSession` e `isConfigured`. `mode` acepta `practice`, `challenge` y `mock`; `exam` de la pantalla de simulacro se normaliza a `mock`.

`getCatalog()` devuelve `{courses:[{id,title,description,topics:[{id,title,description,questionCount,audioUrl}]}]}`. Las preguntas incluyen `id`, `topicId`, `prompt`, `options`, `correctIndex`, `explanation`, `optionExplanations`, `source`, `year` e `isDemo`. `recordAnswer()` devuelve `{isCorrect,correctIndex,explanation,optionExplanations}`. `getProgress()` devuelve `{totalAnswered,correctAnswers,streak,byTopic}`. `getMistakes()` devuelve preguntas aún pendientes de corregir con `lastSelectedIndex`.

Sin configuración, las funciones de cuenta muestran un error explícito. Con Supabase, un usuario sin sesión todavía puede practicar y guarda su avance local; al iniciar sesión se usan los intentos de la cuenta. **No hay migración automática** del avance local a la cuenta.

## Seguridad y límites

Las tablas públicas solo conceden lectura de contenido publicado. `attempts` y `topic_progress` tienen RLS por `auth.uid()`, y el navegador no puede insertarlas directamente. La función pública `submit_answer` llama a una implementación privilegiada en un esquema privado; valida usuario, pregunta, alternativa y modo, y calcula la corrección en la base. Las respuestas de las preguntas publicadas están visibles para cualquier navegador que consulta el catálogo. Esta arquitectura sirve para práctica y simulacros formativos; no sirve para un examen con corrección secreta o antifraude. Ese caso requeriría una API que entregue preguntas sin clave de respuesta y controle apertura y envío del simulacro.

Fuentes verificadas el 6 de octubre de 2026: [cambio de grants de Data API](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically), [seguridad de Data API](https://supabase.com/docs/guides/api/securing-your-api), [redirects de Auth](https://supabase.com/docs/guides/auth/redirect-urls), [registro](https://supabase.com/docs/reference/javascript/auth-signup) y [recuperación](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail).
