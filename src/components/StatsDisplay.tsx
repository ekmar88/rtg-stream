/**
 * Componente: StatsDisplay
 * Muestra estadísticas del stream en tiempo real.
 */
import type { FunctionalComponent } from 'preact';
import { type StreamStats } from '../types.js';

interface Props {
  stats: StreamStats;
  onLatencyTest: () => void;
  onShowFps: () => void;
  onIframe: () => void;
  disabled: boolean;
}

export const StatsDisplay: FunctionalComponent<Props> = ({
  stats,
  onLatencyTest,
  onShowFps,
  onIframe,
  disabled,
}) => {
  const formatBitrate = (kbps: number): string => {
    if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
    return `${kbps} kbps`;
  };

  return (
    <div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">FPS</div>
          <div class={`value ${stats.fps >= 50 ? 'success' : stats.fps >= 30 ? '' : 'warning'}`}>
            {stats.fps}
          </div>
        </div>
        <div class="stat-card">
          <div class="label">Bitrate</div>
          <div class="value accent">{formatBitrate(stats.bitrate)}</div>
        </div>
        <div class="stat-card">
          <div class="label">Resolución</div>
          <div class="value" style={{ fontSize: '13px' }}>
            {stats.resolution.width}×{stats.resolution.height}
          </div>
        </div>
        <div class="stat-card">
          <div class="label">Latencia</div>
          <div class={`value ${stats.latency < 50 ? 'success' : stats.latency < 100 ? '' : 'warning'}`}>
            {stats.latency}ms
          </div>
        </div>
        <div class="stat-card">
          <div class="label">Pérdida</div>
          <div class={`value ${stats.packetLoss === 0 ? 'success' : 'error'}`}>
            {stats.packetLoss}%
          </div>
        </div>
        <div class="stat-card">
          <div class="label">Codec</div>
          <div class="value" style={{ fontSize: '12px' }}>
            {stats.codec || '—'}
          </div>
        </div>
        <div class="stat-card">
          <div class="label">Calidad</div>
          <div class="value" style={{ fontSize: '12px' }}>
            {stats.quality}
          </div>
        </div>
        <div class="stat-card">
          <div class="label">Frames perdidos</div>
          <div class={`value ${stats.frameDrops === 0 ? 'success' : 'warning'}`}>
            {stats.frameDrops}
          </div>
        </div>
      </div>

      <div class="btn-group mt-12">
        <button class="btn btn-sm btn-secondary" onClick={onLatencyTest} disabled={disabled}>
          📡 Latencia
        </button>
        <button class="btn btn-sm btn-secondary" onClick={onShowFps} disabled={disabled}>
          📊 FPS
        </button>
        <button class="btn btn-sm btn-secondary" onClick={onIframe} disabled={disabled}>
          🖼️ Frame
        </button>
      </div>
    </div>
  );
};
