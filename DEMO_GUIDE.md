# Guía de Demostración: PyCRM SaaS Enterprise

Este documento detalla el guion y los pasos técnicos para realizar el video de demostración de 3 minutos para el proyecto PyCRM.

## 1. Introducción (0:00 - 0:45)
*   **Contexto**: Presenta PyCRM como una solución SaaS multi-tenant diseñada para empresas modernas.
*   **Stack Tecnológico**: Menciona Node.js, TypeScript, PostgreSQL (Prisma), Redis (BullMQ) y React con Vite.
*   **Seguridad**: Destaca el aislamiento de datos por inquilino (Multi-tenancy isolation) y la autenticación robusta (MFA/2FA).

## 2. Flujo de Usuario y Multi-Tenant (0:45 - 1:30)
*   **Registro**: Crea una nueva "Organización" (Tenant). Explica cómo esto crea un entorno aislado en la base de datos.
*   **Aislamiento**: Muestra que los datos de un tenant no son visibles desde otro.
*   **Dashboard**: Enseña los indicadores clave de rendimiento (KPIs) generados en tiempo real.

## 3. Funcionalidades Enterprise (1:30 - 2:30)
*   **Pipeline de Ventas**: Muestra el drag-and-drop de oportunidades. Destaca la puntuación de probabilidad (AI-powered status).
*   **Gestión de Clientes**: Muestra la vista de clientes y la línea de tiempo de comunicación.
*   **Seguridad y Auditoría**: Muestra la sección de Configuración donde se puede activar el MFA o ver los logs de auditoría.
*   **Generación de Informes**: Genera un PDF profesional del pipeline de ventas.

## 4. Arquitectura y Conclusión (2:30 - 3:00)
*   **Infraestructura**: Menciona el despliegue en Render (Backend + DB) y Vercel (Frontend).
*   **Escalabilidad**: Explica el uso de Redis para colas de trabajo y caché de telemetría.
*   **Cierre**: "PyCRM es una solución robusta, segura y lista para producción".

---

## checklist de Despliegue Final

### Backend (Render)
1.  Conectar el repo de GitHub.
2.  Configurar variables de entorno:
    *   `DATABASE_URL`: URL de PostgreSQL.
    *   `REDIS_URL`: URL de Redis.
    *   `JWT_SECRET`: Una cadena aleatoria segura.
    *   `FRONTEND_URL`: La URL que te proporcione Vercel.

### Frontend (Vercel)
1.  Conectar el subdirectorio `frontend`.
2.  Configurar variables de entorno:
    *   `VITE_API_URL`: La URL que te proporcione Render (ej: `https://pycrm-backend.onrender.com/api`).
