import React from 'react';
import Modal from './Modal';

interface Shortcut {
  keys: string;
  description: string;
}

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const shortcuts: Shortcut[] = [
    { keys: 'Ctrl/Cmd + K', description: 'Abrir búsqueda rápida (centro de comandos)' },
    { keys: '?', description: 'Abrir esta ayuda de atajos' },
    { keys: 'G, D', description: 'Ir al panel' },
    { keys: 'G, C', description: 'Ir a clientes' },
    { keys: 'G, P', description: 'Ir al pipeline' },
    { keys: 'G, T', description: 'Ir a tareas' },
    { keys: 'G, A', description: 'Ir a agenda' },
    { keys: 'G, S', description: 'Ir a ajustes' },
    { keys: 'Esc', description: 'Cerrar overlays (menú móvil, modales)' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Atajos de teclado" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="text-sm text-surface-muted">
          Atajos disponibles para moverte más rápido por la app.
        </div>
        <div className="divide-y divide-surface-border rounded-lg border border-surface-border overflow-hidden">
          {shortcuts.map((s) => (
            <div key={s.keys} className="flex items-center justify-between gap-4 p-3 bg-surface-card">
              <div className="text-[11px] font-bold text-surface-text">{s.description}</div>
              <div className="flex items-center gap-1">
                {s.keys.split(',').map((k) => (
                  <span
                    key={k.trim()}
                    className="px-2 py-1 rounded-md bg-surface-muted-bg border border-surface-border text-[10px] font-black text-surface-muted"
                  >
                    {k.trim()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

