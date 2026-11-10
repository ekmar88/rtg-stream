/**
 * Componente: CameraSelector
 * Permite seleccionar vistas de cámara predefinidas.
 */
import type { FunctionalComponent } from 'preact';
import { predefinedCameras } from '../config.js';

interface Props {
  activeCamera: string | null;
  onSelect: (cameraId: string, command: string) => void;
  disabled: boolean;
}

export const CameraSelector: FunctionalComponent<Props> = ({
  activeCamera,
  onSelect,
  disabled,
}) => {
  return (
    <div>
      <div class="grid-buttons">
        {predefinedCameras.map((camera) => (
          <button
            class={`grid-button ${activeCamera === camera.id ? 'active' : ''}`}
            onClick={() => onSelect(camera.id, camera.command)}
            disabled={disabled}
            title={camera.label}
          >
            <span class="icon">📷</span>
            <span class="label">{camera.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
