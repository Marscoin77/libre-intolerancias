export type IntoleranciaId =
  | 'gluten'
  | 'lactosa'
  | 'fructosa'
  | 'sorbitol'
  | 'frutos_secos'
  | 'cacahuete'
  | 'huevo'
  | 'pescado'
  | 'marisco'
  | 'soja'
  | 'sesamo'
  | 'mostaza'
  | 'apio'
  | 'sulfitos'
  | 'altramuces'
  | 'ajo'
  | 'cebolla'
  | 'tomate'
  | 'maiz'
  | 'legumbres';

export interface Intolerancia {
  id: IntoleranciaId;
  nombre: string;
  emoji: string;
}

export const INTOLERANCIAS: Intolerancia[] = [
  { id: 'gluten', nombre: 'Gluten', emoji: '🌾' },
  { id: 'lactosa', nombre: 'Lactosa / leche', emoji: '🥛' },
  { id: 'huevo', nombre: 'Huevo', emoji: '🥚' },
  { id: 'frutos_secos', nombre: 'Frutos secos', emoji: '🌰' },
  { id: 'cacahuete', nombre: 'Cacahuete', emoji: '🥜' },
  { id: 'soja', nombre: 'Soja', emoji: '🫘' },
  { id: 'pescado', nombre: 'Pescado', emoji: '🐟' },
  { id: 'marisco', nombre: 'Marisco', emoji: '🦐' },
  { id: 'sesamo', nombre: 'Sésamo', emoji: '🌱' },
  { id: 'mostaza', nombre: 'Mostaza', emoji: '🟡' },
  { id: 'apio', nombre: 'Apio', emoji: '🥬' },
  { id: 'sulfitos', nombre: 'Sulfitos', emoji: '🍷' },
  { id: 'altramuces', nombre: 'Altramuces', emoji: '🌼' },
  { id: 'fructosa', nombre: 'Fructosa', emoji: '🍎' },
  { id: 'sorbitol', nombre: 'Sorbitol', emoji: '🍬' },
  { id: 'ajo', nombre: 'Ajo', emoji: '🧄' },
  { id: 'cebolla', nombre: 'Cebolla', emoji: '🧅' },
  { id: 'tomate', nombre: 'Tomate', emoji: '🍅' },
  { id: 'maiz', nombre: 'Maíz', emoji: '🌽' },
  { id: 'legumbres', nombre: 'Legumbres', emoji: '🫛' },
];

export function nombreIntolerancia(id: IntoleranciaId): string {
  return INTOLERANCIAS.find((i) => i.id === id)?.nombre ?? id;
}

export type DietaId = 'vegano' | 'vegetariano' | 'sin_azucar' | 'alto_proteina';

export interface Dieta {
  id: DietaId;
  nombre: string;
  emoji: string;
}

export const DIETAS: Dieta[] = [
  { id: 'vegano', nombre: 'Vegano', emoji: '🌱' },
  { id: 'vegetariano', nombre: 'Vegetariano', emoji: '🥕' },
  { id: 'sin_azucar', nombre: 'Sin azúcar añadido', emoji: '🚫🍬' },
  { id: 'alto_proteina', nombre: 'Alto en proteína', emoji: '💪' },
];

/** Vegano implica vegetariano: un elemento vegano también cumple la dieta vegetariana. */
export function cumpleDietas(dietasElemento: DietaId[] | undefined, pedidas: DietaId[]): boolean {
  const tiene = new Set(dietasElemento ?? []);
  if (tiene.has('vegano')) tiene.add('vegetariano');
  return pedidas.every((d) => tiene.has(d));
}
