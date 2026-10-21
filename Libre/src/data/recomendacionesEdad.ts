/**
 * Recomendaciones por grupo de edad para familias con intolerancias / alergias.
 *
 * IMPORTANTE: son consejos generales de carácter informativo, no un criterio médico.
 * Están pensados sobre todo para la seguridad frente a alérgenos y atragantamientos,
 * no para pautar dietas. La etiqueta física y el pediatra / médico mandan siempre.
 */

export interface GrupoEdad {
  id: string;
  nombre: string;
  emoji: string;
  /** Rango de edad en años, ambos inclusive. */
  min: number;
  max: number;
  /** Frase corta que resume el enfoque de esta etapa. */
  resumen: string;
  /** Consejos concretos, ordenados de más a menos importante. */
  consejos: string[];
}

export const GRUPOS_EDAD: GrupoEdad[] = [
  {
    id: 'bebe',
    nombre: 'Bebé (0-1 año)',
    emoji: '👶',
    min: 0,
    max: 1,
    resumen: 'Introducción de alimentos con guía del pediatra.',
    consejos: [
      'Nada de miel antes del año (riesgo de botulismo).',
      'Introduce los alérgenos de uno en uno, unos días entre cada uno, para poder identificar reacciones.',
      'Nada de frutos secos enteros ni trozos duros: riesgo de atragantamiento. Mejor en crema o muy molidos, si el pediatra lo indica.',
      'La leche de vaca no debe ser la bebida principal antes del año.',
      'Ante cualquier duda sobre cómo introducir un alérgeno, consulta con el pediatra.',
    ],
  },
  {
    id: 'nino-pequeno',
    nombre: 'Niño pequeño (1-3 años)',
    emoji: '🧒',
    min: 1,
    max: 3,
    resumen: 'Cuidado con texturas y con alérgenos nuevos.',
    consejos: [
      'Frutos secos enteros, no: siguen siendo riesgo de atragantamiento hasta los 4-5 años. Mejor molidos o en crema.',
      'Vigila la sal y el azúcar añadidos: revisa la tabla nutricional del producto.',
      'Al probar un alimento nuevo con alérgenos, hazlo en casa y en horario en que puedas observar al niño.',
      'Enséñale pronto que no debe compartir comida sin que un adulto lo revise.',
    ],
  },
  {
    id: 'nino',
    nombre: 'Niño (4-9 años)',
    emoji: '👧',
    min: 4,
    max: 9,
    resumen: 'Autonomía guiada y avisar en el entorno.',
    consejos: [
      'Empieza a enseñarle a reconocer sus alérgenos y a preguntar antes de comer algo que no conoce.',
      'Avisa al comedor escolar, cumpleaños y actividades de sus alergias por escrito.',
      'Ten claro y a mano el protocolo de actuación ante una reacción (y la medicación, si el médico la ha pautado).',
      'Usa el escáner y el analizador de etiquetas con él: convertirlo en un hábito compartido ayuda.',
    ],
  },
  {
    id: 'adolescente',
    nombre: 'Adolescente (10-17 años)',
    emoji: '🧑',
    min: 10,
    max: 17,
    resumen: 'Que gestione sus alergias con más independencia.',
    consejos: [
      'Que sepa llevar y usar su medicación de rescate (por ejemplo, autoinyector) si el médico se la ha pautado.',
      'Las comidas fuera de casa y con amigos son el momento de más riesgo: que pregunte por los ingredientes sin apuro.',
      'Enséñale a leer etiquetas él mismo, incluida la parte de "puede contener trazas".',
      'Repasad juntos qué hacer y a quién avisar si empieza una reacción.',
    ],
  },
  {
    id: 'adulto',
    nombre: 'Adulto (18-64 años)',
    emoji: '🧑',
    min: 18,
    max: 64,
    resumen: 'Revisar etiquetas e informar al comer fuera.',
    consejos: [
      'Revisa la etiqueta física aunque un producto te saliera "apto" otras veces: las recetas cambian.',
      'Al comer fuera, informa siempre de tus alergias; en la UE los restaurantes deben poder decirte los alérgenos de cada plato.',
      'Si tu alergia es grave, lleva tu medicación de rescate contigo.',
    ],
  },
  {
    id: 'mayor',
    nombre: 'Persona mayor (65+ años)',
    emoji: '👵',
    min: 65,
    max: 120,
    resumen: 'Ojo con interacciones y con la letra pequeña.',
    consejos: [
      'Algunos alimentos y aditivos pueden interferir con la medicación: consulta con tu médico o farmacéutico ante la duda.',
      'Si te cuesta leer la etiqueta, apóyate en el escáner y en el analizador de fotos de la app para ampliarla.',
      'Mantén una lista actualizada de tus intolerancias por si alguien tiene que ayudarte con la compra.',
    ],
  },
];

/** Devuelve el grupo de edad correspondiente, o null si la edad no está indicada o es inválida. */
export function grupoPorEdad(edad: number | null): GrupoEdad | null {
  if (edad == null || Number.isNaN(edad) || edad < 0) return null;
  return GRUPOS_EDAD.find((g) => edad >= g.min && edad <= g.max) ?? null;
}

/**
 * Avisos por categoría de producto según la edad. Se disparan cuando la edad del perfil es
 * menor o igual a `maxEdad`. Las categorías se comparan contra el nombre YA TRADUCIDO al
 * español que devuelve `traducirCategoria` (el que se guarda en `producto.categoria`).
 * Son avisos de seguridad (atragantamiento, sal, azúcar), no juicios sobre si el producto es apto.
 */
interface ReglaAviso {
  /** Nombres de categoría (en español, como se muestran) que disparan el aviso. */
  categorias: string[];
  /** Se muestra si la edad del perfil es <= maxEdad. */
  maxEdad: number;
  texto: string;
}

const REGLAS_AVISO: ReglaAviso[] = [
  {
    categorias: ['Frutos secos'],
    maxEdad: 4,
    texto:
      'Los frutos secos enteros son un riesgo de atragantamiento hasta los 4-5 años. Mejor molidos o en crema.',
  },
  {
    categorias: ['Productos apícolas'],
    maxEdad: 0,
    texto: 'No des miel a bebés menores de 1 año: riesgo de botulismo.',
  },
  {
    categorias: ['Snacks salados', 'Patatas fritas', 'Caldos'],
    maxEdad: 3,
    texto: 'Vigila la sal: en niños pequeños conviene limitar los alimentos muy salados.',
  },
  {
    categorias: ['Dulces', 'Galletas y bollería', 'Postres', 'Cacao'],
    maxEdad: 3,
    texto: 'Vigila el azúcar añadido en niños pequeños.',
  },
  {
    categorias: ['Complementos alimenticios'],
    maxEdad: 12,
    texto: 'Consulta con el pediatra antes de dar complementos alimenticios a un niño.',
  },
];

/**
 * Devuelve los avisos de seguridad para una categoría de producto y una edad.
 * Vacío si no hay edad indicada o ninguna regla aplica.
 */
export function avisosCategoria(categoria: string, edad: number | null): string[] {
  if (edad == null || Number.isNaN(edad) || edad < 0) return [];
  const cat = categoria.trim().toLowerCase();
  return REGLAS_AVISO.filter(
    (r) => edad <= r.maxEdad && r.categorias.some((c) => c.toLowerCase() === cat)
  ).map((r) => r.texto);
}
