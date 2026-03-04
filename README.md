# PyCRM Enterprise AI

PyCRM es un moderno CRM (Customer Relationship Management) diseñado bajo el concepto "Enterprise", con una arquitectura en capas, máxima tipificación, rendimiento dinámico mediado por React y Framer Motion, y robustez en el backend mediante Express, PostgreSQL y Zod.

## 🌟 Arquitectura del Proyecto

El sistema está dividido en dos grandes bloques utilizando una arquitectura orientada a servicios (SOA) y modularización Clean Architecture:

### Backend (Node.js + Express + PostgreSQL)
1. **Routes Layer**: Enrutador principal de la API RESTful.
2. **Controllers Layer**: Responsables de la interacción HTTP y orquestación de la respuesta global, pero sin tener control sobre el dominio de datos.
3. **Services Layer**: Concentra la lógica de negocio y se comuica directamente de forma asíncrona con la base de datos PostgreSQL parametrizando queries para evitar inyecciones SQL.
4. **Middlewares Glogales**:
   - `errorHandler`: Un sistema global de monitoreo asíncrono que captura cualquier error y lanza una respuesta uniforme al cliente.
   - `validate`: Implementación del esquema integral de **Zod** para validar el 100% del tráfico entrante.
   - Capa de Seguridad: **Helmet** (Cabeceras protectivas) y **Rate Limiting** (Anti fuerza bruta/Spam).

### Frontend (React + Vite + Tailwind CSS + TypeScript)
1. **Componentes Puros & Enterprise UX**: Interfaces ultrarrápidas y premium apoyándose en Framer Motion y Tailwind CSS v4 para ofrecer sombras dinámicas, glassmorphism e hiper-reactividad.
2. **Sistema de Diseño Consistente**: Soporte nativo y exhaustivo para "Dark Mode" con contrastes calculados, estados interactivos (Hover/Disabled) y Empty States ilustrados orientados a conversión.
3. **Rendimiento Reactivo**: Componentes virtualizados (Skeletons inmersivos), prevención de *Layout Shifts*, y refactorización orientada a la eficiencia del DOM bajo carga intensiva de datos (Kanban, Calendario).
4. **Manejo de Estados y Errores**:
   - `AuthContext`: Administra globalmente la sesión y autenticación del sistema mediante React Context.
   - `<ErrorBoundary>`: Cualquier excepción de renderizado no rompe el árbol virtual; se intercepta en una interfaz amigable que previene una pantalla en blanco.
   - Pila de Notificaciones Asíncronas nativas mediante `sonner`, con protección anti-doble clic (`isSubmitting`).

---

## 🚀 Despliegue en Producción (Launch Ready)

PyCRM está configurado para un despliegue seguro y escalable mediante contenedores.

### Configuración de Entorno
Crea un archivo `.env` en el directorio `backend` con las siguientes variables:
- `PORT`: Puerto de escucha (default: 3001).
- `DB_HOST`: Host de la base de datos (usar `db` si es Docker).
- `JWT_SECRET`: CLAVE SECRETA CRITICAL (Obligatoria en producción).
- `FRONTEND_URL`: URL de tu frontend para configuración de CORS.

### Ejecución Integral
Para arrancar todo el ecosistema (DB, API, WEB):
```bash
docker-compose up -d --build
```

### Optimización y Rendimiento
- **Índices SQL**: El sistema autogenera índices en campos críticos para búsquedas de alta velocidad.
- **Validación Estricta**: Zod garantiza la integridad del 100% de los datos de entrada.
- **Seguridad**: Implementación de Helmet, Rate Limiting y CORS dinámico.

---
© 2024 PyCRM Enterprise | Desarrollado con excelencia técnica.

