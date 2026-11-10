/**
 * Tipos para la aplicación RTG Unreal Web Viewer.
 */

/**
 * Estados de conexión posibles.
 */
export enum ConnectionState {
  /** No conectado ni intentando conectar */
  Disconnected = 'disconnected',
  /** Intentando conectar al servidor de señalización */
  Connecting = 'connecting',
  /** Conectado al servidor pero esperando stream */
  Connected = 'connected',
  /** Stream en reproducción */
  Playing = 'playing',
  /** Error en la conexión */
  Error = 'error',
  /** Reconectando */
  Reconnecting = 'reconnecting',
}

/**
 * Información de estado de la conexión.
 */
export interface ConnectionInfo {
  state: ConnectionState;
  message: string;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  streamerId?: string;
}

/**
 * Estado de las estadísticas del stream.
 */
export interface StreamStats {
  fps: number;
  bitrate: number;
  resolution: { width: number; height: number };
  packetLoss: number;
  latency: number;
  codec: string;
  frameDrops: number;
  quality: string;
}

/**
 * Estado de un elemento toggleable.
 */
export interface ToggleableElementState {
  id: string;
  label: string;
  icon: string;
  visible: boolean;
}

/**
 * Estado de una cámara predefinida.
 */
export interface CameraState {
  id: string;
  label: string;
  command: string;
  active: boolean;
}

/**
 * Estado de una acción predefinida.
 */
export interface ActionState {
  id: string;
  label: string;
  icon: string;
  command: string;
  busy?: boolean;
}

/**
 * Evento de respuesta desde Unreal.
 */
export interface UnrealResponse {
  name: string;
  data: string;
  timestamp: number;
}

/**
 * Tema visual de la aplicación.
 */
export type Theme = 'dark' | 'light';

/**
 * Interfaz para los controles del video player.
 */
export interface VideoPlayerControls {
  play: () => void;
  pause: () => void;
  toggleFullscreen: () => void;
  toggleMute: () => void;
  reconnect: () => void;
  disconnect: () => void;
  sendCommand: (command: string) => boolean;
  sendUIInteraction: (descriptor: object | string) => boolean;
  requestLatencyTest: () => boolean;
  requestIframe: () => boolean;
  requestShowFps: () => boolean;
}
