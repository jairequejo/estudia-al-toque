# Educación Física · Edwin Requejo

Prototipo de preparación para el nombramiento docente en Educación Física en Perú. La identidad visual y el nombre público siguen en revisión.

## Estado

- Funciona como **demo local** con 27 preguntas originales y tres simulacros de nueve preguntas cada uno. No son preguntas oficiales ni material proporcionado o revisado por Edwin Requejo.
- La práctica, los retos, los repasos espaciados por tema y los simulacros usan datos de demostración. El avance se guarda en el navegador con `localStorage`.
- La PWA permite consultar e instalar nuevas versiones desde Configuración. La lectura automática de preguntas está activada por defecto y usa las voces disponibles en el dispositivo.
- Los avisos de repaso requieren permiso del navegador y funcionan mientras la app está abierta. Para enviar avisos con la app cerrada falta un servicio de push.
- El acceso por correo y la sincronización entre dispositivos requieren conectar un proyecto Supabase elegido para esta aplicación. No están activos en esta demo.
- No hay audios cargados todavía. Cada tema admite una URL de audio cuando exista contenido autorizado.

## Ejecutar

Requiere Node.js 20.19 o posterior.

```bash
npm ci
npm run dev
```

Abrir la URL local que muestre Vite. Para crear archivos estáticos, ejecutar `npm run build`; el resultado queda en `dist/`. La opción `base: './'` permite alojarlos bajo una ruta como GitHub Pages cuando se acuerden el nombre y repositorio finales.

## Comprobar

```bash
node --test src/data/store.test.mjs
npm run build
```

## Datos y futura conexión

[`BACKEND.md`](BACKEND.md) documenta el contrato de datos, el esquema SQL, las políticas RLS, la configuración de Auth y las limitaciones. No se debe usar material de terceros ni marcar contenido como revisado por Edwin sin confirmación.

[`FUENTES_EXAMENES.md`](FUENTES_EXAMENES.md) reúne cuadernillos y claves oficiales de Minedu para Educación Física (2024, 2022 y prueba excepcional de 2023). Son enlaces de referencia; sus preguntas no están copiadas en la demo.

El código está organizado en HTML, CSS y JavaScript sin framework de interfaz. `src/main.js` contiene la experiencia de usuario; `src/data/store.js` decide entre datos demo y Supabase; `src/data/demo.js` guarda las preguntas de muestra; `supabase/schema.sql` prepara el modelo para cursos, temas, preguntas, intentos y progreso.
