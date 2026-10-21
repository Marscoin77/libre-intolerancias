/**
 * Traducción de las categorías de Open Food Facts (en inglés/francés) al español, para mostrarlas
 * bien en la ficha y la tarjeta de producto. Cubre las categorías más frecuentes del catálogo
 * (calculado sobre los 41k productos). Si no hay traducción, se deja el texto tal cual (capitalizado).
 * La clave es la categoría ya "limpiada": sin prefijo de idioma y con los guiones convertidos en espacios.
 */
const TRADUCCIONES: Record<string, string> = {
  'plant based foods and beverages': 'Alimentos de origen vegetal',
  'alimentos de origen vegetal': 'Alimentos de origen vegetal',
  'aliments d origine vegetale': 'Alimentos de origen vegetal',
  'plant based foods': 'Alimentos de origen vegetal',
  snacks: 'Snacks',
  dairies: 'Lácteos',
  'beverages and beverages preparations': 'Bebidas',
  beverages: 'Bebidas',
  'meats and their products': 'Carnes',
  seafood: 'Pescado y marisco',
  marisco: 'Marisco',
  condiments: 'Condimentos',
  meals: 'Platos preparados',
  'platos y comidas preparados': 'Platos preparados',
  desserts: 'Postres',
  breakfasts: 'Desayunos',
  'frozen foods': 'Congelados',
  'farming products': 'Productos de granja',
  sweeteners: 'Edulcorantes',
  broths: 'Caldos',
  'baby foods': 'Alimentación infantil',
  sandwiches: 'Sándwiches',
  'cocoa and its products': 'Cacao',
  'food additives': 'Aditivos alimentarios',
  'canned foods': 'Conservas',
  'meat alternatives': 'Alternativas a la carne',
  'dietary supplements': 'Complementos alimenticios',
  'dried products': 'Productos deshidratados',
  'cooking helpers': 'Ayudas para cocinar',
  'eggs and their products': 'Huevos',
  'fish and meat and eggs': 'Pescado, carne y huevos',
  'crepes and galettes': 'Crepes',
  salads: 'Ensaladas',
  spreads: 'Untables',
  pies: 'Empanadas y pasteles',
  'chips and fries': 'Patatas fritas',
  'fresh foods': 'Alimentos frescos',
  'festive foods': 'Alimentos festivos',
  'fried foods': 'Fritos',
  'bee products': 'Productos apícolas',
  syrups: 'Siropes',
  groceries: 'Comestibles',
  'vegan products': 'Productos veganos',
  'cereals and potatoes': 'Cereales y patatas',
  'fruits and vegetables based foods': 'Frutas y verduras',
  'legumes and their products': 'Legumbres',
  'nuts and their products': 'Frutos secos',
  'biscuits and cakes': 'Galletas y bollería',
  'sweet snacks': 'Dulces',
  'salty snacks': 'Snacks salados',
  cheeses: 'Quesos',
  yogurts: 'Yogures',
  breads: 'Pan',
  sauces: 'Salsas',
  waters: 'Aguas',
  'plant based beverages': 'Bebidas vegetales',
  'non open products facts': 'Sin clasificar',
};

/** Traduce y capitaliza una categoría ya limpiada (sin prefijo de idioma ni guiones). */
export function traducirCategoria(limpia: string): string {
  if (!limpia) return 'Sin categoría';
  const clave = limpia.toLowerCase().trim();
  const trad = TRADUCCIONES[clave];
  if (trad) return trad;
  return limpia.charAt(0).toUpperCase() + limpia.slice(1);
}
