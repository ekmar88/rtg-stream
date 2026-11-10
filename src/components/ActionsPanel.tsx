/**
 * Componente: ActionsPanel
 * Panel de acciones predefinidas (reset, captura, pantalla completa, etc.).
 */
import type { FunctionalComponent } from 'preact';
import { predefinedActions } from '../config.js';

interface Props {
  onAction: (actionId: string, command: string) => void;
  disabled: boolean;
  busyAction: string | null;
}

export const ActionsPanel: FunctionalComponent<Props> = ({
  onAction,
  disabled,
  busyAction,
}) => {
  return (
    <div class="grid-buttons cols-3">
      {predefinedActions.map((action) => (
        <button
          class={`grid-button ${busyAction === action.id ? 'active' : ''}`}
          onClick={() => onAction(action.id, action.command)}
          disabled={disabled || busyAction !== null}
          title={action.label}
        >
          <span class="icon">{action.icon}</span>
          <span class="label">{action.label}</span>
        </button>
      ))}
    </div>
  );
};
