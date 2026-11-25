/* Importaciones */
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, Image, TextInput, Alert,
  FlatList, Pressable, useWindowDimensions, Platform, Animated, Easing,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import AsyncStorage from '@react-native-async-storage/async-storage';
import AsistenteIA from './AsistenteIA';

/* Sesión 12: identificación de la versión para comparar antes/después.
   v1-antes    -> Sensores arrancaba siempre en modo simulación.
   v2-despues  -> Sensores arranca en modo real en el dispositivo (en web sigue en simulación).
   v3-sombra   -> v2 + la sombra de la carta 3D se dibuja dentro de la vista que gira (sin elevation).
   v4-limpiar  -> v3 + botón "Limpiar favoritas" (Sesión 13) para restablecer los datos y repetir el recorrido.
   v5-final    -> v4 + precios estables, confirmación al limpiar, búsqueda, carrito simulado,
                  banner compacto, mejor contraste, espacio inferior en Android y lector de pantalla.
                  Se eliminan las pantallas Original y Optimizada: la app queda solo con
                  Adaptativa, Sensores y Carrito. */
const VERSION_APP = 'v5-final';

/* Espacio extra al final de las listas para que la barra de navegación de Android no tape el último elemento */
const ESPACIO_INFERIOR = Platform.OS === 'android' ? 72 : 24;

const STORAGE_KEY = '@catalogo:favorito';

async function cargarLocalmente() {
  try {
    const valorGuardado = await AsyncStorage.getItem(STORAGE_KEY);
    if (valorGuardado !== null) {
      return JSON.parse(valorGuardado);
    }
    return null;
  } catch (error) {
    console.error('Error al cargar:', error);
    return null;
  }
}

async function borrarLocalmente() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error al borrar:', error);
    return false;
  }
}

/* Lista de cartas favoritas (selección múltiple): se guarda y se recupera de AsyncStorage */
const STORAGE_KEY_LISTA = '@catalogo:favoritas';

async function guardarLista(ids) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_LISTA, JSON.stringify(ids));
    return true;
  } catch (error) {
    console.error('Error al guardar la lista:', error);
    return false;
  }
}

async function cargarLista() {
  try {
    const valor = await AsyncStorage.getItem(STORAGE_KEY_LISTA);
    const ids = valor !== null ? JSON.parse(valor) : [];
    return Array.isArray(ids) ? ids : [];
  } catch (error) {
    console.error('Error al cargar la lista:', error);
    return [];
  }
}

/* Sesión 13 (mejora): confirmación que funciona en celular y en web.
   En celular usa Alert.alert con botones; en web Alert.alert no muestra botones, así que usa window.confirm. */
function confirmar(titulo, mensaje, textoAceptar, onAceptar, onCancelar) {
  if (Platform.OS === 'web') {
    const acepto = typeof window !== 'undefined' && window.confirm(`${titulo}\n\n${mensaje}`);
    if (acepto) {
      onAceptar();
    } else if (onCancelar) {
      onCancelar();
    }
    return;
  }
  Alert.alert(
    titulo,
    mensaje,
    [
      { text: 'Cancelar', style: 'cancel', onPress: onCancelar },
      { text: textoAceptar, style: 'destructive', onPress: onAceptar },
    ],
    { cancelable: true, onDismiss: onCancelar }
  );
}

