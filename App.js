/* Importaciones */
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Image,
  FlatList, Pressable, useWindowDimensions, Platform, Animated,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import AsyncStorage from '@react-native-async-storage/async-storage';
import AsistenteIA from './AsistenteIA';

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

const tiposPokemon = [
  { nombre: 'Fuego', color: '#E8703A' },
  { nombre: 'Agua', color: '#4A90D9' },
  { nombre: 'Planta', color: '#6FA84B' },
  { nombre: 'Eléctrico', color: '#E0B23C' },
  { nombre: 'Psíquico', color: '#C767A8' },
  { nombre: 'Normal', color: '#A0977A' },
  { nombre: 'Fantasma', color: '#6C5B9E' },
  { nombre: 'Dragón', color: '#5B6FCE' },
  { nombre: 'Lucha', color: '#B5442E' },
  { nombre: 'Roca', color: '#A69562' },
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

/* Datos de prueba: 1000 cartas Pokémon */
const productos = Array.from({ length: 1000 }, (_, index) => {
  const nombreBase = nombresPokemon[index % nombresPokemon.length];
  const numeroPokedex = pokedexPorNombre[nombreBase];
  const tipo = tiposPokemon.find((t) => t.nombre === tipoPorNombre[nombreBase]);
  const rareza = rarezas[index % rarezas.length];
  const [precioMin, precioMax] = rangoPrecioPorRareza[rareza];
  const precio = precioMin + Math.random() * (precioMax - precioMin);

  return {
    id: index + 1,
    nombre: `${nombreBase} #${index + 1}`,
    descripcion: `Tipo ${tipo.nombre} · ${rareza}`,
    precio: `$${precio.toFixed(2)}`,
    tipo,
    imagenUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${numeroPokedex}.png`,
  };
});

/* Componente Principal: App */
export default function App() {
  const [pestana, setPestana] = React.useState('adaptativa');
  // Agregué este estado en App para que la selección no se pierda al cambiar de pestaña.
  const [cartasSeleccionadas, setCartasSeleccionadas] = React.useState([]);
  const [listaCargada, setListaCargada] = React.useState(false);
  // Sesión 10: muestra el asistente de IA local sin reemplazar las pestañas existentes.
  const [mostrarIA, setMostrarIA] = React.useState(false);

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

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tienda de Cartas Pokémon</Text>
      <Text style={styles.subtitulo}>Original, Optimizada, Adaptativa y Sensores</Text>

      <View style={styles.pestanas}>
        <Pressable
          style={[styles.pestana, pestana === 'original' && styles.pestanaActiva]}
          onPress={() => setPestana('original')}
        >
          <Text style={styles.textoPestana}>Original</Text>
        </Pressable>

        <Pressable
          style={[styles.pestana, pestana === 'optimizada' && styles.pestanaActiva]}
          onPress={() => setPestana('optimizada')}
        >
          <Text style={styles.textoPestana}>Optimizada</Text>
        </Pressable>

        <Pressable
          style={[styles.pestana, pestana === 'adaptativa' && styles.pestanaActiva]}
          onPress={() => setPestana('adaptativa')}
        >
          <Text style={styles.textoPestana}>Adaptativa</Text>
        </Pressable>

        <Pressable
          style={[styles.pestana, pestana === 'sensores' && styles.pestanaActiva]}
          onPress={() => setPestana('sensores')}
        >
          <Text style={styles.textoPestana}>Sensores</Text>
        </Pressable>
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
          {pestana === 'original' && <PantallaOriginal />}
          {pestana === 'optimizada' && <PantallaOptimizada />}
          {pestana === 'adaptativa' && (
            <PantallaAdaptativa
              cartasSeleccionadas={cartasSeleccionadas}
              onAlternarSeleccion={alternarSeleccion}
            />
          )}
          {pestana === 'sensores' && <PantallaSensores cartasSeleccionadas={cartasSeleccionadas} />}
        </>
      )}
    </View>
  );
}

/* Simula un cálculo pesado e innecesario en cada render */
function calculoPesado(id) {
  let resultado = 0;
  for (let i = 0; i < 50000; i++) {
    resultado += Math.sqrt(i) * id;
  }
  return resultado.toFixed(2);
}

/* Pantalla Original: ScrollView, sin virtualizar, con cálculo pesado repetido */
function PantallaOriginal() {
  console.log('Render PantallaOriginal');

  return (
    <ScrollView>
      {productos.map((producto) => {
        const pesoCalculado = calculoPesado(producto.id);

        return (
          <View key={producto.id} style={styles.tarjeta}>
            <Image source={{ uri: producto.imagenUrl }} style={styles.imagen} />
            <View style={styles.infoTarjeta}>
              <Text style={styles.nombre}>{producto.nombre}</Text>
              <View style={[styles.badgeTipo, { backgroundColor: producto.tipo.color }]}>
                <Text style={styles.textoBadge}>{producto.tipo.nombre}</Text>
              </View>
              <Text style={styles.descripcion}>{producto.descripcion}</Text>
              <Text style={{ fontSize: 9, color: '#a89a82' }}>calc: {pesoCalculado}</Text>
            </View>
            <Text style={styles.precio}>{producto.precio}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const NUM_COLUMNAS = 2;
const ALTURA_TARJETA_GRID = 210; // imagen cuadrada + texto, por fila

/* Tarjeta memorizada en formato grid: imagen grande arriba, info compacta abajo */
const TarjetaProductoGrid = React.memo(function TarjetaProductoGrid({ producto }) {
  return (
    <View style={styles.tarjetaGrid}>
      <Image source={{ uri: producto.imagenUrl }} style={styles.imagenGrid} />
      <Text style={styles.nombreGrid} numberOfLines={1}>{producto.nombre}</Text>
      <View style={[styles.badgeTipo, { backgroundColor: producto.tipo.color }]}>
        <Text style={styles.textoBadge}>{producto.tipo.nombre}</Text>
      </View>
      <Text style={styles.precioGrid}>{producto.precio}</Text>
    </View>
  );
});

/* Pantalla Optimizada: FlatList virtualizado, grid de 2 columnas */
function PantallaOptimizada() {
  console.log('Render PantallaOptimizada');

  return (
    <FlatList
      data={productos}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => <TarjetaProductoGrid producto={item} />}
      numColumns={NUM_COLUMNAS}
      columnWrapperStyle={styles.filaGrid}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={3}
      removeClippedSubviews={true}
      getItemLayout={(data, index) => {
        const fila = Math.floor(index / NUM_COLUMNAS);
        return {
          length: ALTURA_TARJETA_GRID,
          offset: ALTURA_TARJETA_GRID * fila,
          index,
        };
      }}
    />
  );
}

/* Tarjeta para la pantalla Adaptativa */
const TarjetaAdaptativa = React.memo(function TarjetaAdaptativa({
  producto,
  esFavorito,
  seleccionada,
  onAlternarSeleccion,
}) {
  return (
    <View
      style={[
        styles.tarjetaAdaptativa,
        seleccionada && styles.tarjetaSeleccionada,
        esFavorito && styles.tarjetaFavorita,
      ]}
    >
      <Image source={{ uri: producto.imagenUrl }} style={styles.imagen} />
      <View style={styles.infoTarjeta}>
        <Text style={styles.nombre}>{producto.nombre}</Text>
        <View style={[styles.badgeTipo, { backgroundColor: producto.tipo.color }]}>
          <Text style={styles.textoBadge}>{producto.tipo.nombre}</Text>
        </View>
        <Text style={styles.descripcion}>{producto.descripcion}</Text>
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
      </View>
      <Text style={styles.precio}>{producto.precio}</Text>
    </View>
  );
});

/* Muestra las miniaturas y los nombres de las cartas que aparecen en el recuadro.
  Recibe sus IDs y busca los datos completos en el catálogo. */
function ImagenesFavoritas({ favoritos }) {
  // Busco imagen y nombre en el catálogo para cada carta del recuadro.
  const cartas = favoritos
    .map((f) => productos.find((p) => p.id === f.id))
    .filter(Boolean);

  if (cartas.length === 0) return null;

  return (
    <View style={styles.filaImagenesFavoritas}>
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
    </View>
  );
}

/* Pantalla Adaptativa: cambia columnas y reorganiza el resumen según el ancho disponible */
function PantallaAdaptativa({ cartasSeleccionadas, onAlternarSeleccion }) {
  const { width } = useWindowDimensions();

  const [favorito, setFavorito] = useState(null);
  const [mensaje, setMensaje] = useState('Pulsa "Marcar como favorita" para agregar o quitar cartas del recuadro.');
  const [tipoMensaje, setTipoMensaje] = useState('info');

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

  return (
    <View style={styles.pantallaAdaptativa}>
      <View style={[styles.resumen, esDispositivoGrande && styles.resumenGrande]}>
        <View style={styles.resumenItem}>
          <Text style={styles.resumenLabel}>Cartas</Text>
          <Text style={styles.resumenValor}>{productos.length}</Text>
        </View>
        <View style={styles.resumenItem}>
          <Text style={styles.resumenLabel}>Dispositivo</Text>
          <Text style={styles.resumenValor}>{tipoDispositivo}</Text>
        </View>
        <View style={styles.resumenItem}>
          <Text style={styles.resumenLabel}>Columnas</Text>
          <Text style={styles.resumenValor}>{columnas}</Text>
        </View>
        {/* Muestro cuántas cartas hay en el recuadro de favoritas. */}
        <View style={styles.resumenItem}>
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
        <Text style={[styles.mensajeBanner, tipoMensaje !== 'info' && styles.mensajeBannerFuerte]}>
          {mensaje}
        </Text>
        {/* Muestro imagen y nombre de cada carta seleccionada o guardada. */}
        <ImagenesFavoritas favoritos={favoritosDelRecuadro} />
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

      {/* Incluí los IDs en extraData para que la lista actualice cada carta seleccionada. */}
      <FlatList
        key={`lista-${columnas}`}
        data={productos}
        numColumns={columnas}
        keyExtractor={(item) => item.id.toString()}
        initialNumToRender={12}
        extraData={`${favorito?.id}-${cartasSeleccionadas.join(',')}`}
        renderItem={({ item }) => (
          <TarjetaAdaptativa
            producto={item}
            esFavorito={favorito?.id === item.id}
            seleccionada={cartasSeleccionadas.includes(item.id)}
            onAlternarSeleccion={alternarConMensaje}
          />
        )}
        columnWrapperStyle={columnas > 1 ? styles.fila : undefined}
        contentContainerStyle={styles.listaContenido}
      />
    </View>
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
          styles.carta3D,
          {
            borderColor: carta.tipo.color,
            transform: [{ perspective: 800 }, { rotateX: giroX }, { rotateY: giroY }],
          },
        ]}
        accessible
        accessibilityLabel={`Carta ${carta.nombre} en 3D. Inclina el teléfono para moverla.`}
      >
        <Image source={{ uri: carta.imagenUrl }} style={styles.imagenCarta3D} resizeMode="contain" />
        <Text style={styles.nombreCarta3D}>{carta.nombre}</Text>
        <View style={[styles.badgeTipo, { backgroundColor: carta.tipo.color }]}>
          <Text style={styles.textoBadge}>{carta.tipo.nombre}</Text>
        </View>
        <Text style={styles.precioCarta3D}>{carta.precio}</Text>
      </Animated.View>
    </View>
  );
}

/* Pantalla Sensores: acelerómetro real o simulado */
function PantallaSensores({ cartasSeleccionadas }) {
  const [datos, setDatos] = useState({ x: 0, y: 0, z: 0 });
  const [simulados, setSimulados] = useState({ x: 0, y: 0, z: 1 });
  const [modo, setModo] = useState("simulacion");
  const [estado, setEstado] = useState("Simulación: sin sensor físico");
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
    color: '#8A7A63',
    marginTop: 4,
  },
  pestanas: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 20,
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
  textoPestana: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
  tarjeta: {
    height: 96,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FBF7EE',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
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
    color: '#8A7A63',
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
  filaGrid: {
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  tarjetaGrid: {
    width: '48%',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FBF7EE',
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  imagenGrid: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: '#EADFC4',
  },
  nombreGrid: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4A3B29',
    marginTop: 6,
    textAlign: 'center',
  },
  precioGrid: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B4F35',
    marginTop: 4,
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
  fila: {
    gap: 12,
  },
  listaContenido: {
    paddingBottom: 20,
  },
  resumen: {
    backgroundColor: '#FBF7EE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8DFC8',
  },
  resumenGrande: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumenItem: {
    marginBottom: 8,
  },
  resumenLabel: {
    fontSize: 12,
    color: '#8A7A63',
  },
  resumenValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5C4A32',
  },

  /* Estilos de la pestaña Sensores */
  lista: {
    flex: 1,
  },
  panelSensor: {
    paddingBottom: 32,
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
    color: '#8A7A63',
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
  guiaPlanoOk: { backgroundColor: '#6FA84B' },
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
  carta3D: {
    width: 240, padding: 16, borderRadius: 18, borderWidth: 3,
    backgroundColor: '#FBF7EE', alignItems: 'center', elevation: 6,
  },
  imagenCarta3D: { width: 190, height: 190 },
  nombreCarta3D: { fontSize: 18, fontWeight: 'bold', color: '#4A3B29', marginTop: 8 },
  precioCarta3D: { fontSize: 16, fontWeight: 'bold', color: '#6B4F35', marginTop: 8 },

  tarjetaFavorita: { borderColor: '#6B4F35', borderWidth: 2 },
  tarjetaSeleccionada: { backgroundColor: '#EFF7FC', borderColor: '#4A90D9', borderWidth: 2 },
  botonFavorito: {
    alignSelf: 'flex-start', marginTop: 6, paddingVertical: 10,
    paddingHorizontal: 14, minHeight: 44, justifyContent: 'center',
    borderRadius: 8, backgroundColor: '#E8DFC8',
  },
  textoFavorito: { fontSize: 13, fontWeight: 'bold', color: '#4A3B29' },
  bannerExito: { backgroundColor: '#E3F0D8', borderColor: '#6FA84B', borderWidth: 2 },
  bannerError: { backgroundColor: '#F8DDD6', borderColor: '#B5442E', borderWidth: 2 },
  mensajeBannerFuerte: { fontSize: 14, color: '#4A3B29', fontWeight: 'bold' },
  /* Estilos para acomodar la miniatura y el nombre de cada carta del recuadro. */
  filaImagenesFavoritas: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  tarjetaImagenFavorita: { width: 108, alignItems: 'center', marginRight: 8, marginBottom: 8 },
  imagenFavorita: {
    width: 72, height: 72, borderRadius: 12, backgroundColor: '#EFE6D2',
  },
  nombreImagenFavorita: { width: 104, marginTop: 3, textAlign: 'center', fontSize: 11, color: '#5C4A32' },
  bannerFavorito: {
    backgroundColor: '#FBF7EE', padding: 12, borderRadius: 12,
    marginBottom: 12, borderWidth: 1, borderColor: '#E8DFC8',
  },
  textoBanner: { fontSize: 14, fontWeight: 'bold', color: '#5C4A32' },
  mensajeBanner: { fontSize: 12, color: '#8A7A63', marginTop: 2 },
});