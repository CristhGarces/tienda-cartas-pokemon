// Clasificador didáctico 1-NN: compara con ejemplos etiquetados.
export const ejemplos = [
  { texto: 'cuanto cuesta cual es el precio valor costo', intencion: 'precio' },
  { texto: 'quiero saber el importe que debo pagar', intencion: 'precio' },
  { texto: 'como se llama nombre del producto articulo', intencion: 'nombre' },
  { texto: 'dime el nombre o titulo del producto', intencion: 'nombre' },
  { texto: 'descripcion caracteristicas detalles del producto', intencion: 'descripcion' },
  { texto: 'explica para que sirve informacion del articulo', intencion: 'descripcion' },

  // Ejemplos agregados en la Sesión 10 (mejora propia)
  { texto: 'precio de la carta', intencion: 'precio' },
  { texto: 'valor de la carta', intencion: 'precio' },
  { texto: 'cuanto vale', intencion: 'precio' },
  { texto: 'nombre de la carta', intencion: 'nombre' },
  { texto: 'como se llama esta carta', intencion: 'nombre' },
  { texto: 'descripcion de la carta', intencion: 'descripcion' },
  { texto: 'detalles de esta carta', intencion: 'descripcion' },
];
const vacias = new Set(['el','la','los','las','de','del','un','una','que','es','en','y','o','me','lo','al','por','se','su','esta','este','carta']);
function tokens(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(t => t && !vacias.has(t));
}
function similitud(a, b) {
  const aa = new Set(a), bb = new Set(b);
  if (!aa.size || !bb.size) return 0;
  let comunes = 0;
  for (const t of aa) if (bb.has(t)) comunes++;
  return comunes / Math.sqrt(aa.size * bb.size);
}
export function clasificar(pregunta) {
  const entrada = tokens(pregunta);
  const mejores = new Map();
  for (const e of ejemplos) {
    const valor = similitud(entrada, tokens(e.texto));
    mejores.set(e.intencion, Math.max(mejores.get(e.intencion) || 0, valor));
  }
  const ranking = [...mejores].sort((a,b) => b[1] - a[1]);
  const [etiqueta, puntuacion] = ranking[0] || [null, 0];
  const diferencia = puntuacion - (ranking[1]?.[1] || 0);
  // Umbrales didácticos. No equivalen a probabilidades calibradas.
  return { intencion: puntuacion >= 0.2 && diferencia >= 0.08 ? etiqueta : null, puntuacion };
}