/* Texto sin tildes y en minúsculas, para que la búsqueda no distinga "Eléctrico" de "electrico" */
function normalizar(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/* Datos base de Pokémon */
const nombresPokemon = [
  'Pikachu', 'Charmander', 'Bulbasaur', 'Squirtle', 'Eevee', 'Snorlax',
  'Gengar', 'Mewtwo', 'Dragonite', 'Gyarados', 'Jigglypuff', 'Machamp',
  'Alakazam', 'Lapras', 'Vaporeon', 'Charizard', 'Blastoise', 'Venusaur',
  'Arcanine', 'Onix',
];

/* Número real de Pokédex nacional para cada nombre, así la imagen
   (sprite oficial) siempre corresponde al Pokémon correcto */
const pokedexPorNombre = {
  Pikachu: 25,
  Charmander: 4,
  Bulbasaur: 1,
  Squirtle: 7,
  Eevee: 133,
  Snorlax: 143,
  Gengar: 94,
  Mewtwo: 150,
  Dragonite: 149,
  Gyarados: 130,
  Jigglypuff: 39,
  Machamp: 68,
  Alakazam: 65,
  Lapras: 131,
  Vaporeon: 134,
  Charizard: 6,
  Blastoise: 9,
  Venusaur: 3,
  Arcanine: 59,
  Onix: 95,
};

/* Colores oscurecidos para que el texto blanco de las etiquetas se lea bien (contraste >= 4.5:1) */
const tiposPokemon = [
  { nombre: 'Fuego', color: '#C2410C' },
  { nombre: 'Agua', color: '#2F6DB5' },
  { nombre: 'Planta', color: '#4B7F2E' },
  { nombre: 'Eléctrico', color: '#8F6600' },
  { nombre: 'Psíquico', color: '#A8458A' },
  { nombre: 'Normal', color: '#6F6750' },
  { nombre: 'Fantasma', color: '#6C5B9E' },
  { nombre: 'Dragón', color: '#4A5BC0' },
  { nombre: 'Lucha', color: '#B5442E' },
  { nombre: 'Roca', color: '#7D6E3C' },
];

/* Tipo principal real de cada Pokémon (según la Pokédex) */
const tipoPorNombre = {
  Pikachu: 'Eléctrico',
  Charmander: 'Fuego',
  Bulbasaur: 'Planta',
  Squirtle: 'Agua',
  Eevee: 'Normal',
  Snorlax: 'Normal',
  Gengar: 'Fantasma',
  Mewtwo: 'Psíquico',
  Dragonite: 'Dragón',
  Gyarados: 'Agua',
  Jigglypuff: 'Normal',
  Machamp: 'Lucha',
  Alakazam: 'Psíquico',
  Lapras: 'Agua',
  Vaporeon: 'Agua',
  Charizard: 'Fuego',
  Blastoise: 'Agua',
  Venusaur: 'Planta',
  Arcanine: 'Fuego',
  Onix: 'Roca',
};

const rarezas = ['Común', 'Poco común', 'Rara', 'Ultra Rara', 'Secreta'];

/* Rango de precio según la rareza, para que el precio tenga sentido
   respecto a qué tan rara es la carta */
const rangoPrecioPorRareza = {
  'Común': [5, 50],
  'Poco común': [50, 150],
  'Rara': [150, 300],
  'Ultra Rara': [300, 450],
  'Secreta': [450, 999],
};

/* Precio estable: el mismo id siempre produce el mismo precio, en cualquier dispositivo.
   Math.imul usa enteros de 32 bits, así que el resultado no depende del motor de JS. */
function fraccionDesdeId(id) {
  return (Math.imul(id, 2654435761) >>> 0) / 4294967296; // número entre 0 y 1
}

/* Datos de prueba: 1000 cartas Pokémon */
const productos = Array.from({ length: 1000 }, (_, index) => {
  const id = index + 1;
  const nombreBase = nombresPokemon[index % nombresPokemon.length];
  const numeroPokedex = pokedexPorNombre[nombreBase];
  const tipo = tiposPokemon.find((t) => t.nombre === tipoPorNombre[nombreBase]);
  const rareza = rarezas[index % rarezas.length];
  const [precioMin, precioMax] = rangoPrecioPorRareza[rareza];
  const precioNum = Number(
    (precioMin + fraccionDesdeId(id) * (precioMax - precioMin)).toFixed(2)
  );

  return {
    id,
    nombre: `${nombreBase} #${id}`,
    descripcion: `Tipo ${tipo.nombre} · ${rareza}`,
    precioNum,                          // número, para el carrito
    precio: `$${precioNum.toFixed(2)}`, // texto, para mostrar
    tipo,
    imagenUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${numeroPokedex}.png`,
  };
});

/* Carrito simulado: los precios se manejan en centavos para evitar errores de decimales al sumar */
function calcularTotalCentavos(carrito) {
  return Object.entries(carrito).reduce((suma, [id, cantidad]) => {
    const carta = productos[Number(id) - 1];
    return carta ? suma + Math.round(carta.precioNum * 100) * cantidad : suma;
  }, 0);
}

function formatoCentavos(centavos) {
  return `$${(centavos / 100).toFixed(2)}`;
}

/* Pestañas de la app */
const PESTANAS = [
  { id: 'adaptativa', etiqueta: 'Adaptativa' },
  { id: 'sensores', etiqueta: 'Sensores' },
  { id: 'carrito', etiqueta: 'Carrito' },
];

/* Componente Principal: App */
export default function App() {
  const [pestana, setPestana] = React.useState('adaptativa');
  // Agregué este estado en App para que la selección no se pierda al cambiar de pestaña.
  const [cartasSeleccionadas, setCartasSeleccionadas] = React.useState([]);
  const [listaCargada, setListaCargada] = React.useState(false);
  // Sesión 10: muestra el asistente de IA local sin reemplazar las pestañas existentes.
  const [mostrarIA, setMostrarIA] = React.useState(false);
  // Carrito simulado: { [idCarta]: cantidad }
  const [carrito, setCarrito] = React.useState({});
  const [mensajeCompra, setMensajeCompra] = React.useState('');

  // Recupera las favoritas guardadas al abrir la app.
  React.useEffect(() => {
    async function recuperar() {
      const ids = await cargarLista();
      setCartasSeleccionadas(ids);
      setListaCargada(true);
    }
    recuperar();
  }, []);

  // Guarda cada cambio, pero solo después de haber cargado (evita pisar con una lista vacía).
  React.useEffect(() => {
    if (listaCargada) guardarLista(cartasSeleccionadas);
  }, [cartasSeleccionadas, listaCargada]);

  // Agregué esta función para marcar o desmarcar una carta sin afectar las demás.
  function alternarSeleccion(id) {
    setCartasSeleccionadas((actuales) =>
      actuales.includes(id)
        ? actuales.filter((seleccionado) => seleccionado !== id)
        : [...actuales, id]
    );
  }

  // Sesión 13: vacía la lista de favoritas (el useEffect de arriba guarda la lista vacía).
  function limpiarSeleccion() {
    setCartasSeleccionadas([]);
  }

  /* Funciones del carrito */
  function agregarAlCarrito(id) {
    setCarrito((actual) => ({ ...actual, [id]: Math.min((actual[id] || 0) + 1, 99) }));
    setMensajeCompra('');
  }

  function cambiarCantidad(id, delta) {
    setCarrito((actual) => {
      const nueva = (actual[id] || 0) + delta;
      const siguiente = { ...actual };
      if (nueva <= 0) {
        delete siguiente[id];
      } else {
        siguiente[id] = Math.min(nueva, 99);
      }
      return siguiente;
    });
  }

  function quitarDelCarrito(id) {
    setCarrito((actual) => {
      const siguiente = { ...actual };
      delete siguiente[id];
      return siguiente;
    });
  }

  function vaciarCarrito() {
    confirmar(
      '¿Vaciar el carrito?',
      'Se quitarán todas las cartas del carrito.',
      'Vaciar',
      () => {
        setCarrito({});
        setMensajeCompra('Carrito vaciado.');
      }
    );
  }

  const totalCentavos = calcularTotalCentavos(carrito);
  const totalUnidades = Object.values(carrito).reduce((suma, cantidad) => suma + cantidad, 0);

  function finalizarCompra() {
    confirmar(
      'Finalizar compra (simulada)',
      `Total: ${formatoCentavos(totalCentavos)}. Es una compra con datos ficticios: no se realiza ningún cobro.`,
      'Comprar',
      () => {
        setCarrito({});
        setMensajeCompra(
          `¡Compra simulada realizada por ${formatoCentavos(totalCentavos)}! No se hizo ningún cobro real.`
        );
      }
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tienda de Cartas Pokémon</Text>
      <Text style={styles.subtitulo}>
        Encuentra, colecciona y compra tus cartas favoritas
      </Text>
      {/* Sesión 12: versión visible para identificar qué build se está probando */}
      <Text style={styles.versionApp}>Versión: {VERSION_APP}</Text>

      <View style={styles.pestanas}>
        {PESTANAS.map((p) => {
          const activa = pestana === p.id;
          const etiqueta = p.id === 'carrito' ? `Carrito (${totalUnidades})` : p.etiqueta;
          return (
            <Pressable
              key={p.id}
              style={[styles.pestana, activa && styles.pestanaActiva]}
              onPress={() => setPestana(p.id)}
              accessibilityRole="tab"
              accessibilityLabel={etiqueta}
              accessibilityState={{ selected: activa }}
            >
              <Text style={[styles.textoPestana, activa && styles.textoPestanaActiva]}>
                {etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Sesión 10: botón para abrir o cerrar el asistente con IA local */}
      <Pressable
        style={[styles.botonIA, mostrarIA && styles.botonIAActivo]}
        onPress={() => setMostrarIA((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={mostrarIA ? 'Volver a mis pantallas' : 'Abrir asistente IA'}
      >
        <Text style={[styles.textoBotonIA, mostrarIA && styles.textoBotonIAActivo]}>
          {mostrarIA ? 'Volver a mis pantallas' : 'Abrir asistente IA'}
        </Text>
      </Pressable>

      {mostrarIA ? (
        <AsistenteIA productos={productos} />
      ) : (
        <>
          {pestana === 'adaptativa' && (
            <PantallaAdaptativa
              cartasSeleccionadas={cartasSeleccionadas}
              onAlternarSeleccion={alternarSeleccion}
              onLimpiarSeleccion={limpiarSeleccion}
              carrito={carrito}
              onAgregarAlCarrito={agregarAlCarrito}
            />
          )}
          {pestana === 'sensores' && <PantallaSensores cartasSeleccionadas={cartasSeleccionadas} />}
          {pestana === 'carrito' && (
            <PantallaCarrito
              carrito={carrito}
              totalCentavos={totalCentavos}
              mensajeCompra={mensajeCompra}
              onCambiarCantidad={cambiarCantidad}
              onQuitar={quitarDelCarrito}
              onVaciar={vaciarCarrito}
              onComprar={finalizarCompra}
              onIrAlCatalogo={() => setPestana('adaptativa')}
            />
          )}
        </>
      )}
    </View>
  );
}

function useCardMotion(id, enabled = true) {
  const movimiento = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return undefined;

    const duracion = 1800 + (id % 5) * 220;
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(movimiento, {
          toValue: -4,
          duration: duracion,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(movimiento, {
          toValue: 4,
          duration: duracion,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(movimiento, {
          toValue: 0,
          duration: duracion * 0.8,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animacion.start();
    return () => animacion.stop();
  }, [enabled, id, movimiento]);

  return movimiento;
}

/* Tarjeta para la pantalla Adaptativa */
const TarjetaAdaptativa = React.memo(function TarjetaAdaptativa({
  producto,
  esFavorito,
  seleccionada,
  cantidadEnCarrito,
  onAlternarSeleccion,
  onAgregarAlCarrito,
}) {
  const movimiento = useCardMotion(producto.id);

  return (
    <Animated.View
      style={[
        styles.tarjetaAdaptativa,
        seleccionada && styles.tarjetaSeleccionada,
        esFavorito && styles.tarjetaFavorita,
        { transform: [{ translateY: movimiento }] },
      ]}
    >
      <Image source={{ uri: producto.imagenUrl }} style={styles.imagen} />
      <View style={styles.infoTarjeta}>
        <Text style={styles.nombre}>{producto.nombre}</Text>
        <View style={[styles.badgeTipo, { backgroundColor: producto.tipo.color }]}>
          <Text style={styles.textoBadge}>{producto.tipo.nombre}</Text>
        </View>
        <Text style={styles.descripcion}>{producto.descripcion}</Text>
        <View style={styles.filaBotonesTarjeta}>
          {/* El botón de favorita ahora agrega o quita la carta del recuadro. */}
          <Pressable
            style={styles.botonFavorito}
            onPress={() => onAlternarSeleccion(producto.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={
              seleccionada
                ? `Quitar ${producto.nombre} de favoritas`
                : `Marcar ${producto.nombre} como favorita`
            }
            accessibilityHint={
              seleccionada
                ? 'Toca dos veces para quitar esta carta del recuadro de favoritas'
                : 'Toca dos veces para agregar esta carta al recuadro de favoritas'
            }
            accessibilityState={{ selected: seleccionada }}
          >
            <Text style={styles.textoFavorito}>
              {seleccionada ? '★ Favorita · quitar' : '☆ Marcar como favorita'}
            </Text>
          </Pressable>
          {/* Carrito simulado: agrega una unidad de esta carta. */}
          <Pressable
            style={[styles.botonFavorito, styles.botonCarrito]}
            onPress={() => onAgregarAlCarrito(producto.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Agregar ${producto.nombre} al carrito`}
            accessibilityHint={
              cantidadEnCarrito > 0
                ? `Ya tienes ${cantidadEnCarrito} en el carrito. Toca dos veces para agregar otra`
                : 'Toca dos veces para agregar esta carta al carrito'
            }
          >
            <Text style={styles.textoBotonCarrito}>
              {cantidadEnCarrito > 0
                ? `🛒 Agregar otra (${cantidadEnCarrito})`
                : '🛒 Agregar al carrito'}
            </Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.precio}>{producto.precio}</Text>
    </Animated.View>
  );
});

