import { DietaId, IntoleranciaId } from './intolerancias';
import { RECETAS_EXTRA } from './recetasExtra';

export type Momento = 'Desayuno' | 'Comida' | 'Merienda' | 'Cena' | 'Postre';

export interface Receta {
  id: string;
  nombre: string;
  emoji: string;
  momento: Momento;
  tiempoMin: number;
  dificultad: 'Fácil' | 'Media' | 'Alta';
  costeAprox: '€' | '€€' | '€€€';
  personasBase: number;
  /** Intolerancias presentes en la receta tal cual está escrita */
  contiene: IntoleranciaId[];
  dietas?: DietaId[];
  ingredientes: string[];
  preparacion: string[];
}

const RECETAS_BASE: Receta[] = [
  {
    id: 'r1',
    nombre: 'Pollo al horno con patata y zanahoria',
    emoji: '🍗',
    momento: 'Cena',
    tiempoMin: 35,
    dificultad: 'Fácil',
    costeAprox: '€€',
    personasBase: 2,
    contiene: [],
    ingredientes: ['2 pechugas de pollo', '2 patatas', '2 zanahorias', 'Aceite de oliva', 'Sal', 'Romero'],
    preparacion: [
      'Precalienta el horno a 200°C.',
      'Corta las patatas y zanahorias en rodajas y colócalas en una bandeja.',
      'Añade el pollo, riega con aceite, sal y romero.',
      'Hornea 30-35 minutos hasta que el pollo esté dorado.',
    ],
  },
  {
    id: 'r2',
    nombre: 'Ensalada de pasta de lentejas',
    emoji: '🥗',
    momento: 'Comida',
    tiempoMin: 20,
    dificultad: 'Fácil',
    costeAprox: '€',
    personasBase: 2,
    contiene: [],
    ingredientes: ['200g pasta de lentejas rojas', 'Pepino', 'Zanahoria rallada', 'Aceite de oliva', 'Limón', 'Sal'],
    preparacion: [
      'Cuece la pasta de lentejas según el envase y enfría bajo el grifo.',
      'Corta el pepino y ralla la zanahoria.',
      'Mezcla todo con aceite, limón y sal.',
    ],
  },
  {
    id: 'r3',
    nombre: 'Tortilla de calabacín sin huevo (versión vegana)',
    emoji: '🍳',
    momento: 'Cena',
    tiempoMin: 25,
    dificultad: 'Media',
    costeAprox: '€',
    personasBase: 2,
    contiene: [],
    ingredientes: ['1 calabacín', 'Harina de garbanzo', 'Agua', 'Cebolla', 'Sal', 'Cúrcuma'],
    preparacion: [
      'Mezcla harina de garbanzo con agua hasta obtener una masa tipo huevo batido.',
      'Saltea el calabacín y la cebolla en una sartén.',
      'Añade la mezcla de garbanzo y cuaja a fuego medio por ambos lados.',
    ],
  },
  {
    id: 'r4',
    nombre: 'Yogur con fruta y avena',
    emoji: '🥣',
    momento: 'Desayuno',
    tiempoMin: 5,
    dificultad: 'Fácil',
    costeAprox: '€',
    personasBase: 1,
    contiene: ['gluten'],
    ingredientes: ['1 yogur natural sin lactosa', 'Copos de avena', 'Plátano', 'Canela'],
    preparacion: ['Corta el plátano.', 'Mezcla el yogur con la avena y el plátano.', 'Añade canela al gusto.'],
  },
  {
    id: 'r5',
    nombre: 'Salteado de arroz con verduras',
    emoji: '🍚',
    momento: 'Comida',
    tiempoMin: 25,
    dificultad: 'Fácil',
    costeAprox: '€',
    personasBase: 2,
    contiene: [],
    ingredientes: ['200g arroz', 'Pimiento', 'Zanahoria', 'Guisantes', 'Aceite de oliva', 'Sal', 'Cúrcuma'],
    preparacion: [
      'Cuece el arroz y resérvalo.',
      'Saltea las verduras troceadas en una sartén con aceite.',
      'Añade el arroz cocido y saltea todo junto 5 minutos.',
    ],
  },
  {
    id: 'r6',
    nombre: 'Tostadas de pan sin gluten con aguacate',
    emoji: '🥑',
    momento: 'Desayuno',
    tiempoMin: 10,
    dificultad: 'Fácil',
    costeAprox: '€',
    personasBase: 1,
    contiene: [],
    ingredientes: ['2 rebanadas de pan sin gluten', '1 aguacate', 'Sal', 'Limón', 'Aceite de oliva'],
    preparacion: [
      'Tuesta el pan sin gluten.',
      'Machaca el aguacate con limón, sal y un chorro de aceite.',
      'Unta el aguacate sobre las tostadas.',
    ],
  },
  {
    id: 'r7',
    nombre: 'Merluza al horno con patatas panaderas',
    emoji: '🐟',
    momento: 'Cena',
    tiempoMin: 40,
    dificultad: 'Media',
    costeAprox: '€€',
    personasBase: 2,
    contiene: ['pescado'],
    ingredientes: ['2 filetes de merluza', '2 patatas', 'Cebolla', 'Aceite de oliva', 'Sal', 'Perejil'],
    preparacion: [
      'Corta patatas y cebolla en láminas finas y colócalas en la bandeja con aceite y sal.',
      'Hornea 20 minutos a 200°C.',
      'Añade la merluza encima, riega con un poco de aceite y hornea 15 minutos más.',
    ],
  },
  {
    id: 'r8',
    nombre: 'Crema de calabaza sin lactosa',
    emoji: '🎃',
    momento: 'Comida',
    tiempoMin: 30,
    dificultad: 'Fácil',
    costeAprox: '€',
    personasBase: 3,
    contiene: [],
    ingredientes: ['500g calabaza', '1 patata', 'Bebida de avena', 'Cebolla', 'Sal', 'Aceite de oliva'],
    preparacion: [
      'Saltea la cebolla en una olla con aceite.',
      'Añade la calabaza y la patata troceadas, cubre con agua y cuece 20 minutos.',
      'Tritura añadiendo un chorro de bebida de avena hasta conseguir una crema fina.',
    ],
  },
  {
    id: 'r9',
    nombre: 'Bowl de tofu salteado con arroz',
    emoji: '🥘',
    momento: 'Cena',
    tiempoMin: 25,
    dificultad: 'Media',
    costeAprox: '€€',
    personasBase: 2,
    contiene: ['soja'],
    ingredientes: ['200g tofu firme', 'Arroz', 'Pimiento', 'Zanahoria', 'Salsa de soja', 'Aceite de sésamo'],
    preparacion: [
      'Corta el tofu en dados y dóralo en la sartén con un poco de aceite.',
      'Saltea las verduras en la misma sartén.',
      'Sirve sobre arroz cocido y riega con la salsa de soja.',
    ],
  },
  {
    id: 'r10',
    nombre: 'Batido de plátano y bebida de soja',
    emoji: '🥤',
    momento: 'Desayuno',
    tiempoMin: 5,
    dificultad: 'Fácil',
    costeAprox: '€',
    personasBase: 1,
    contiene: ['soja'],
    ingredientes: ['1 plátano', '200ml bebida de soja', 'Canela'],
    preparacion: ['Tritura el plátano con la bebida de soja.', 'Sirve con canela por encima.'],
  },
];

export const RECETAS: Receta[] = [...RECETAS_BASE, ...RECETAS_EXTRA];

export function recetaEsCompatible(receta: Receta, intolerancias: IntoleranciaId[]): boolean {
  return !receta.contiene.some((i) => intolerancias.includes(i));
}
