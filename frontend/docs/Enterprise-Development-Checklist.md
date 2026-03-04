# Enterprise Frontend Development Checklist

Este documento establece el estándar de ingeniería para la creación de nuevas vistas o módulos dentro del Frontend de PyCRM SaaS. Todo nuevo PR (Pull Request) debe cumplir con estos requisitos.

## 1. Arquitectura y Code Splitting
- [ ] **Lazy Loading:** El componente principal de la vista debe exportarse por defecto y ser importado dinámica (`React.lazy`) en `App.tsx`.
- [ ] **Suspense Boundary:** Debe estar envuelto en un `<Suspense>` con un Skeleton de carga representativo de su estructura (no un simple spinner).
- [ ] **Prefetching:** Añadir la ruta al `prefetchView` en `App.tsx` para precargar el JS chunk al hacer hover sobre el menú de navegación.

## 2. Prevención y Aislamiento Multi-Tenant
- [ ] **NO exponer Tenant ID:** Bajo ninguna circunstancia se debe enviar el `tenant_id` manualmente en el payload hacia el backend. El interceptor y el JWT Backend se encargan de esta seguridad.
- [ ] **Limpieza de URL:** Los queries de filtrado de URL no deben exponer IDs internos descifrables relacionados con la lógica de base de datos multi-tenant.

## 3. Performance y Memoización
- [ ] **React.memo:** Si la vista itera sobre listas largas (ej. filas de clientes, tarjetas de pipeline), el sub-componente iterado debe estar memoizado con `memo()`.
- [ ] **useCallback/useMemo:** Todas las funciones que se pasen como props a componentes hijos memoizados deben envolverse en `useCallback`. Los cálculos derivados de estado deben usar `useMemo`.
- [ ] **FPS Monitor:** Para vistas críticas o complejas (como Dashboards o Pipelines), incluir el hook `useFPSMonitor('NombreVista', 40)` para enviar telemetría RUM si los FPS caen de 40.

## 4. Observabilidad y Caching (Stale-While-Revalidate)
- [ ] **SWR UI:** No debe haber bloqueos (pantallas blancas) al recargar datos secundarios. Usar un indicador visual sutil (como opacidad o borde especial) y actualizar la UI en segundo plano.
- [ ] **Cache de API:** Reutilizar la caché global de `api.ts` o Zustand para lecturas constantes con TTL dinámico.
- [ ] **X-Request-ID:** Asegurar que los endpoints relevantes capturan y transmiten los Trace IDs en el backend interceptor para correlación cruzada en caso de errores en consola.

## 5. UI/UX y Seguridad Visual (RBAC)
- [ ] **Checkeos Visuales:** Deshabilitar visualmente o eliminar por completo los botones destructivos (Delete, Update) si el usuario actual no posee el rol adecuado comprobado vía el hook `usePermissions()`.
- [ ] **Empty States:** Toda tabla o lista vacía debe contar con un `EmptyState` gráfico Premium con su respectiva justificación visual.
- [ ] **Sanitización (XSS):** Todo input de tipo "richtext" o string largo que modifique el DOM directamente (`dangerouslySetInnerHTML`) debe pasar por un wrapper de purificación estricto (DOMPurify).
