/* Importaciones */
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, FlatList, Image, useWindowDimensions } from 'react-native';

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
  const [pestana, setPestana] = React.useState('original');

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tienda de Cartas Pokémon</Text>
      <Text style={styles.subtitulo}>Original vs Optimizada</Text>

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
      </View>

      {pestana === 'original' && <PantallaOriginal />}
      {pestana === 'optimizada' && <PantallaOptimizada />}
      {pestana === 'adaptativa' && <PantallaAdaptativa />}
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
const TarjetaAdaptativa = React.memo(function TarjetaAdaptativa({ producto }) {
  return (
    <View style={styles.tarjetaAdaptativa}>
      <Image source={{ uri: producto.imagenUrl }} style={styles.imagen} />
      <View style={styles.infoTarjeta}>
        <Text style={styles.nombre}>{producto.nombre}</Text>
        <View style={[styles.badgeTipo, { backgroundColor: producto.tipo.color }]}>
          <Text style={styles.textoBadge}>{producto.tipo.nombre}</Text>
        </View>
        <Text style={styles.descripcion}>{producto.descripcion}</Text>
      </View>
      <Text style={styles.precio}>{producto.precio}</Text>
    </View>
  );
});

/* Pantalla Adaptativa: cambia columnas según el ancho disponible */
/* Pantalla Adaptativa: cambia columnas y reorganiza el resumen según el ancho disponible */
function PantallaAdaptativa() {
  const { width } = useWindowDimensions();

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
      </View>

      <FlatList
        key={`lista-${columnas}`}
        data={productos}
        numColumns={columnas}
        keyExtractor={(item) => item.id.toString()}
        initialNumToRender={12}
        renderItem={({ item }) => (
          <TarjetaAdaptativa producto={item} />
        )}
        columnWrapperStyle={columnas > 1 ? styles.fila : undefined}
        contentContainerStyle={styles.listaContenido}
      />
    </View>
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
    gap: 10,
    marginVertical: 20,
  },
  pestana: {
    flex: 1,
    padding: 14,
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
  },
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
});