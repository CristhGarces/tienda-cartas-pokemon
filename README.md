# Tienda de Cartas Pokémon
Programación para Dispositivos Móviles II · UNIAJC · S841A · Grupo 4

## Autoría y propósito
- Integrantes: Cristhian Garces, Jhojan Carabali y Juan Camilo Caicedo.
- Usuario y tarea principal: coleccionista que explora un catálogo de 1000 cartas ficticias, busca por nombre, reúne favoritas, las ve en 3D con el sensor y arma un carrito de compra simulado.
- Alcance actual: catálogo adaptativo (1, 2 o 3 columnas), búsqueda por nombre, favoritas con persistencia y confirmación al limpiarlas, carrito simulado con total, carta 3D con acelerómetro y asistente de IA local.

## Versión que se presenta
- Etiqueta: `v5-final` (anterior: `v4-limpiar`). Visible en pantalla como "Versión: v5-final".
- Fecha de comprobación: _completar después de probar en celular y en web._
- Archivo de entrada: `App.js` (registrado desde `index.js`).
- Plataformas: Motorola edge 60 pro con Expo Go (Android) y navegador web.
- Las pantallas Original y Optimizada se eliminaron en esta versión: la app queda con las pestañas Adaptativa, Sensores y Carrito.

## Entorno utilizado
- Node v26.8.1 y npm.
- Expo ~57.0.23 (SDK 57), React Native 0.86.3, React 19.2.3.
- Cliente: Expo Go y navegador.
- Dependencias: expo-sensors, @react-native-async-storage/async-storage. Sin variables de entorno ni servicios con clave.
- Las imágenes se cargan de PokeAPI, por lo que se necesita internet.

## Cómo abrirlo
1. Clonar `https://github.com/CristhGarces/tienda-cartas-pokemon` y entrar a la carpeta.
2. Instalar dependencias: `npm install`.
3. Ejecutar `npx expo start` (si se ven datos viejos, `npx expo start -c`).
4. Celular: abrir Expo Go y escanear el QR (celular y computador en la misma red; si no conecta, `npx expo start --tunnel`). Web: pulsar `w` en la terminal.
5. El recorrido inicia en la pestaña Adaptativa; los datos ficticios se generan al abrir la app.

## Recorrido de demostración
- Estado inicial: 1000 cartas, 0 favoritas, carrito vacío.
- Pasos: buscar una carta por nombre, marcar 3 favoritas, agregar 2 cartas al carrito y finalizar la compra simulada, ir a Sensores e inclinar el teléfono, cerrar y reabrir la app.
- Resultado: contador de favoritas en 3, miniaturas con nombre, total del carrito correcto y carta 3D que se inclina.
- Alternativa: "Limpiar favoritas" pide confirmación; Cancelar conserva las favoritas y Limpiar deja el contador en 0 con el mensaje "Favoritas restablecidas".
- Reinicio: botón "Limpiar favoritas". El carrito se vacía al cerrar y reabrir la app.

## Estado de las funciones
| Función | Estado | Evidencia o limitación |
|---|---|---|
| Favoritas con selección múltiple | Implementado | Cumple en celular y web (v4). |
| Persistencia (AsyncStorage) | Implementado | Cumple en v3 y verificado de nuevo en v4. |
| Limpiar favoritas | Implementado | v4 cumple. En v5 se agrega confirmación (Alert.alert en celular, window.confirm en web): por comprobar. |
| Columnas adaptativas | Implementado | 1 columna en celular, 3 en web ancho. |
| Sensor real (carta 3D) | Implementado | Cumple en Android (v3). Web usa simulación. Permiso denegado: no probado. |
| Asistente IA | Implementado (didáctico) | Clasificador 1-NN de 3 intenciones; puede equivocarse. |
| Precios estables | Implementado (v5) | Se calculan desde el id; mismo precio en celular y web: por comprobar. |
| Búsqueda por nombre | Implementado (v5) | Incluye mensaje "sin resultados": por comprobar. |
| Carrito simulado | Implementado (v5) | Compra con datos ficticios, sin cobro real. No se guarda al cerrar la app. |
| Banner compacto, contraste y espacio inferior en Android | Implementado (v5) | Por comprobar en el celular. |
| Mensajes para lector de pantalla | Implementado (v5) | `accessibilityLiveRegion`; TalkBack: por comprobar. |
| iOS y tableta física | No probado | Sin dispositivo disponible. |

## Pendientes
- Comprobar en celular y en web los cambios de v5-final y completar la fecha de comprobación.
- Guardar el carrito en el dispositivo, conectar un pago real con un servidor y probar en iOS y tableta (siguientes pasos).
- Detalle y responsables en la sección 8 del documento de entrega.

## Entrega
Se conservan `package.json` y el archivo de bloqueo. Se excluyen `node_modules` y secretos. El QR de Expo no es un enlace permanente ni sustituye el código.