/* Muestra las miniaturas y los nombres de las cartas que aparecen en el recuadro.
  Recibe sus IDs y busca los datos completos en el catálogo.
  Banner compacto: las miniaturas van en una sola fila con scroll horizontal. */
function ImagenesFavoritas({ favoritos }) {
  // Busco imagen y nombre en el catálogo para cada carta del recuadro.
  const cartas = favoritos
    .map((f) => productos.find((p) => p.id === f.id))
    .filter(Boolean);

  if (cartas.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollImagenesFavoritas}
      contentContainerStyle={styles.filaImagenesFavoritas}
    >
      {cartas.map((carta) => (
        /* Agrupo imagen y nombre para identificar cada carta mostrada. */
        <View key={carta.id} style={styles.tarjetaImagenFavorita}>
          <Image
            source={{ uri: carta.imagenUrl }}
            style={styles.imagenFavorita}
            resizeMode="contain"
            accessible
            accessibilityLabel={`Imagen de ${carta.nombre}`}
          />
          <Text style={styles.nombreImagenFavorita} numberOfLines={1}>
            {carta.nombre}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

/* Pantalla Adaptativa: cambia columnas y reorganiza el resumen según el ancho disponible */
function PantallaAdaptativa({
  cartasSeleccionadas,
  onAlternarSeleccion,
  onLimpiarSeleccion,
  carrito,
  onAgregarAlCarrito,
}) {
  const { width } = useWindowDimensions();

  const [favorito, setFavorito] = useState(null);
  const [mensaje, setMensaje] = useState('Pulsa "Marcar como favorita" para agregar o quitar cartas del recuadro.');
  const [tipoMensaje, setTipoMensaje] = useState('info');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    async function recuperar() {
      const guardado = await cargarLocalmente();
      if (guardado) {
        setFavorito(guardado);
        setMensaje('Favorita recuperada del almacenamiento local');
      }
    }
    recuperar();
  }, []);

  // Búsqueda por nombre (sin distinguir mayúsculas ni tildes).
  const cartasFiltradas = useMemo(() => {
    const consulta = normalizar(busqueda.trim());
    if (!consulta) return productos;
    return productos.filter((p) => normalizar(p.nombre).includes(consulta));
  }, [busqueda]);

  async function quitarFavorita() {
    const ok = await borrarLocalmente();
    if (ok) {
      setFavorito(null);
      setMensaje('Favorita eliminada');
      setTipoMensaje('exito');
    } else {
      setMensaje('No se pudo quitar la favorita. Intenta de nuevo.');
      setTipoMensaje('error');
    }
  }

  // Sesión 13: restablece todas las favoritas (selección y favorita guardada) para repetir el recorrido.
  async function ejecutarLimpieza() {
    onLimpiarSeleccion();
    if (favorito) {
      await borrarLocalmente();
      setFavorito(null);
    }
    setMensaje('Favoritas restablecidas. Puedes repetir el recorrido.');
    setTipoMensaje('exito');
  }

  // Pide confirmación antes de borrar: Cancelar conserva las favoritas.
  function limpiarTodo() {
    confirmar(
      '¿Limpiar favoritas?',
      `Se quitarán las ${favoritosDelRecuadro.length} cartas de tu recuadro de favoritas. Esta acción no se puede deshacer.`,
      'Limpiar',
      ejecutarLimpieza,
      () => {
        setMensaje('Cancelado. Tus favoritas se conservaron.');
        setTipoMensaje('info');
      }
    );
  }

  // Agrega o quita la carta y confirma la acción en el banner.
  function alternarConMensaje(id) {
    const carta = productos.find((p) => p.id === id);
    const yaEstaba = cartasSeleccionadas.includes(id);
    onAlternarSeleccion(id);
    setMensaje(
      yaEstaba
        ? `${carta.nombre} se quitó de tus favoritas`
        : `★ ${carta.nombre} se agregó a tus favoritas`
    );
    setTipoMensaje('exito');
  }

  // Agrega la carta al carrito y lo confirma en el banner.
  function agregarConMensaje(id) {
    const carta = productos.find((p) => p.id === id);
    onAgregarAlCarrito(id);
    setMensaje(`🛒 ${carta.nombre} se agregó al carrito`);
    setTipoMensaje('exito');
  }

  // Uno las cartas seleccionadas con la favorita guardada y elimino duplicados.
  const idsFavoritos = [...new Set([
    ...cartasSeleccionadas,
    ...(favorito ? [favorito.id] : []),
  ])];
  // Paso los IDs al formato que espera el componente de miniaturas.
  const favoritosDelRecuadro = idsFavoritos.map((id) => ({ id }));

  const esTableta = width >= 600;
  const esPantallaGrande = width >= 900;
  const esDispositivoGrande = width >= 600;

  let columnas = 1;
  if (esPantallaGrande) {
    columnas = 3;
  } else if (esTableta) {
    columnas = 2;
  }

  const tipoDispositivo = esPantallaGrande
    ? 'Pantalla grande'
    : esTableta
    ? 'Tableta'
    : 'Teléfono';

  const claveCarrito = Object.entries(carrito).join('|');

  return (
    <View style={styles.pantallaAdaptativa}>
      <View style={[styles.resumen, esDispositivoGrande && styles.resumenGrande]}>
        <View style={[styles.resumenItem, esDispositivoGrande && styles.resumenItemGrande]}>
          <Text style={styles.resumenLabel}>Cartas</Text>
          <Text style={styles.resumenValor}>{productos.length}</Text>
        </View>
        <View style={[styles.resumenItem, esDispositivoGrande && styles.resumenItemGrande]}>
          <Text style={styles.resumenLabel}>Dispositivo</Text>
          <Text style={styles.resumenValor}>{tipoDispositivo}</Text>
        </View>
        <View style={[styles.resumenItem, esDispositivoGrande && styles.resumenItemGrande]}>
          <Text style={styles.resumenLabel}>Columnas</Text>
          <Text style={styles.resumenValor}>{columnas}</Text>
        </View>
        {/* Muestro cuántas cartas hay en el recuadro de favoritas. */}
        <View style={[styles.resumenItem, esDispositivoGrande && styles.resumenItemGrande]}>
          <Text style={styles.resumenLabel}>Favoritas</Text>
          <Text style={styles.resumenValor}>{favoritosDelRecuadro.length}</Text>
        </View>
      </View>

      <View
        style={[
          styles.bannerFavorito,
          favoritosDelRecuadro.length > 0 && styles.bannerExito,
          tipoMensaje === 'exito' && styles.bannerExito,
          tipoMensaje === 'error' && styles.bannerError,
        ]}
      >
        {/* Indico el total de cartas reunidas en el recuadro de favoritas. */}
        <Text style={styles.textoBanner}>
          Cartas favoritas ({favoritosDelRecuadro.length})
        </Text>
        {/* accessibilityLiveRegion: el lector de pantalla (TalkBack) anuncia cada mensaje nuevo. */}
        <Text
          style={[styles.mensajeBanner, tipoMensaje !== 'info' && styles.mensajeBannerFuerte]}
          accessibilityLiveRegion="polite"
        >
          {mensaje}
        </Text>
        {/* Muestro imagen y nombre de cada carta seleccionada o guardada. */}
        <ImagenesFavoritas favoritos={favoritosDelRecuadro} />
        <View style={styles.filaBotonesBanner}>
          {/* Sesión 13: botón para restablecer los datos y repetir el recorrido. */}
          {favoritosDelRecuadro.length > 0 && (
            <Pressable
              style={styles.botonFavorito}
              onPress={limpiarTodo}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Limpiar favoritas"
              accessibilityHint="Toca dos veces para quitar todas las cartas del recuadro de favoritas. Se pedirá confirmación"
            >
              <Text style={styles.textoFavorito}>Limpiar favoritas</Text>
            </Pressable>
          )}
          {favorito && (
            /* Este botón quita la favorita que ya estaba guardada localmente. */
            <Pressable
              style={styles.botonFavorito}
              onPress={quitarFavorita}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Quitar carta favorita"
              accessibilityHint="Toca dos veces para eliminar tu carta favorita guardada"
            >
              <Text style={styles.textoFavorito}>Quitar favorita guardada</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Búsqueda por nombre */}
      <View style={styles.filaBusqueda}>
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar carta por nombre (ej. Pikachu)"
          placeholderTextColor="#6B5D49"
          style={styles.entradaBusqueda}
          accessibilityLabel="Buscar carta por nombre"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {busqueda.length > 0 && (
          <Pressable
            style={styles.botonBorrarBusqueda}
            onPress={() => setBusqueda('')}
            accessibilityRole="button"
            accessibilityLabel="Borrar búsqueda"
          >
            <Text style={styles.textoFavorito}>Borrar</Text>
          </Pressable>
        )}
      </View>
      {busqueda.trim().length > 0 && cartasFiltradas.length > 0 && (
        <Text style={styles.conteoBusqueda} accessibilityLiveRegion="polite">
          {`Mostrando ${cartasFiltradas.length} de ${productos.length} cartas`}
        </Text>
      )}

      {/* Incluí los IDs en extraData para que la lista actualice cada carta seleccionada o agregada al carrito. */}
      <FlatList
        key={`lista-${columnas}`}
        data={cartasFiltradas}
        numColumns={columnas}
        keyExtractor={(item) => item.id.toString()}
        initialNumToRender={12}
        keyboardShouldPersistTaps="handled"
        extraData={`${favorito?.id}-${cartasSeleccionadas.join(',')}-${claveCarrito}`}
        renderItem={({ item }) => (
          <TarjetaAdaptativa
            producto={item}
            esFavorito={favorito?.id === item.id}
            seleccionada={cartasSeleccionadas.includes(item.id)}
            cantidadEnCarrito={carrito[item.id] || 0}
            onAlternarSeleccion={alternarConMensaje}
            onAgregarAlCarrito={agregarConMensaje}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.sinResultados} accessibilityLiveRegion="polite">
            {`No se encontraron cartas para "${busqueda.trim()}". Prueba con otro nombre, por ejemplo Pikachu o Eevee.`}
          </Text>
        }
        columnWrapperStyle={columnas > 1 ? styles.fila : undefined}
        contentContainerStyle={styles.listaContenido}
      />
    </View>
  );
}

/* Pantalla Carrito: compra simulada con datos ficticios */
function PantallaCarrito({
  carrito,
  totalCentavos,
  mensajeCompra,
  onCambiarCantidad,
  onQuitar,
  onVaciar,
  onComprar,
  onIrAlCatalogo,
}) {
  const ids = Object.keys(carrito).map(Number);

  return (
    <ScrollView style={styles.lista} contentContainerStyle={styles.panelCarrito}>
      <Text style={styles.tituloSensor}>Mi carrito</Text>
      <Text style={styles.avisoSensor}>
        Compra simulada con datos ficticios: no se realiza ningún cobro.
      </Text>

      {mensajeCompra !== '' && (
        <View style={[styles.bannerFavorito, styles.bannerExito]}>
          <Text style={styles.mensajeBannerFuerte} accessibilityLiveRegion="polite">
            {mensajeCompra}
          </Text>
        </View>
      )}

      {ids.length === 0 ? (
        <View style={styles.carritoVacio}>
          <Text style={styles.nombreSensor}>Tu carrito está vacío</Text>
          <Text style={styles.avisoSensor}>
            Agrega cartas desde la pestaña Adaptativa con el botón "Agregar al carrito".
          </Text>
          <Pressable
            style={styles.botonPrimario}
            onPress={onIrAlCatalogo}
            accessibilityRole="button"
            accessibilityLabel="Ir al catálogo"
          >
            <Text style={styles.textoBotonPrimario}>Ir al catálogo</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {ids.map((id) => {
            const carta = productos[id - 1];
            const cantidad = carrito[id];
            const subtotal = Math.round(carta.precioNum * 100) * cantidad;
            return (
              <View key={id} style={styles.tarjetaCarrito}>
                <View style={styles.filaCarritoSuperior}>
                  <Image source={{ uri: carta.imagenUrl }} style={styles.imagen} />
                  <View style={styles.infoTarjeta}>
                    <Text style={styles.nombre}>{carta.nombre}</Text>
                    <View style={[styles.badgeTipo, { backgroundColor: carta.tipo.color }]}>
                      <Text style={styles.textoBadge}>{carta.tipo.nombre}</Text>
                    </View>
                    <Text style={styles.descripcion}>Precio unitario: {carta.precio}</Text>
                  </View>
                </View>
                <View style={styles.filaCantidad}>
                  <Pressable
                    style={styles.botonCantidad}
                    onPress={() => onCambiarCantidad(id, -1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar una unidad de ${carta.nombre}`}
                  >
                    <Text style={styles.textoBotonCantidad}>−</Text>
                  </Pressable>
                  <Text
                    style={styles.textoCantidad}
                    accessibilityLabel={`Cantidad: ${cantidad}`}
                  >
                    {cantidad}
                  </Text>
                  <Pressable
                    style={styles.botonCantidad}
                    onPress={() => onCambiarCantidad(id, 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Agregar una unidad de ${carta.nombre}`}
                  >
                    <Text style={styles.textoBotonCantidad}>+</Text>
                  </Pressable>
                  <Text style={styles.subtotalCarrito}>{formatoCentavos(subtotal)}</Text>
                  <Pressable
                    style={styles.botonFavorito}
                    onPress={() => onQuitar(id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${carta.nombre} del carrito`}
                  >
                    <Text style={styles.textoFavorito}>Quitar</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          <View style={styles.resumenTotal}>
            <Text style={styles.nombreSensor}>Total</Text>
            <Text style={styles.totalCarrito} accessibilityLiveRegion="polite">
              {formatoCentavos(totalCentavos)}
            </Text>
          </View>

          <Pressable
            style={styles.botonPrimario}
            onPress={onComprar}
            accessibilityRole="button"
            accessibilityLabel="Finalizar compra simulada"
          >
            <Text style={styles.textoBotonPrimario}>Finalizar compra (simulada)</Text>
          </Pressable>
          <Pressable
            style={styles.botonSecundario}
            onPress={onVaciar}
            accessibilityRole="button"
            accessibilityLabel="Vaciar carrito"
          >
            <Text style={styles.textoFavorito}>Vaciar carrito</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

/* Carta en 3D: se inclina según la lectura del acelerómetro (real o simulada) */
const GRADOS_MAX = 25; // inclinación máxima de la carta
const SIGNO_X = 1;     // si la carta gira hacia el lado contrario en el teléfono, cámbialo a -1
const SIGNO_Y = 1;     // igual para adelante/atrás

function limitar(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

function CartaInclinable({ carta, rotX, rotY }) {
  const giroX = rotX.interpolate({
    inputRange: [-1, 1],
    outputRange: [`${GRADOS_MAX}deg`, `${-GRADOS_MAX}deg`],
  });
  const giroY = rotY.interpolate({
    inputRange: [-1, 1],
    outputRange: [`${-GRADOS_MAX}deg`, `${GRADOS_MAX}deg`],
  });

  return (
    <View style={styles.escenario3D}>
      <Animated.View
        style={[
          styles.contenedor3D,
          { transform: [{ perspective: 800 }, { rotateX: giroX }, { rotateY: giroY }] },
        ]}
        accessible
        accessibilityLabel={`Carta ${carta.nombre} en 3D. Inclina el teléfono para moverla.`}
      >
        {/* Sombra dibujada dentro del contenedor que gira: se mueve junto con la carta */}
        <View style={styles.sombraCarta3D} />
        <View style={[styles.carta3D, { borderColor: carta.tipo.color }]}>
          <Image source={{ uri: carta.imagenUrl }} style={styles.imagenCarta3D} resizeMode="contain" />
          <Text style={styles.nombreCarta3D}>{carta.nombre}</Text>
          <View style={[styles.badgeTipo, { backgroundColor: carta.tipo.color }]}>
            <Text style={styles.textoBadge}>{carta.tipo.nombre}</Text>
          </View>
          <Text style={styles.precioCarta3D}>{carta.precio}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

/* Pantalla Sensores: acelerómetro real o simulado */
function PantallaSensores({ cartasSeleccionadas }) {
  /* Sesión 12 (corrección del hallazgo A): en un dispositivo la pantalla arranca
     directamente en modo real; solo en web arranca en simulación. Si el permiso se
     niega o no hay sensor, el efecto de abajo lo avisa y ofrece "Cambiar a simulación". */
  const esWeb = Platform.OS === "web";
  const [datos, setDatos] = useState({ x: 0, y: 0, z: 0 });
  const [simulados, setSimulados] = useState({ x: 0, y: 0, z: 1 });
  const [modo, setModo] = useState(esWeb ? "simulacion" : "real");
  const [estado, setEstado] = useState(
    esWeb ? "Simulación: sin sensor físico" : "Comprobando sensor y permiso..."
  );
  const [base, setBase] = useState({ x: 0, y: 0 }); // posición neutra de la carta (calibración)

  useEffect(() => {
    if (modo !== "real") {
      setEstado("Simulación: sin sensor físico");
      return;
    }

    let cancelado = false;
    let subscription;

    async function iniciar() {
      setEstado("Comprobando sensor y permiso...");
      setDatos({ x: 0, y: 0, z: 0 });
      try {
        if (Platform.OS === "web") {
          setEstado("En esta práctica web usa simulación. Prueba el sensor en Expo Go.");
          return;
        }
        const permiso = await Accelerometer.requestPermissionsAsync();
        if (cancelado) return;
        if (!permiso.granted) {
          setEstado("Permiso denegado. Puedes continuar con simulación.");
          return;
        }
        const disponible = await Accelerometer.isAvailableAsync();
        if (cancelado) return;
        if (!disponible) {
          setEstado("Sensor no disponible. Usa simulación.");
          return;
        }
        Accelerometer.setUpdateInterval(100);
        setEstado("Esperando la primera lectura...");
        subscription = Accelerometer.addListener((data) => {
          if (cancelado) return;
          setDatos({ x: data.x, y: data.y, z: data.z });
          setEstado("Sensor activo");
        });
      } catch {
        if (!cancelado) setEstado("No se pudo iniciar el sensor. Usa simulación.");
      }
    }

    iniciar();

    return () => {
      cancelado = true;
      subscription?.remove();
    };
  }, [modo]);

  // El sensor real entrega X con signo invertido en este teléfono: se corrige solo en modo real
  const lectura = modo === "real" ? { ...datos, x: -datos.x } : simulados;
  const lista = modo === "simulacion" || estado === "Sensor activo";

  // Carta 3D: valores animados que siguen la inclinación con un resorte suave
  const rotX = useRef(new Animated.Value(0)).current;
  const rotY = useRef(new Animated.Value(0)).current;

  // Calibración: la carta se inclina respecto a una posición neutra, no respecto a "plano".
  // En modo real la referencia se fija sola con la primera lectura y se puede recalibrar.
  const referencia = modo === "real" ? base : { x: 0, y: 0 };
  const relX = lectura.x - referencia.x;
  const relY = lectura.y - referencia.y;

  useEffect(() => {
    if (modo === "real" && estado === "Sensor activo") {
      setBase({ x: lectura.x, y: lectura.y });
    }
  }, [estado, modo]);

  useEffect(() => {
    const objetivoY = lista ? limitar(relX * SIGNO_X, -1, 1) : 0;
    const objetivoX = lista ? limitar(relY * SIGNO_Y, -1, 1) : 0;
    Animated.spring(rotY, { toValue: objetivoY, friction: 7, tension: 60, useNativeDriver: true }).start();
    Animated.spring(rotX, { toValue: objetivoX, friction: 7, tension: 60, useNativeDriver: true }).start();
  }, [relX, relY, lista]);

  // Selector: elijo cuál de las cartas favoritas se ve en 3D
  const [cartaIdSel, setCartaIdSel] = useState(null);
  const cartasFavoritas = (cartasSeleccionadas || [])
    .map((id) => productos.find((p) => p.id === id))
    .filter(Boolean);
  const cartaActual =
    cartasFavoritas.find((c) => c.id === cartaIdSel) || cartasFavoritas[0] || null;

  let posicion = "Posición centrada";
  let zonaActiva = "centro";
  if (lectura.x > 0.5) {
    posicion = "Inclinado a la derecha";
    zonaActiva = "derecha";
  } else if (lectura.x < -0.5) {
    posicion = "Inclinado a la izquierda";
    zonaActiva = "izquierda";
  }

  // Guía para fotografiar cartas: teléfono plano sobre la mesa (X y Y cerca de 0, Z cerca de 1 g)
  const esPlano =
    lista &&
    Math.abs(lectura.x) < 0.15 &&
    Math.abs(lectura.y) < 0.15 &&
    Math.abs(lectura.z) > 0.9;

  return (
    <ScrollView style={styles.lista} contentContainerStyle={styles.panelSensor}>
      <Text style={styles.tituloSensor}>Mi app siente el movimiento</Text>
      <Text style={styles.avisoSensor}>
        El sensor real se prueba en Expo Go. La simulación usa valores elegidos.
      </Text>

      <View style={styles.controlesSensor}>
        <Pressable style={styles.botonSensor} onPress={() => setModo("real")}>
          <Text style={styles.textoBotonSensor}>Usar sensor real</Text>
        </Pressable>
        <Pressable style={styles.botonSensor} onPress={() => setModo("simulacion")}>
          <Text style={styles.textoBotonSensor}>Usar simulación</Text>
        </Pressable>
      </View>

      <Text style={styles.estadoSensor}>{estado}</Text>
      {modo === "real" && !lista && (
        <Pressable
          style={[styles.botonSensor, { alignSelf: 'flex-start' }]}
          onPress={() => setModo("simulacion")}
          accessibilityRole="button"
          accessibilityLabel="Cambiar a simulación"
          accessibilityHint="Usa valores simulados porque el sensor real no está disponible"
        >
          <Text style={styles.textoBotonSensor}>Cambiar a simulación</Text>
        </Pressable>
      )}
      <Text style={styles.textoSensor}>
        Origen: {modo === "real" ? (lista ? "Sensor físico" : "Sensor físico (sin lectura)") : "SIMULADO"}
      </Text>

      {/* Carta favorita en 3D que se inclina con el sensor */}
      <Text style={[styles.nombreSensor, { marginTop: 16 }]}>Carta favorita en 3D</Text>
      {cartaActual ? (
        <>
          <View style={styles.selectorCartas}>
            {cartasFavoritas.map((c) => {
              const activa = c.id === cartaActual.id;
              return (
                <Pressable
                  key={c.id}
                  style={[styles.chipCarta, activa && styles.chipCartaActivo]}
                  onPress={() => setCartaIdSel(c.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver ${c.nombre} en 3D`}
                  accessibilityState={{ selected: activa }}
                >
                  <Text style={[styles.textoChip, activa && styles.textoChipActivo]}>
                    {c.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <CartaInclinable carta={cartaActual} rotX={rotX} rotY={rotY} />
          {modo === "real" && lista && (
            <>
              <Pressable
                style={[styles.botonSensor, { alignSelf: 'flex-start' }]}
                onPress={() => setBase({ x: lectura.x, y: lectura.y })}
                accessibilityRole="button"
                accessibilityLabel="Calibrar posición"
                accessibilityHint="Toma la posición actual del teléfono como el centro de la carta"
              >
                <Text style={styles.textoBotonSensor}>Calibrar posición</Text>
              </Pressable>
              <Text style={styles.avisoSensor}>
                Centro de referencia: X {base.x.toFixed(2)} · Y {base.y.toFixed(2)}
              </Text>
            </>
          )}
          {!lista && (
            <Text style={styles.avisoSensor}>
              Sin lectura del sensor: la carta se muestra sin inclinar.
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.avisoSensor}>
          Marca cartas como favoritas en la pestaña Adaptativa para verlas aquí en 3D e
          inclinarlas con el sensor.
        </Text>
      )}

      <View style={styles.tarjetaSensor}>
        <Text style={styles.nombreSensor}>Lecturas en g</Text>
        <Text style={styles.textoSensor}>X: {lista ? lectura.x.toFixed(2) : "--"}</Text>
        <Text style={styles.textoSensor}>Y: {lista ? lectura.y.toFixed(2) : "--"}</Text>
        <Text style={styles.textoSensor}>Z: {lista ? lectura.z.toFixed(2) : "--"}</Text>
        <Text style={styles.estadoSensor}>
          Estado: {lista ? posicion : "Sin lectura disponible"}
        </Text>
      </View>

      {lista && (
        <View style={[
          styles.pista,
          lectura.x > 0.5 && styles.pistaDerecha,
          lectura.x < -0.5 && styles.pistaIzquierda,
        ]}>
          <View style={styles.indicador} />
        </View>
      )}

      {/* Mejora propia (opción C): nivel con tres zonas y zona activa */}
      {lista && (
        <View style={styles.nivel}>
          {["izquierda", "centro", "derecha"].map((zona) => {
            const activa = zona === zonaActiva;
            return (
              <View key={zona} style={[styles.zona, activa && styles.zonaActiva]}>
                <Text style={[styles.textoZona, activa && styles.textoZonaActivo]}>
                  {zona === "izquierda" ? "Izquierda" : zona === "centro" ? "Centro" : "Derecha"}
                  {activa ? " ✔" : ""}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Continuación para casa: guía de teléfono plano */}
      {lista && (
        <View style={[styles.guiaPlano, esPlano && styles.guiaPlanoOk]}>
          <Text style={[styles.textoGuia, esPlano && styles.textoGuiaOk]}>
            {esPlano
              ? "Teléfono plano ✔ listo para fotografiar la carta"
              : "Teléfono inclinado: colócalo plano sobre la mesa"}
          </Text>
        </View>
      )}

      {modo === "simulacion" && (
        <View style={styles.controlesSensor}>
          <Pressable
            style={styles.botonSensor}
            onPress={() => setSimulados({ x: -0.8, y: 0, z: 1 })}
          >
            <Text style={styles.textoBotonSensor}>Simular izquierda</Text>
          </Pressable>
          <Pressable
            style={styles.botonSensor}
            onPress={() => setSimulados({ x: 0, y: 0, z: 1 })}
          >
            <Text style={styles.textoBotonSensor}>Centrar</Text>
          </Pressable>
          <Pressable
            style={styles.botonSensor}
            onPress={() => setSimulados({ x: 0.8, y: 0, z: 1 })}
          >
            <Text style={styles.textoBotonSensor}>Simular derecha</Text>
          </Pressable>
          <Pressable
            style={styles.botonSensor}
            onPress={() => setSimulados({ x: 0.2, y: 0.5, z: 0.8 })}
          >
            <Text style={styles.textoBotonSensor}>Simular inclinado</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.avisoSensor}>
        Umbral didáctico: +/-0.5 g. Comprueba signos en orientación vertical.
        No es un nivel calibrado ni un detector exacto de orientación.
      </Text>
    </ScrollView>
  );
}

/* Estilos */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    backgroundColor: '#F4EEE0',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5C4A32',
  },
  subtitulo: {
    fontSize: 14,
    color: '#6B5D49',
    marginTop: 4,
  },
  versionApp: {
    fontSize: 11,
    color: '#6B5D49',
    marginTop: 2,
  },
  pestanas: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 14,
  },
  pestana: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
    backgroundColor: '#D8CBB0',
    borderRadius: 10,
    alignItems: 'center',
  },
  pestanaActiva: {
    backgroundColor: '#6B4F35',
  },
  /* Contraste: texto oscuro en pestañas inactivas, blanco solo sobre la pestaña activa */
  textoPestana: {
    color: '#3B2E1E',
    fontWeight: 'bold',
    fontSize: 12,
  },
  textoPestanaActiva: {
    color: '#fff',
  },
  botonIA: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#E8DFC8',
  },
  botonIAActivo: { backgroundColor: '#6B4F35' },
  textoBotonIA: { color: '#4A3B29', fontWeight: 'bold', fontSize: 13 },
  textoBotonIAActivo: { color: '#fff' },
  imagen: {
    width: 64,
    height: 64,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#EADFC4',
  },
  infoTarjeta: {
    flex: 1,
  },
  nombre: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4A3B29',
  },
  descripcion: {
    fontSize: 11,
    color: '#6B5D49',
    marginTop: 2,
  },
  badgeTipo: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  textoBadge: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  precio: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B4F35',
  },
  pantallaAdaptativa: {
    flex: 1,
  },
  tarjetaAdaptativa: {
    flex: 1,
    margin: 6,
    padding: 10,
    backgroundColor: '#FBF7EE',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  filaBotonesTarjeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 6,
  },
  fila: {
    gap: 12,
  },
  /* Espacio inferior: la barra de navegación de Android ya no tapa la última carta */
  listaContenido: {
    paddingBottom: ESPACIO_INFERIOR,
  },
  /* Resumen compacto: en celular se muestra en cuadrícula de 2 x 2 */
  resumen: {
    backgroundColor: '#FBF7EE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8DFC8',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  resumenGrande: {
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  resumenItem: {
    width: '48%',
    marginBottom: 6,
  },
  resumenItemGrande: {
    width: 'auto',
    marginBottom: 0,
  },
  resumenLabel: {
    fontSize: 12,
    color: '#6B5D49',
  },
  resumenValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5C4A32',
  },

  /* Búsqueda */
  filaBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  entradaBusqueda: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#6B5D49',
    borderRadius: 10,
    backgroundColor: '#FBF7EE',
    color: '#4A3B29',
  },
  botonBorrarBusqueda: {
    marginLeft: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#E8DFC8',
  },
  conteoBusqueda: { fontSize: 12, color: '#6B5D49', marginBottom: 4 },
  sinResultados: {
    padding: 16,
    fontSize: 14,
    color: '#4A3B29',
    textAlign: 'center',
  },

  /* Carrito */
  panelCarrito: {
    paddingBottom: ESPACIO_INFERIOR + 20,
  },
  carritoVacio: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FBF7EE',
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  tarjetaCarrito: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FBF7EE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  filaCarritoSuperior: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filaCantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    columnGap: 8,
  },
  botonCantidad: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#D8CBB0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonCantidad: { fontSize: 22, fontWeight: 'bold', color: '#3B2E1E' },
  textoCantidad: { minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#4A3B29' },
  subtotalCarrito: { flex: 1, textAlign: 'right', fontSize: 15, fontWeight: 'bold', color: '#6B4F35' },
  resumenTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#E8DFC8',
  },
  totalCarrito: { fontSize: 22, fontWeight: 'bold', color: '#4A3B29' },
  botonPrimario: {
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#6B4F35',
  },
  textoBotonPrimario: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  botonSecundario: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#E8DFC8',
  },

  /* Estilos de la pestaña Sensores */
  lista: {
    flex: 1,
  },
  panelSensor: {
    paddingBottom: ESPACIO_INFERIOR + 20,
  },
  tituloSensor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C4A32',
    marginBottom: 8,
  },
  avisoSensor: {
    marginVertical: 8,
    fontSize: 13,
    color: '#6B5D49',
  },
  textoSensor: {
    color: '#4A3B29',
    marginTop: 2,
  },
  controlesSensor: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  botonSensor: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#D8CBB0',
  },
  textoBotonSensor: {
    color: '#4A3B29',
    fontWeight: '600',
  },
  estadoSensor: {
    marginVertical: 10,
    color: '#5C4A32',
    fontWeight: '600',
  },
  tarjetaSensor: {
    marginVertical: 6,
    padding: 16,
    backgroundColor: '#FBF7EE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  nombreSensor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A3B29',
    marginBottom: 4,
  },
  pista: {
    height: 100,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    backgroundColor: '#E8DFC8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pistaDerecha: { alignItems: 'flex-end' },
  pistaIzquierda: { alignItems: 'flex-start' },
  indicador: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B4F35',
  },

  /* Mejora C: nivel con tres zonas */
  nivel: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  zona: {
    flex: 1,
    height: 70,
    margin: 4,
    borderRadius: 10,
    backgroundColor: '#D8CBB0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zonaActiva: { backgroundColor: '#6B4F35' },
  textoZona: { color: '#4A3B29', fontWeight: '600' },
  textoZonaActivo: { color: 'white' },

  /* Guía de teléfono plano */
  guiaPlano: {
    marginVertical: 8,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#E8DFC8',
  },
  guiaPlanoOk: { backgroundColor: '#4B7F2E' },
  textoGuia: { color: '#4A3B29', fontWeight: '600' },
  textoGuiaOk: { color: 'white' },

  /* Carta en 3D y selector de favoritas */
  selectorCartas: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 4 },
  chipCarta: {
    paddingVertical: 10, paddingHorizontal: 14, margin: 4, minHeight: 44,
    borderRadius: 18, backgroundColor: '#D8CBB0', justifyContent: 'center',
  },
  chipCartaActivo: { backgroundColor: '#6B4F35' },
  textoChip: { color: '#4A3B29', fontWeight: '600' },
  textoChipActivo: { color: 'white' },
  escenario3D: { alignItems: 'center', marginVertical: 12, paddingVertical: 12 },
  contenedor3D: { width: 240 },
  sombraCarta3D: {
    position: 'absolute', top: 10, left: 6, right: -6, bottom: -10,
    borderRadius: 18, backgroundColor: 'rgba(74,59,41,0.18)',
  },
  carta3D: {
    width: 240, padding: 16, borderRadius: 18, borderWidth: 3,
    backgroundColor: '#FBF7EE', alignItems: 'center',
  },
  imagenCarta3D: { width: 190, height: 190 },
  nombreCarta3D: { fontSize: 18, fontWeight: 'bold', color: '#4A3B29', marginTop: 8 },
  precioCarta3D: { fontSize: 16, fontWeight: 'bold', color: '#6B4F35', marginTop: 8 },

  tarjetaFavorita: { borderColor: '#6B4F35', borderWidth: 2 },
  tarjetaSeleccionada: { backgroundColor: '#EFF7FC', borderColor: '#2F6DB5', borderWidth: 2 },
  botonFavorito: {
    alignSelf: 'flex-start', marginTop: 6, paddingVertical: 10,
    paddingHorizontal: 14, minHeight: 44, justifyContent: 'center',
    borderRadius: 8, backgroundColor: '#E8DFC8',
  },
  botonCarrito: { backgroundColor: '#6B4F35' },
  textoBotonCarrito: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
  textoFavorito: { fontSize: 13, fontWeight: 'bold', color: '#4A3B29' },
  bannerExito: { backgroundColor: '#E3F0D8', borderColor: '#4B7F2E', borderWidth: 2 },
  bannerError: { backgroundColor: '#F8DDD6', borderColor: '#B5442E', borderWidth: 2 },
  mensajeBannerFuerte: { fontSize: 14, color: '#4A3B29', fontWeight: 'bold' },

  /* Banner compacto: miniaturas en una sola fila con scroll horizontal */
  scrollImagenesFavoritas: { marginTop: 8, flexGrow: 0 },
  filaImagenesFavoritas: { flexDirection: 'row', alignItems: 'flex-start' },
  tarjetaImagenFavorita: { width: 84, alignItems: 'center', marginRight: 8 },
  imagenFavorita: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: '#EFE6D2',
  },
  nombreImagenFavorita: { width: 80, marginTop: 3, textAlign: 'center', fontSize: 11, color: '#5C4A32' },
  filaBotonesBanner: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 },
  bannerFavorito: {
    backgroundColor: '#FBF7EE', padding: 12, borderRadius: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#E8DFC8',
  },
  textoBanner: { fontSize: 14, fontWeight: 'bold', color: '#5C4A32' },
  mensajeBanner: { fontSize: 12, color: '#6B5D49', marginTop: 2 },
});