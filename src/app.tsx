/**
 * RTG Unreal Web Viewer
 * Aplicación principal que integra el reproductor de Pixel Streaming con controles personalizados.
 */
import { h, render, Fragment } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import './index.css';

// Servicios y tipos
import { PixelStreamingService } from './pixelStreamingService.js';
import {
  ConnectionState,
  type ConnectionInfo,
  type StreamStats,
  type ToggleableElementState,
  type UnrealResponse,
} from './types.js';

// Configuración
import { config, predefinedCameras, toggleableElements } from './config.js';

// Componentes
import { ConnectionStatus } from './components/ConnectionStatus.js';
import { CameraSelector } from './components/CameraSelector.js';
import { ElementVisibility } from './components/ElementVisibility.js';
import { ActionsPanel } from './components/ActionsPanel.js';
import { ConsolePanel } from './components/ConsolePanel.js';

// Acciones predefinidas para el panel de acciones
const predefinedActions = [
  { id: 'reset', label: 'Restablecer', icon: '🔄', command: 'ActionReset' },
  { id: 'screenshot', label: 'Captura', icon: '📸', command: 'ActionScreenshot' },
  { id: 'fullscreen', label: 'Pantalla Completa', icon: '⛶', command: 'ActionFullscreen' },
  { id: 'freeze', label: 'Congelar Frame', icon: '❄️', command: 'ActionFreezeFrame' },
  { id: 'latency', label: 'Test Latencia', icon: '📡', command: 'ActionLatencyTest' },
];

