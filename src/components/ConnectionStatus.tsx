/**
 * Componente: ConnectionStatus
 * Muestra el estado de conexión y botones de control.
 */
import type { FunctionalComponent } from 'preact';
import { ConnectionState, type ConnectionInfo } from '../types.js';

interface Props {
  info: ConnectionInfo;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ConnectionStatus: FunctionalComponent<Props> = ({
  info,
  onConnect,
  onDisconnect,
}) => {
  const stateLabels: Record<ConnectionState, string> = {
    [ConnectionState.Disconnected]: 'Desconectado',
    [ConnectionState.Connecting]: 'Conectando...',
    [ConnectionState.Connected]: 'Conectado',
    [ConnectionState.Playing]: 'En vivo',
    [ConnectionState.Error]: 'Error',
    [ConnectionState.Reconnecting]: 'Reconectando...',
  };

  return (
    <div class={`connection-status ${info.state}`}>
      <span class="status-dot" />
      <span class="status-text">{stateLabels[info.state]}</span>
      <span class="text-muted" style={{ fontSize: '11px' }}>{info.message}</span>
      <div class="status-actions">
        {info.state === ConnectionState.Disconnected && (
          <button class="btn btn-sm btn-primary" onClick={onConnect}>
            Conectar
          </button>
        )}
        {info.state === ConnectionState.Error && (
          <button class="btn btn-sm btn-primary" onClick={onConnect}>
            Reintentar
          </button>
        )}
        {info.state === ConnectionState.Reconnecting && (
          <button class="btn btn-sm btn-secondary" onClick={onDisconnect}>
            Cancelar
          </button>
        )}
        {(info.state === ConnectionState.Connected ||
          info.state === ConnectionState.Playing) && (
          <button class="btn btn-sm btn-danger" onClick={onDisconnect}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
