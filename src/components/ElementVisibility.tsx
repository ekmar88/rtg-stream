/**
 * Componente: ElementVisibility
 * Permite mostrar/ocultar elementos del escenario.
 */
import type { FunctionalComponent } from 'preact';
import { toggleableElements } from '../config.js';
import { type ToggleableElementState } from '../types.js';

interface Props {
  elements: ToggleableElementState[];
  onToggle: (elementId: string) => void;
  disabled: boolean;
}

export const ElementVisibility: FunctionalComponent<Props> = ({
  elements,
  onToggle,
  disabled,
}) => {
  return (
    <div class="toggle-list">
      {toggleableElements.map((element) => {
        const state = elements.find((e) => e.id === element.id);
        const isVisible = state?.visible ?? false;

        return (
          <div class="toggle-item" key={element.id}>
            <div class="toggle-item-info">
              <span class="toggle-item-icon">{element.icon}</span>
              <span>{element.label}</span>
            </div>
            <label class="toggle-switch">
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => onToggle(element.id)}
                disabled={disabled}
              />
              <span class="toggle-slider" />
            </label>
          </div>
        );
      })}
    </div>
  );
};
