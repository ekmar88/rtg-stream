# 📷 Configuración de Cámaras en Unreal Engine 5.7

## ¿Por qué no funcionan los botones de cámara?

Los botones envían comandos a Unreal, pero **Unreal necesita tener Camera Actors configurados** para reconocerlos.

## Flujo de funcionamiento

```
Navegador (click en "Vista General")
    ↓
Envía: { name: "cameraSelect", data: { id: "overview", command: "Switch" } }
    ↓
Unreal recibe el mensaje
    ↓
Busca un Camera Actor llamado "overview"
    ↓
Si existe → Cambia a esa cámara ✅
Si no existe → No pasa nada ❌
```

## 🔧 Pasos para configurar en Unreal

### 1. Crear Camera Actors

En tu escena de Unreal:

1. **Place Actor** → Busca **CameraActor**
2. Colócalo en la posición que quieras
3. Renómbralo a un ID de tu `config.ts`:
   - `overview` (Vista General)
   - `front` (Vista Frontal)
   - `back` (Vista Trasera)
   - `left` (Vista Izquierda)
   - `right` (Vista Derecha)
   - `top` (Vista Aérea)
   - `closeup` (Primer Plano)

### 2. Configurar Pixel Streaming en cada cámara

En el **Details panel** de cada Camera Actor:

1. Busca la sección **Pixel Streaming**
2. Activa **Capture Video** ✅
3. (Opcional) Configura resolución y bitrate

### 3. Verificar

Cuando conectes desde el navegador y hagas click en una cámara:
- Deberías ver el cambio de vista en el stream
- La consola del navegador mostrará: `[PixelStreaming] Cámara cambiada: { ... }`

## 🎯 Alternativa: Usar el sistema de presets de Unreal

Si no quieres crear Camera Actors manualmente:

1. En Unreal, ve a **Window → Pixel Streaming → Camera Presets**
2. Crea presets con las vistas que quieras
3. Los presets se exportan automáticamente y la app los detectará

## 🔍 Debug

Para verificar que las cámaras se están enviando correctamente:

1. Abre la consola del navegador (F12)
2. Haz click en un botón de cámara
3. Deberías ver:
   ```
   Cámara cambiada: { id: "overview", command: "Switch" }
   ```

Si no ves nada, el mensaje no está llegando a Unreal.

## 📋 Resumen de IDs de cámaras

| ID en config.ts | Nombre en Unreal | Botón en la app |
|-----------------|------------------|-----------------|
| `overview` | CameraActor llamado "overview" | Vista General |
| `front` | CameraActor llamado "front" | Vista Frontal |
| `back` | CameraActor llamado "back" | Vista Trasera |
| `left` | CameraActor llamado "left" | Vista Izquierda |
| `right` | CameraActor llamado "right" | Vista Derecha |
| `top` | CameraActor llamado "top" | Vista Aérea |
| `closeup` | CameraActor llamado "closeup" | Primer Plano |
