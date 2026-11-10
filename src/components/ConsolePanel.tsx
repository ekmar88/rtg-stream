/**
 * Componente: ConsolePanel
 * Muestra respuestas enviadas desde Unreal Engine.
 */
import type { FunctionalComponent } from 'preact';
import { type UnrealResponse } from '../types.js';

interface Props {
  responses: UnrealResponse[];
  onClear: () => void;
}

export const ConsolePanel: FunctionalComponent<Props> = ({ responses, onClear }) => {
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div>
      <div class="console">
        {responses.length === 0 ? (
          <div class="text-muted text-center" style={{ padding: '12px', fontSize: '12px' }}>
            Sin respuestas aún
          </div>
        ) : (
          responses.map((resp) => (
            <div class="console-entry" key={resp.timestamp}>
              <span class="console-time">{formatTime(resp.timestamp)}</span>
              <span class="console-msg">{resp.data}</span>
            </div>
          ))
        )}
      </div>
      <button
        class="btn btn-sm btn-secondary console-clear"
        onClick={onClear}
        style={{ width: '100%' }}
      >
        Limpiar consola
      </button>
    </div>
  );
};
