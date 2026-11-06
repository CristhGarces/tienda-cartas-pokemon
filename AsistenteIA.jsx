import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { clasificar } from './modeloIA';

export default function AsistenteIA({ productos }) {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [indice, setIndice] = useState(0);
  const { width } = useWindowDimensions();
  const producto = productos[indice % Math.max(productos.length, 1)];
  function consultar() {
    if (!pregunta.trim()) { setRespuesta('Escribe una pregunta antes de consultar.'); return; }
    if (!producto) { setRespuesta('No hay productos disponibles en los datos recibidos.'); return; }
    const r = clasificar(pregunta);
    if (!r.intencion) { setRespuesta('No identifico una sola intención. Pregunta por nombre, precio o descripción.'); return; }
    const valor = producto[r.intencion];
    const dato = valor === undefined || valor === null || String(valor).trim() === ''
      ? 'Dato no registrado en el catálogo.' : String(valor);
    setRespuesta(`Intención: ${r.intencion}. Similitud: ${r.puntuacion.toFixed(2)}.\nDato del catálogo: ${dato}`);
  }
  return (
    <ScrollView style={s.pantalla} contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">
      <Text style={s.titulo}>Asistente del catálogo</Text>
      <Text>Modelo local didáctico. Reconoce tres intenciones y puede equivocarse.</Text>
      <Text style={s.producto}>Producto seleccionado: {producto?.nombre ?? 'Sin nombre'}</Text>
      <Pressable accessibilityRole="button" style={s.boton} onPress={() => { setIndice(i => i + 1); setRespuesta(''); }}>
        <Text style={s.blanco}>Siguiente producto</Text>
      </Pressable>
      <Text accessibilityRole="header">Pregunta por su nombre, precio o descripción:</Text>
      <View style={[s.formulario, width >= 600 && s.fila]}>
        <TextInput value={pregunta} onChangeText={t => { setPregunta(t); setRespuesta(''); }}
          placeholder="Ejemplo: ¿cuánto cuesta?" accessibilityLabel="Pregunta sobre el producto seleccionado"
          style={s.entrada} multiline />
        <Pressable accessibilityRole="button" style={s.boton} onPress={consultar}><Text style={s.blanco}>Consultar</Text></Pressable>
      </View>
      <Text style={s.resultado} accessibilityLiveRegion="polite">{respuesta || 'Aquí aparecerá el resultado.'}</Text>
      <Text>La similitud no es un porcentaje de certeza. La respuesta usa los datos del producto seleccionado.</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  pantalla: { flex: 1, minHeight: 0 },
  contenido: { padding: 16, gap: 16 },
  titulo: { fontSize: 24, fontWeight: 'bold', color: '#15334e' },
  producto: { fontSize: 18 },
  formulario: { gap: 12 }, fila: { flexDirection: 'row', alignItems: 'center' },
  entrada: { flex: 1, minWidth: 0, minHeight: 52, borderWidth: 1, borderColor: '#61758a', borderRadius: 8, padding: 12, backgroundColor: 'white' },
  boton: { padding: 14, backgroundColor: '#126d80', borderRadius: 8, alignSelf: 'flex-start' },
  blanco: { color: 'white', fontWeight: 'bold' }, resultado: { padding: 16, backgroundColor: '#e9f0f6', fontSize: 17 },
});