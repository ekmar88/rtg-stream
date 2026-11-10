/**
 * Configuración de conexión y comportamiento de la aplicación.
 * Modifica estos valores según tu entorno de despliegue.
 */

export const config = {
  /**
   * URL del servidor de señalización de Pixel Streaming.
   * Formato: ws://host:port o wss://host:port
   * Puerto por defecto: 8888 (servidor de señalización de Pixel Streaming)
   */
  signallingServerUrl: 'ws://127.0.0.1:8889',

  /**
   * ID del streamer a conectar (vacío = primer streamer disponible).
   */
  streamerId: '',

  /**
   * Resolución preferida del viewport en Unreal.
   */
  viewportWidth: 1920,
  viewportHeight: 1080,

  /**
   * Escala de resolución (0.1 a 1.0).
   */
  resolutionScale: 1.0,

  /**
   * Codec preferido: 'auto', 'VP8', 'VP9', 'H264'.
   */
  preferredCodec: 'auto',

  /**
   * Reproducir vídeo automáticamente al conectar.
   */
  autoplay: true,

  /**
   * Conectar automáticamente al cargar la página.
   */
  autoConnect: true,

  /**
   * Silenciar el vídeo por defecto.
   */
  muted: true,

  /**
   * Usar micrófono del cliente.
   */
  useMic: false,

  /**
   * Usar cámara del cliente.
   */
  useCamera: false,

  /**
   * Intentar reconexión automática.
   */
  autoReconnect: true,

  /**
   * Número máximo de intentos de reconexión (0 = infinito).
   */
  maxReconnectAttempts: 10,

  /**
   * Intervalo en ms entre intentos de reconexión.
   */
  reconnectIntervalMs: 3000,

  /**
   * Tiempo en segundos de inactividad antes de AFK.
   */
  afkTimeoutSecs: 300,

  /**
   *scheme de control del ratón: 'locked' (bloqueado) o 'hovering' (flotante).
   */
  controlScheme: 'locked' as 'locked' | 'hovering',

  /**
   * Modo pantalla completa al reproducir.
   */
  fullscreenOnPlay: false,

  /**
   * STUN servers para acceso desde internet.
   */
  stunServers: [] as string[],

  /**
   * TURN server para acceso desde internet (fallback).
   */
  turnServer: undefined,
};

/**
 * Vistas de cámara predefinidas que se pueden solicitar a Unreal.
 * Cada vista tiene un nombre para mostrar y un comando/interacción para enviar.
 */
export const predefinedCameras = [
  { id: 'viewport', label: 'Viewport', command: 'Viewport' },
  { id: 'overview', label: 'Vista General', command: 'CameraOverview' },
  { id: 'front', label: 'Vista Frontal', command: 'CameraFront' },
  { id: 'back', label: 'Vista Trasera', command: 'CameraBack' },
  { id: 'left', label: 'Vista Izquierda', command: 'CameraLeft' },
  { id: 'right', label: 'Vista Derecha', command: 'CameraRight' },
  { id: 'top', label: 'Vista Aérea', command: 'CameraTop' },
  { id: 'closeup', label: 'Primer Plano', command: 'CameraCloseUp' },
] as const;

/**
 * Elementos del escenario que se pueden mostrar/ocultar.
 */
export const toggleableElements = [
  { id: 'lights', label: 'Iluminación', icon: '💡' },
  { id: 'decorations', label: 'Decoraciones', icon: '🏗️' },
  { id: 'particles', label: 'Partículas', icon: '✨' },
  { id: 'ui_hud', label: 'HUD', icon: '📊' },
  { id: 'grid', label: 'Cuadrícula', icon: '📐' },
  { id: 'gaussiansplats', label: 'Gaussian Splat', icon: '🎨' },
] as const;

/**
 * Acciones predefinidas que se pueden enviar a Unreal.
 */
export const predefinedActions = [
  { id: 'reset', label: 'Restablecer', icon: '🔄', command: 'ActionReset' },
  { id: 'screenshot', label: 'Captura', icon: '📸', command: 'ActionScreenshot' },
  { id: 'fullscreen', label: 'Pantalla Completa', icon: '⛶', command: 'ActionFullscreen' },
  { id: 'freeze', label: 'Congelar Frame', icon: '❄️', command: 'ActionFreezeFrame' },
  { id: 'latency', label: 'Test Latencia', icon: '📡', command: 'ActionLatencyTest' },
] as const;
