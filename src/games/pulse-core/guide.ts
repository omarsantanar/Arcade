/** Contenido de incorporación de Pulse Core, separado de React/Phaser. */
export const PULSE_GUIDE_KEY = 'arcade:pulse-core:guide-v1';
export const PULSE_GUIDE_STEPS = [
  {
    title: 'Gira anillos completos',
    lead: 'Selecciona uno de los tres anillos y muévelo una posición para acercar símbolos iguales.',
    detail: 'En el celular: toca el anillo y desliza a la izquierda o derecha. También puedes usar los botones ← →. En computadora: ↑ ↓ eligen anillo y ← → lo giran.',
    hint: 'El contorno cian indica qué anillo estás moviendo.',
  },
  {
    title: 'Conecta tres símbolos iguales',
    lead: 'Hay dos formas de descargar energía: en línea recta entre los tres anillos, o en un arco de tres posiciones consecutivas del mismo anillo.',
    detail: 'Círculo cian, rombo magenta y triángulo violeta son frecuencias distintas. Solo se unen símbolos idénticos. Al completar una conexión, las tres fichas desaparecen y sumas puntos.',
    hint: 'No necesitas completar una fila ni llenar el reactor.',
  },
  {
    title: 'Evita que se sature',
    lead: 'Cada pulso crea una ficha en el anillo exterior. Otras avanzan hacia el centro cuando tienen espacio.',
    detail: 'Si el anillo exterior se llena y no puede recibir fichas, sube el contador de saturación. Tres bloqueos acumulados terminan la partida. Las descargas liberan espacio y reducen ese contador.',
    hint: 'Consejo: busca posibles combinaciones antes de que el anillo exterior esté lleno.',
  },
] as const;
