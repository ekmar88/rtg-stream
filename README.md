# RTG Unreal Web Viewer

Aplicación web para explorar y controlar escenarios de Unreal Engine de forma remota mediante **Pixel Streaming**. El usuario accede desde un navegador a una interfaz con una vista interactiva del escenario y controles para cambiar cámaras, recorrer el espacio, mostrar u ocultar elementos y ejecutar acciones preparadas en Unreal.

## 🚀 Características

- **Conexión en tiempo real** vía WebRTC con Pixel Streaming
- **Navegación** por el escenario con ratón y teclado
- **Cámaras predefinidas** seleccionables desde la interfaz web
- **Control de visibilidad** de elementos del escenario (iluminación, partículas, etc.)
- **Acciones predefinidas** (reset, captura, pantalla completa, etc.)
- **Panel de estadísticas** en tiempo real (FPS, bitrate, latencia, codec)
- **Reconexión automática** con gestión de intentos
- **Interfaz responsive** con sidebar colapsable
- **Consola de respuestas** para debug y comunicación con Unreal

## 📋 Requisitos

### Servidor (Unreal Engine)

- **Unreal Engine 5.5+** con plugin Pixel Streaming habilitado
- Escena empaquetada con capacidad de recibir comandos via Data Channel
- GPU compatible con codificador hardware (NVIDIA NVENC, AMD AMF, Intel QSV)

### Infraestructura

- **Node.js** 18+ para el servidor de señalización
- **Pixel Streaming Infrastructure** (versión compatible con tu UE)
- Servidor con GPU para ejecutar Unreal

### Cliente

- Navegador moderno con soporte WebRTC:
  - Chrome/Edge 90+
  - Firefox 90+
  - Safari 15+ (con limitaciones)

## 🛠️ Instalación

### 1. Instalar dependencias del frontend

```bash
npm install
```

### 2. Configurar Pixel Streaming Infrastructure

Descarga la infraestructura compatible con tu versión de Unreal Engine:

```bash
# Para UE 5.6
git clone https://github.com/EpicGames/PixelStreamingInfrastructure.git
cd PixelStreamingInfrastructure/WebServer
npm install
```

### 3. Configurar la conexión

Edita `src/config.ts` para ajustar la URL del servidor de señalización:

```typescript
export const config = {
  signallingServerUrl: 'ws://tu-servidor:8080',
  // ... resto de config
};
```

## ▶️ Ejecución

### Modo desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

### Modo producción

```bash
npm run build
npm run preview
```

## 📁 Estructura del proyecto

```
rtg-stream/
├── src/
│   ├── components/           # Componentes Preact
│   │   ├── ConnectionStatus.tsx
│   │   ├── CameraSelector.tsx
│   │   ├── ElementVisibility.tsx
│   │   ├── ActionsPanel.tsx
│   │   ├── StatsDisplay.tsx
│   │   └── ConsolePanel.tsx
│   ├── config.ts             # Configuración de la app
│   ├── types.ts              # Definiciones de tipos
│   ├── pixelStreamingService.ts  # Servicio central de Pixel Streaming
│   ├── app.tsx               # Componente principal
│   ├── main.tsx              # Punto de entrada
│   └── index.css             # Estilos globales
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔌 Comunicación con Unreal Engine

### Enviar comandos desde el navegador

La aplicación envía mensajes JSON vía Data Channel a Unreal. El formato es:

```json
{
  "name": "cameraSelect",
  "data": "{\"id\":\"overview\",\"command\":\"CameraOverview\"}"
}
```

### Recibir respuestas de Unreal

Unreal puede enviar respuestas que se muestran en la consola del sidebar. Registra handlers:

```typescript
service.onResponse('cameraChanged', (data) => {
  console.log('Cámara:', data);
});
```

### Blueprints recomendados en Unreal

Para que los controles funcionen, necesitas en tu escena:

1. **PixelStreamingInputComponent** o un Blueprint que escuche mensajes del Data Channel
2. **Eventos para cambiar cámaras** al recibir `cameraSelect`
3. **Eventos para toggle de visibilidad** al recibir `elementToggle`
4. **Eventos para acciones** al recibir `actionReset`, `actionScreenshot`, etc.

Ejemplo de lógica en Blueprint:

```
Data Channel Message → Parse JSON → Check "name" → Execute Action
                       "cameraSelect" → Set Camera Location/Rotation
                       "elementToggle" → Set Actor Visibility
                       "actionReset" → Reset Scene State
```

## 🌐 Despliegue en red

### Acceso local

Por defecto, la aplicación funciona en la misma red LAN. Configura:

```typescript
signallingServerUrl: 'ws://192.168.1.100:8080'
```

### Acceso desde internet

1. **HTTPS**: Configura certificados SSL en el servidor de señalización
2. **STUN/TURN**: Añade servidores STUN/TURN en la configuración:

```typescript
stunServers: ['stun:stun.l.google.com:19302'],
turnServer: {
  url: 'turn:tu-servidor:3478',
  username: 'usuario',
  credential: 'contraseña'
}
```

## 📊 Estadísticas

La aplicación muestra en tiempo real:

| Métrica | Descripción |
|---------|-------------|
| FPS | Frames por segundo del stream |
| Bitrate | Ancho de banda utilizado |
| Resolución | Resolución del viewport de Unreal |
| Latencia | Latencia total de la conexión |
| Pérdida | Porcentaje de paquetes perdidos |
| Codec | Codec de video utilizado |
| Calidad | QP del encoder (menor = mejor) |
| Frames perdidos | Frames dropados por el cliente |

## 🔧 Configuración avanzada

### Resolución del viewport

```typescript
viewportWidth: 1920,
viewportHeight: 1080,
resolutionScale: 1.0,  // 0.1 a 1.0
```

### Codec preferido

```typescript
preferredCodec: 'auto',  // 'VP8', 'VP9', 'H264', 'auto'
```

### Reconexión

```typescript
autoReconnect: true,
maxReconnectAttempts: 10,  // 0 = infinito
reconnectIntervalMs: 3000,
```

### Controles

```typescript
controlScheme: 'locked',  // 'locked' (FPS) o 'hovering' (puntero libre)
```

## 📝 Notas importantes

1. **Plugin Gaussian Splat**: Verifica que el plugin sea compatible con builds empaquetados antes de integrar tu escena real.

2. **Dimensionamiento del servidor**: Un stream en 1080p/60fps requiere aproximadamente 4-8 Mbps de ancho de banda por usuario. Una GPU RTX 3080 puede manejar ~4-8 streams simultáneos con NVENC.

3. **Latencia**: En LAN, la latencia típica es de 16-50ms. En WAN con TURN, puede subir a 100-300ms.

4. **Múltiples usuarios**: Si cada usuario necesita una cámara independiente, necesitará sesiones separadas (instancias de Unreal o SFU con múltiples streams).

## 📄 Licencia

Este proyecto se distribuye como parte del flujo de trabajo de Unreal Pixel Streaming.

## 🔗 Recursos

- [Documentación Pixel Streaming - Epic Games](https://unrealengine.com/marketplace/en-US/item/pixel-streaming)
- [GitHub - Pixel Streaming Infrastructure](https://github.com/EpicGames/PixelStreamingInfrastructure)
- [GitHub - Pixel Streaming Frontend](https://github.com/EpicGames/PixelStreamingFrontend)
- [Comunidad Unreal Engine](https://forums.unrealengine.com/)
