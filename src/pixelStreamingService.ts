/**
 * Servicio central de Pixel Streaming.
 * Gestiona la conexión, reconexión y eventos del stream.
 */
import {
  Config,
  Flags,
  NumericParameters,
  TextParameters,
  OptionParameters,
  PixelStreaming,
  WebRtcPlayerController,
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.6';
import {
  ConnectionState,
  type ConnectionInfo,
  type StreamStats,
  type UnrealResponse,
} from './types.js';
import { config } from './config.js';

export class PixelStreamingService {
  private _pixelStreaming: PixelStreaming | null = null;
  private _webRtcController: WebRtcPlayerController | null = null;
  private _statsTimer: ReturnType<typeof setInterval> | null = null;
  private _currentState: ConnectionState = ConnectionState.Disconnected;
  private _connectionInfo: ConnectionInfo = {
    state: ConnectionState.Disconnected,
    message: 'Desconectado',
    reconnectAttempts: 0,
    maxReconnectAttempts: config.maxReconnectAttempts,
  };
  private _stats: StreamStats = {
    fps: 0,
    bitrate: 0,
    resolution: { width: 0, height: 0 },
    packetLoss: 0,
    latency: 0,
    codec: '',
    frameDrops: 0,
    quality: 'N/A',
  };
  private _responses: UnrealResponse[] = [];
  private _listeners: Set<() => void> = new Set();

  /**
   * Inicializa y configura el objeto PixelStreaming.
   */
  initialize(): void {
    // Crear configuración
    const cfg = new Config({
      useUrlParams: false,
    });

    // Configurar servidor de señalización
    if (config.signallingServerUrl) {
      cfg.setTextSetting(TextParameters.SignallingServerUrl, config.signallingServerUrl);
    }

    // Configurar flags
    // IMPORTANTE: Desactivamos AutoConnect aquí porque lo manejamos manualmente
    // para evitar carreras de procesos con el WebSocket
    cfg.setFlagEnabled(Flags.AutoConnect, false);
    cfg.setFlagEnabled(Flags.AutoPlayVideo, config.autoplay);
    cfg.setFlagEnabled(Flags.StartVideoMuted, config.muted);
    cfg.setFlagEnabled(Flags.UseMic, config.useMic);
    cfg.setFlagEnabled(Flags.UseCamera, config.useCamera);
    cfg.setFlagEnabled(Flags.SuppressBrowserKeys, false);
    cfg.setFlagEnabled(Flags.MouseInput, true);
    cfg.setFlagEnabled(Flags.KeyboardInput, true);
    cfg.setFlagEnabled(Flags.TouchInput, true);

    // Configurar parámetros numéricos
    cfg.setNumericSetting(NumericParameters.AFKTimeoutSecs, config.afkTimeoutSecs);
    cfg.setNumericSetting(NumericParameters.MaxReconnectAttempts, config.maxReconnectAttempts);

    // Configurar codec preferido
    if (config.preferredCodec !== 'auto') {
      cfg.setOptionSettingValue(OptionParameters.PreferredCodec, config.preferredCodec);
    }

    // Configurar resolución
    cfg.setNumericSetting(NumericParameters.ViewportResScale, config.resolutionScale);

    try {
      // Crear objeto PixelStreaming
      this._pixelStreaming = new PixelStreaming(cfg);
      this._webRtcController = this._pixelStreaming.webRtcController;

      this._setupEventListeners();
      this._setupResponseListeners();

      // Conectar con un pequeño delay para asegurar que todo está inicializado
      if (config.autoConnect) {
        setTimeout(() => {
          this.connect();
        }, 500);
      }
    } catch (error) {
      console.error('Error al inicializar PixelStreaming:', error);
      this._setState(ConnectionState.Error, 'Error al inicializar el reproductor');
    }
  }

  /**
   * Configura los listeners de eventos del stream.
   */
  private _setupEventListeners(): void {
    if (!this._pixelStreaming) return;

    // Conexión
    this._pixelStreaming.addEventListener('webRtcConnecting', () => {
      this._setState(ConnectionState.Connecting, 'Conectando al servidor...');
    });

    this._pixelStreaming.addEventListener('webRtcConnected', () => {
      this._setState(ConnectionState.Connected, 'Conectado. Iniciando stream...');
      // Start polling stats immediately when connected
      console.log('[PixelStreaming] webRtcConnected - starting stats polling');
      if (this._statsTimer) clearInterval(this._statsTimer);
      this._statsTimer = setInterval(() => {
        this._pollStats();
      }, 1000);
    });

    this._pixelStreaming.addEventListener('webRtcFailed', () => {
      this._setState(ConnectionState.Error, 'Error de conexión. Verifica la URL del servidor.');
    });

    // Video
    this._pixelStreaming.addEventListener('videoInitialized', () => {
      this._setState(ConnectionState.Playing, 'Stream en reproducción');
    });

    // Desconexión
    this._pixelStreaming.addEventListener('webRtcDisconnected', () => {
      if (config.autoReconnect) {
        this._setState(ConnectionState.Reconnecting, 'Reconectando...');
        this.reconnect();
      } else {
        this._setState(ConnectionState.Disconnected, 'Desconectado');
      }
    });

    // Estadísticas
    this._pixelStreaming.addEventListener('statsReceived', (event: Event) => {
      console.log('[PixelStreaming] ✅ statsReceived event triggered!');
      console.log('[PixelStreaming] Event:', event);
      console.log('[PixelStreaming] Event type:', (event as CustomEvent).type);
      console.log('[PixelStreaming] Event detail:', (event as CustomEvent).detail);
      
      // Try to get stats directly from WebRTC
      if (this._webRtcController) {
        this._pollStats();
      }
    });

    // Debug: videoInitialized
    this._pixelStreaming.addEventListener('videoInitialized', () => {
      console.log('[PixelStreaming] ✅ videoInitialized - stream should be active');
      if (this._statsTimer) clearInterval(this._statsTimer);
      this._statsTimer = setInterval(() => {
        this._pollStats();
      }, 1000);
    });

    // playStream event
    this._pixelStreaming.addEventListener('playStream', () => {
      console.log('[PixelStreaming] ✅ playStream event');
      if (this._statsTimer) clearInterval(this._statsTimer);
      this._statsTimer = setInterval(() => {
        this._pollStats();
      }, 1000);
    });

    // Latencia
    this._pixelStreaming.addEventListener('latencyCalculated', (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail) {
        // LatencyInfo tiene varios campos, usamos el más completo (E2E)
        // o fallback a RTT
        const latencyInfo = detail as Record<string, unknown>;
        const e2e = latencyInfo.averageE2ELatency;
        const rtt = latencyInfo.rttMs;
        const processing = latencyInfo.averageProcessingDelayMs;
        const jitter = latencyInfo.averageJitterBufferDelayMs;

        // Sumamos los componentes para obtener la latencia total estimada
        if (e2e !== undefined && e2e !== null) {
          this._stats.latency = Math.round(Number(e2e));
        } else if (rtt !== undefined && rtt !== null) {
          this._stats.latency = Math.round(Number(rtt));
        } else if (processing !== undefined && processing !== null) {
          this._stats.latency = Math.round(Number(processing));
        } else if (jitter !== undefined && jitter !== null) {
          this._stats.latency = Math.round(Number(jitter));
        }

        this._notifyListeners();
      }
    });

    // QP (calidad)
    this._pixelStreaming.addEventListener('videoEncoderAvgQP', (event: Event) => {
      const qp = (event as CustomEvent).detail;
      this._stats.quality =
        qp !== null && qp !== undefined ? `QP ${qp}` : 'N/A';
      this._notifyListeners();
    });
  }

  /**
   * Configura los listeners de respuestas desde Unreal.
   */
  private _setupResponseListeners(): void {
    if (!this._pixelStreaming) return;

    // Listener genérico para respuestas
    this._pixelStreaming.addResponseEventListener('response', (data: string) => {
      this._responses.push({
        name: 'response',
        data,
        timestamp: Date.now(),
      });
      if (this._responses.length > 50) {
        this._responses = this._responses.slice(-50);
      }
      this._notifyListeners();
    });
  }

  /**
   * Actualiza las estadísticas del stream.
   */
  private _updateStats(statsRaw: unknown): void {
    if (!statsRaw || typeof statsRaw !== 'object') {
      console.log('[PixelStreaming] _updateStats: invalid data', statsRaw);
      return;
    }

    const s = statsRaw as Record<string, unknown>;
    console.log('[PixelStreaming] _updateStats keys:', Object.keys(s));
    console.log('[PixelStreaming] inboundVideoStats:', s.inboundVideoStats);
    console.log('[PixelStreaming] streamStats:', s.streamStats);
    console.log('[PixelStreaming] codecs:', s.codecs);

    // La librería devuelve un objeto con la estructura de AggregatedStats
    // Las estadísticas están anidadas en inboundVideoStats, streamStats, etc.
    const video = s.inboundVideoStats as Record<string, unknown> | undefined;
    const stream = s.streamStats as Record<string, unknown> | undefined;
    const codecs = s.codecs as Map<string, unknown> | undefined;

    console.log('[PixelStreaming] video object:', video);
    console.log('[PixelStreaming] codecs type:', typeof codecs, codecs instanceof Map);

    // FPS (de inboundVideoStats)
    if (video && video.framesPerSecond !== undefined && video.framesPerSecond !== null) {
      this._stats.fps = Math.round(Number(video.framesPerSecond));
      console.log('[PixelStreaming] FPS set to:', this._stats.fps);
    }

    // Bitrate (de inboundVideoStats)
    if (video && video.bitrate !== undefined && video.bitrate !== null) {
      this._stats.bitrate = Math.round(Number(video.bitrate));
      console.log('[PixelStreaming] bitrate set to:', this._stats.bitrate);
    }

    // Resolución (de inboundVideoStats)
    if (video && video.frameWidth !== undefined && video.frameHeight !== undefined) {
      this._stats.resolution = {
        width: Number(video.frameWidth),
        height: Number(video.frameHeight),
      };
      console.log('[PixelStreaming] resolution set to:', this._stats.resolution);
    }

    // Packet loss (de inboundVideoStats)
    if (video && video.packetsLost !== undefined) {
      const packetsReceived = Number(video.packetsReceived) || 1;
      const packetsLost = Number(video.packetsLost) || 0;
      this._stats.packetLoss = Math.round((packetsLost / packetsReceived) * 100);
    }

    // Codec (de codecs map)
    if (codecs instanceof Map && codecs.size > 0) {
      const firstCodec = codecs.values().next().value as Record<string, unknown>;
      if (firstCodec && firstCodec.mimeType) {
        const mimeType = firstCodec.mimeType as string;
        const codecName = mimeType.split('/').pop() || mimeType;
        this._stats.codec = codecName;
        console.log('[PixelStreaming] codec set to:', this._stats.codec);
      }
    }

    // Frame drops (de inboundVideoStats)
    if (video && video.framesDropped !== undefined && video.framesDropped !== null) {
      this._stats.frameDrops = Number(video.framesDropped);
    }

    // QP (de inboundVideoStats)
    if (video && video.qpsum !== undefined && video.framesDecoded !== undefined) {
      const qpsum = Number(video.qpsum) || 0;
      const framesDecoded = Number(video.framesDecoded) || 1;
      const avgQP = Math.round(qpsum / framesDecoded);
      this._stats.quality = `QP ${avgQP}`;
    }

    console.log('[PixelStreaming] Final stats:', this._stats);
    this._notifyListeners();
  }

  /**
   * Polling directo de WebRTC stats.
   */
  private _pollStats(): void {
    if (!this._webRtcController) {
      console.log('[PixelStreaming] No WebRtcController');
      return;
    }

    try {
      const peer = this._webRtcController.peerConnectionController.peerConnection;
      if (!peer) {
        console.log('[PixelStreaming] No peer connection');
        return;
      }

      peer.getStats(null).then((report: RTCStatsReport) => {
        console.log('[PixelStreaming] WebRTC getStats report:', report);
        
        let fps = 0;
        let bitrate = 0;
        let width = 0;
        let height = 0;
        let packetsLost = 0;
        let packetsReceived = 0;
        let codec = '';
        let framesDropped = 0;

        report.forEach((stat) => {
          console.log(`[PixelStreaming] stat: ${stat.type} - ${stat.id}`);
          
          if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
            fps = stat.framesPerSecond || 0;
            bitrate = stat.bytesReceived ? Math.round((stat.bytesReceived * 8) / 1000) : 0;
            width = stat.frameWidth || 0;
            height = stat.frameHeight || 0;
            packetsLost = stat.packetsLost || 0;
            packetsReceived = stat.packetsReceived || 0;
            framesDropped = stat.framesDropped || 0;
            if (stat.codecId) {
              console.log('[PixelStreaming] codecId:', stat.codecId);
            }
          }
          
          if (stat.type === 'codec') {
            codec = stat.mimeType || '';
          }
        });

        if (packetsReceived > 0) {
          this._stats.packetLoss = Math.round((packetsLost / packetsReceived) * 100);
        }

        // Extract codec name from mimeType like "video/VP8"
        if (codec) {
          this._stats.codec = codec.split('/').pop() || codec;
        }

        this._stats.fps = Math.round(fps);
        this._stats.bitrate = bitrate;
        this._stats.resolution = { width, height };
        this._stats.frameDrops = framesDropped;

        console.log('[PixelStreaming] Polled stats:', this._stats);
        this._notifyListeners();
      }).catch((err: unknown) => {
        console.log('[PixelStreaming] getStats error:', err);
      });
    } catch (e) {
      console.log('[PixelStreaming] Poll error:', e);
    }
  }

  /**
   * Establece el estado de conexión.
   */
  private _setState(state: ConnectionState, message: string): void {
    this._currentState = state;
    this._connectionInfo = {
      ...this._connectionInfo,
      state,
      message,
    };
    this._notifyListeners();
  }

  /**
   * Conecta al servidor de señalización.
   */
  connect(): void {
    if (!this._pixelStreaming) {
      console.error('PixelStreaming no inicializado');
      this._setState(ConnectionState.Error, 'Error: servicio no inicializado');
      return;
    }

    try {
      this._pixelStreaming.connect();
    } catch (error) {
      console.error('Error al conectar:', error);
      this._setState(
        ConnectionState.Error,
        'Error de conexión. Verifica que Unreal esté ejecutándose.'
      );
    }
  }

  /**
   * Reconecta al servidor.
   */
  reconnect(): void {
    this._pixelStreaming?.reconnect();
  }

  /**
   * Desconecta del servidor.
   */
  disconnect(): void {
    if (this._statsTimer) {
      clearInterval(this._statsTimer);
      this._statsTimer = null;
    }
    this._pixelStreaming?.disconnect();
  }

  /**
   * Inicia la reproducción del stream.
   */
  play(): void {
    this._pixelStreaming?.play();
  }

  /**
   * Envía una interacción UI a Unreal.
   */
  sendUIInteraction(descriptor: object | string): boolean {
    return this._pixelStreaming?.emitUIInteraction(descriptor) ?? false;
  }

  /**
   * Envía un comando a Unreal.
   */
  sendCommand(descriptor: object): boolean {
    return this._pixelStreaming?.emitCommand(descriptor) ?? false;
  }

  /**
   * Envía un comando de consola a Unreal.
   */
  sendConsoleCommand(command: string): boolean {
    return this._pixelStreaming?.emitConsoleCommand(command) ?? false;
  }

  /**
   * Solicita una prueba de latencia.
   */
  requestLatencyTest(): boolean {
    return this._pixelStreaming?.requestLatencyTest() ?? false;
  }

  /**
   * Solicita un iframe a Unreal.
   */
  requestIframe(): boolean {
    return this._pixelStreaming?.requestIframe() ?? false;
  }

  /**
   * Muestra el contador FPS en Unreal.
   */
  requestShowFps(): boolean {
    return this._pixelStreaming?.requestShowFps() ?? false;
  }

  /**
   * Envía un mensaje personalizado a Unreal.
   */
  sendMessage(name: string, data: string | number | object): boolean {
    if (!this._pixelStreaming) return false;

    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    return this._pixelStreaming.emitUIInteraction({
      name,
      data: payload,
    });
  }

  /**
   * Solicita la lista de cámaras disponibles al servidor.
   */
  async requestCameraList(): Promise<string[]> {
    // Wilbur tiene una API REST para listar streamers y cámaras
    // Pero como tenemos REST API desactivada, usamos el data channel
    // Alternativa: retornar cámaras por defecto
    console.log('[PixelStreaming] requestCameraList - usando cámaras por defecto');
    return [];
  }

  /**
   * Registra un handler para respuestas de Unreal.
   */
  onResponse(name: string, handler: (data: string) => void): void {
    this._pixelStreaming?.addResponseEventListener(name, handler);
  }

  /**
   * Obtiene el elemento DOM del video player.
   */
  getVideoElementParent(): HTMLElement | null {
    return this._pixelStreaming?.videoElementParent ?? null;
  }

  /**
   * Obtiene el controlador WebRTC.
   */
  getWebRtcController(): WebRtcPlayerController | null {
    return this._webRtcController;
  }

  /**
   * Registra un listener para cambios de estado.
   */
  onChange(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Notifica a todos los listeners.
   */
  private _notifyListeners(): void {
    for (const listener of this._listeners) {
      try {
        listener();
      } catch (e) {
        console.error('Error in state change listener:', e);
      }
    }
  }

  // Getters públicos
  get state(): ConnectionState {
    return this._currentState;
  }

  get connectionInfo(): ConnectionInfo {
    return this._connectionInfo;
  }

  get stats(): StreamStats {
    return this._stats;
  }

  get responses(): UnrealResponse[] {
    return this._responses;
  }

  get isConnected(): boolean {
    return [
      ConnectionState.Connected,
      ConnectionState.Playing,
    ].includes(this._currentState);
  }

  get isPlaying(): boolean {
    return this._currentState === ConnectionState.Playing;
  }
}
