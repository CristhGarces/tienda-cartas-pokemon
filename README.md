# Tienda de Cartas Pokémon
Programación para Dispositivos Móviles II · UNIAJC · S841A · Grupo 4

## Autoría y propósito
- Integrantes: Cristhian Garces, Jhojan Carabali y Juan Camilo Caicedo.
- Usuario y tarea principal: coleccionista que explora un catálogo de 1000 cartas ficticias, reúne favoritas y las ve en 3D con el sensor.
- Alcance actual: catálogo adaptativo (1, 2 o 3 columnas), favoritas con persistencia, botón "Limpiar favoritas", carta 3D con acelerómetro y asistente de IA local.

## Versión que se presenta
- Etiqueta: `v4-limpiar` (anterior: `v3-sombra`). Visible en pantalla como "Versión: v4-limpiar".
- Fecha de comprobación: 18 de noviembre de 2026.
- Archivo de entrada: `App.jsx`.
- Plataformas: Motorola edge 60 pro con Expo Go (Android) y navegador web.

## Entorno utilizado
- Node v26.8.1 y npm.
- Expo ~57.0.23 (SDK 57), React Native 0.86.3, React 19.2.3.
- Cliente: Expo Go y navegador.
- Dependencias: expo-sensors, @react-native-async-storage/async-storage. Sin variables de entorno ni servicios con clave.
- Las imágenes se cargan de PokeAPI, por lo que se necesita internet.

## Cómo abrirlo
1. Clonar `https://github.com/CristhGarces/tienda-cartas-pokemon` y entrar a la carpeta.
2. Instalar dependencias: `npm install`.
3. Ejecutar `npx expo start`.
4. Celular: abrir Expo Go y escanear el QR (celular y computador en la misma red). Web: pulsar `w` en la terminal.
5. El recorrido inicia en la pestaña Adaptativa; los datos ficticios se generan al abrir la app.

## Recorrido de demostración
- Estado inicial: 1000 cartas, 0 favoritas.
- Pasos: marcar 3 favoritas, ir a Sensores, inclinar el teléfono, cerrar y reabrir.
- Resultado: contador en 3, miniaturas con nombre y carta 3D que se inclina.
- Alternativa: "Limpiar favoritas" deja el contador en 0 con el mensaje "Favoritas restablecidas".
- Reinicio: botón "Limpiar favoritas".

## Estado de las funciones
| Función | Estado | Evidencia o limitación |
|---|---|---|
| Favoritas con selección múltiple | Implementado | Cumple en celular y web (v4). |
| Persistencia (AsyncStorage) | Implementado | Cumple en v3 y verificado de nuevo en v4. |
| Limpiar favoritas | Implementado | Cumple en celular y web (v4). |
| Columnas adaptativas | Implementado | 1 columna en celular, 3 en web ancho. |
| Sensor real (carta 3D) | Implementado | Cumple en Android (v3). Web usa simulación. Permiso denegado: no probado. |
| Asistente IA | Implementado (didáctico) | Clasificador 1-NN de 3 intenciones; puede equivocarse. |
| iOS y tableta física | No probado | Sin dispositivo disponible. |
| Carrito y compra | Pendiente | No existe. |

## Pendientes
Ver la sección 8 del documento de entrega (responsables: Cristhian, Jhojan y Juan Camilo, tres cada uno).

## Entrega
Se conservan `package.json` y el archivo de bloqueo. Se excluyen `node_modules` y secretos. El QR de Expo no es un enlace permanente ni sustituye el código.
