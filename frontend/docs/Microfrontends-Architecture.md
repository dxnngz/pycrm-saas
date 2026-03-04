# Architecture Proposal: Micro-Frontends via Module Federation

A medida que el ecosistema SaaS Enterprise de PyCRM crece, el monolito Frontend (actualmente montado en Vite/React) comenzará a sufrir de tiempos de build extendidos y dependencias cruzadas entre equipos.

Para la Fase 4, proponemos la transición hacia una arquitectura de **Micro-Frontends** utilizando **Webpack 5 Module Federation** o el plugin equivalente de Vite (`@originjs/vite-plugin-federation`).

## Objetivos del Diseño MFE (Micro-Frontend)
1. **Despliegues Independientes:** El equipo de "Facturación" puede desplegar `DocumentsView` sin requerir que toda la plataforma se recompile.
2. **Aislamiento de Errores:** Sub-aplicaciones que crashean no derribarán el Shell principal (App.tsx).
3. **Escalabilidad de Equipos:** Múltiples squads pueden trabajar en sus propios sub-directorios/repos con su propio ciclo CI/CD.

## Estructura Propuesta

- **Host (Shell Layer):** `App.tsx`, `Sidebar`, Autenticación (`AuthContext`), y Ruteo. Comparte librerías Core como `react`, `react-dom`, `framer-motion` y Zustand.
- **Remote 1 (CRM Core):** `ContactsView`, `PipelineView`.
- **Remote 2 (Operaciones):** `TasksView`, `CalendarView`.
- **Remote 3 (Finanzas):** `DocumentsView`, `ProductsView`.

## Roadmap de Implementación

### Fase 1: Desacople en Monorepo (Actual)
- Hemos implementado **Code Splitting estricto** (`React.lazy`). Todas las vistas están desacopladas en tiempo de ejecución. Esta fase ya está completada.
- Hemos centralizado la instancia HTTP (`api.ts`).

### Fase 2: Configuración del Host (Shell)
- Instalar el plugin de Federation.
- Modificar `vite.config.ts` en el Host para consumir componentes remotos:
```javascript
import federation from '@originjs/vite-plugin-federation'

export default {
  plugins: [
    federation({
      name: 'host-app',
      remotes: {
        crmCore: 'http://crm-core-service/assets/remoteEntry.js',
        opsApp: 'http://ops-service/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom']
    })
  ]
}
```

### Fase 3: Exposición de Remotos
- Los sub-módulos configuran sus propios `vite.config.ts` para exponer sus rutas principales y empaquetarlas como librerías estáticas:
```javascript
export default {
  plugins: [
    federation({
      name: 'crmCore',
      filename: 'remoteEntry.js',
      exposes: {
        './Pipeline': './src/components/Pipeline/PipelineView.tsx',
      },
      shared: ['react', 'react-dom']
    })
  ]
}
```

## Consideraciones Críticas
- **Manejo de Tensión Multi-Tenant:** El Host pasará el contexto (JWT, RBAC roles, Theme) a los remotos a través del Context API, que será tratado como una dependencia singleton compartida.
- **Estado Global:** Minimalismo extremo. Usar Custom Events (`window.dispatchEvent`) o un Bus de Eventos ligero en lugar de acoplar remotos al store global de Zustand del Host.