export function App() {
  const serviceRef = useRef<PixelStreamingService | null>(null);
  const streamContainerRef = useRef<HTMLDivElement | null>(null);
  const videoParentRef = useRef<HTMLElement | null>(null);

  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>({
    state: ConnectionState.Disconnected,
    message: 'Sin conectar',
    reconnectAttempts: 0,
    maxReconnectAttempts: config.maxReconnectAttempts,
  });
  const [stats, setStats] = useState<StreamStats>({
    fps: 0,
    bitrate: 0,
    resolution: { width: 0, height: 0 },
    packetLoss: 0,
    latency: 0,
    codec: '',
    frameDrops: 0,
    quality: 'N/A',
  });
  const [toggleStates, setToggleStates] = useState<ToggleableElementState[]>(
    toggleableElements.map((el) => ({ ...el, visible: true }))
  );
  const [responses, setResponses] = useState<UnrealResponse[]>([]);
  const [activeCamera, setActiveCamera] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);

  // Inicializar servicio
  useEffect(() => {
    const service = new PixelStreamingService();
    serviceRef.current = service;

    // Configurar listeners
    const cleanup1 = service.onChange(() => {
      setConnectionInfo(service.connectionInfo);
    });
    const cleanup2 = service.onChange(() => {
      setStats(service.stats);
    });
    const cleanup3 = service.onChange(() => {
      setResponses(service.responses.slice(-50));
    });

    // Configurar respuestas de Unreal
    service.onResponse('cameraChanged', (data) => {
      console.log('Cámara cambiada:', data);
    });

    service.onResponse('elementToggled', (data) => {
      console.log('Elemento toggleado:', data);
    });

    service.onResponse('actionExecuted', (data) => {
      console.log('Acción ejecutada:', data);
      setBusyAction(null);
    });

    // Inicializar
    service.initialize();

    // Esperar a que se cree el video element y montarlo
    const mountTimer = setInterval(() => {
      const parent = service.getVideoElementParent();
      if (parent && streamContainerRef.current && !videoParentRef.current) {
        videoParentRef.current = parent;
        // Limpiar contenedor
        streamContainerRef.current.innerHTML = '';
        // Montar el video
        streamContainerRef.current.appendChild(parent);
        // Quitar estilos que la librería pone por defecto
        parent.style.position = 'absolute';
        parent.style.top = '0';
        parent.style.left = '0';
        parent.style.width = '100%';
        parent.style.height = '100%';
        parent.style.objectFit = 'contain';
        // Ocultar overlay
        setShowOverlay(false);
        clearInterval(mountTimer);
      }
    }, 200);

    // Cleanup
    return () => {
      clearInterval(mountTimer);
      cleanup1();
      cleanup2();
      cleanup3();
      service.disconnect();
    };
  }, []);

  // Handlers
  const handleConnect = useCallback(() => {
    serviceRef.current?.connect();
  }, []);

  const handleDisconnect = useCallback(() => {
    serviceRef.current?.disconnect();
  }, []);

  const handleCameraSelect = useCallback(
    (cameraId: string, command: string) => {
      serviceRef.current?.sendUIInteraction({
        name: 'cameraSelect',
        data: JSON.stringify({ id: cameraId, command }),
      });
      setActiveCamera(cameraId);
    },
    []
  );

  const handleElementToggle = useCallback(
    (elementId: string) => {
      setToggleStates((prev) => {
        const newState = !prev.find((e) => e.id === elementId)?.visible;
        serviceRef.current?.sendUIInteraction({
          name: 'elementToggle',
          data: JSON.stringify({ id: elementId, visible: newState }),
        });
        return prev.map((e) => (e.id === elementId ? { ...e, visible: newState } : e));
      });
    },
    []
  );

  const handleAction = useCallback(
    (actionId: string, command: string) => {
      setBusyAction(actionId);

      switch (actionId) {
        case 'reset':
          serviceRef.current?.sendUIInteraction({
            name: 'actionReset',
            data: JSON.stringify({ action: 'reset' }),
          });
          break;

        case 'screenshot':
          serviceRef.current?.sendUIInteraction({
            name: 'actionScreenshot',
            data: JSON.stringify({ action: 'screenshot' }),
          });
          break;

        case 'fullscreen':
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
          break;

        case 'freeze':
          serviceRef.current?.sendUIInteraction({
            name: 'actionFreezeFrame',
            data: JSON.stringify({ action: 'freezeFrame' }),
          });
          break;

        case 'latency':
          serviceRef.current?.requestLatencyTest();
          break;

        default:
          serviceRef.current?.sendUIInteraction({
            name: 'customAction',
            data: JSON.stringify({ action: command }),
          });
      }

      // Reset busy después de un tiempo
      setTimeout(() => setBusyAction(null), 2000);
    },
    []
  );

  const handleLatencyTest = useCallback(() => {
    serviceRef.current?.requestLatencyTest();
  }, []);

  const handleShowFps = useCallback(() => {
    serviceRef.current?.requestShowFps();
  }, []);

  const handleIframe = useCallback(() => {
    serviceRef.current?.requestIframe();
  }, []);

  const handleClearConsole = useCallback(() => {
    setResponses([]);
  }, []);

  const formatBitrate = useCallback((kbps: number): string => {
    if (kbps >= 1000) return `${(kbps / 1000).toFixed(1)} Mbps`;
    return `${kbps} kbps`;
  }, []);

  const stateLabels: Record<ConnectionState, string> = {
    [ConnectionState.Disconnected]: 'Desconectado',
    [ConnectionState.Connecting]: 'Conectando...',
    [ConnectionState.Connected]: 'Conectado',
    [ConnectionState.Playing]: 'En vivo',
    [ConnectionState.Error]: 'Error',
    [ConnectionState.Reconnecting]: 'Reconectando...',
  };

  const isPlaying = connectionInfo.state === ConnectionState.Playing;
  const isConnected =
    connectionInfo.state === ConnectionState.Connected ||
    connectionInfo.state === ConnectionState.Playing;
  const isConnecting =
    connectionInfo.state === ConnectionState.Connecting ||
    connectionInfo.state === ConnectionState.Reconnecting;

  return (
    <div id="app">
      <div class="app-layout">
        {/* Stream container */}
        <div class="stream-container" ref={streamContainerRef}>
          {/* Overlay cuando no está reproduciendo */}
          {showOverlay && (
            <div class="stream-overlay">
              <div class="stream-logo">RTG</div>
              <div class="loading-text">{connectionInfo.message}</div>
              {connectionInfo.state === ConnectionState.Connected && (
                <button
                  class="btn btn-primary mt-16"
                  onClick={() => serviceRef.current?.play()}
                >
                  ▶ Reproducir
                </button>
              )}
            </div>
          )}

          {/* Stats overlay (esquina superior izquierda) */}
          {isPlaying && (
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 20,
                background: 'rgba(10, 10, 15, 0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: '#e0e0e8',
                display: 'flex',
                gap: '16px',
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  color: stats.fps >= 30 ? '#00e676' : '#ffc107',
                }}
              >
                {stats.fps} FPS
              </span>
              <span
                style={{
                  color: stats.latency < 100 ? '#00e676' : '#ffc107',
                }}
              >
                {stats.latency}ms
              </span>
              <span>
                {stats.bitrate > 0 ? `${(stats.bitrate / 1000).toFixed(1)} Mbps` : '—'}
              </span>
              <span>{stats.codec || '—'}</span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div class={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
          {/* Sidebar header */}
          <div class="sidebar-header">
            <div class="sidebar-title">
              <span class="logo-small">RTG</span>
              <span>Unreal Viewer</span>
            </div>
            <button class="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ✕
            </button>
          </div>

          {/* Sidebar content */}
          <div class="sidebar-content">
            {/* Connection section */}
            <div class="section">
              <ConnectionStatus
                info={connectionInfo}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>

            {/* Camera section */}
            <div class="section">
              <div class="section-header">
                <span class="section-title">📷 Cámaras</span>
              </div>
              <CameraSelector
                activeCamera={activeCamera}
                onSelect={handleCameraSelect}
                disabled={!isConnected || isConnecting}
              />
            </div>

            {/* Toggle elements section */}
            <div class="section">
              <div class="section-header">
                <span class="section-title">🏗️ Elementos</span>
              </div>
              <ElementVisibility
                elements={toggleStates}
                onToggle={handleElementToggle}
                disabled={!isConnected || isConnecting}
              />
            </div>

            {/* Actions section */}
            <div class="section">
              <div class="section-header">
                <span class="section-title">⚡ Acciones</span>
              </div>
              <ActionsPanel
                onAction={handleAction}
                disabled={!isConnected || isConnecting}
                busyAction={busyAction}
              />
            </div>

            {/* Stats section */}
            <div class="section">
              <div class="section-header">
                <span class="section-title">📊 Estadísticas</span>
                <button
                  class="btn btn-sm btn-secondary"
                  onClick={() => setConsoleOpen(!consoleOpen)}
                >
                  {consoleOpen ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="label">FPS</div>
                  <div
                    class={`value ${stats.fps >= 50 ? 'success' : stats.fps >= 30 ? '' : 'warning'}`}
                  >
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
                  <div
                    class={`value ${stats.latency < 50 ? 'success' : stats.latency < 100 ? '' : 'warning'}`}
                  >
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
                  <div class="value" style={{ fontSize: '12px' }}>{stats.quality}</div>
                </div>
                <div class="stat-card">
                  <div class="label">Frames perdidos</div>
                  <div class={`value ${stats.frameDrops === 0 ? 'success' : 'warning'}`}>
                    {stats.frameDrops}
                  </div>
                </div>
              </div>
              <div class="btn-group mt-12">
                <button
                  class="btn btn-sm btn-secondary"
                  onClick={handleLatencyTest}
                  disabled={!isConnected || isConnecting}
                >
                  📡 Latencia
                </button>
                <button
                  class="btn btn-sm btn-secondary"
                  onClick={handleShowFps}
                  disabled={!isConnected || isConnecting}
                >
                  📊 FPS
                </button>
                <button
                  class="btn btn-sm btn-secondary"
                  onClick={handleIframe}
                  disabled={!isConnected || isConnecting}
                >
                  🖼️ Frame
                </button>
              </div>
            </div>

            {/* Console section */}
            {consoleOpen && (
              <div class="section">
                <div class="section-header">
                  <span class="section-title">💬 Respuestas de Unreal</span>
                </div>
                <ConsolePanel responses={responses} onClear={handleClearConsole} />
              </div>
            )}
          </div>
        </div>

        {/* Float toggle button (when sidebar is collapsed) */}
        {!sidebarOpen && (
          <button class="sidebar-float-toggle" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
        )}
      </div>
    </div>
  );
}
