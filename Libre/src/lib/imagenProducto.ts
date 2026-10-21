import type { Producto } from '../data/productos';

// Primera regla que coincida con el nombre (o la categoría) gana: las más específicas van antes.
const REGLAS: Array<[RegExp, string]> = [
  [/croissant/, '🥐'],
  [/pizza/, '🍕'],
  [/hamburguesa/, '🍔'],
  [/croqueta|empanadilla/, '🥟'],
  [/sopa/, '🍜'],
  [/helado/, '🍦'],
  [/palomitas/, '🍿'],
  [/patatas fritas|nachos|chips/, '🍟'],
  [/galleta|magdalena|palmera|barrita|tortitas/, '🍪'],
  [/turrón|chocolate|crema de cacao|regaliz|chicle/, '🍫'],
  [/miel/, '🍯'],
  [/mermelada|fresa/, '🍓'],
  [/hummus/, '🧆'],
  [/tortilla/, '🫓'],
  [/pan |^pan|picos|pita|barra de/, '🍞'],
  [/cereal|muesli|granola|avena|copos/, '🥣'],
  [/pasta|espagueti|macarron|fideo|lasaña|cuscús|noodle/, '🍝'],
  [/arroz|quinoa|mijo/, '🍚'],
  [/harina|maicena/, '🌾'],
  [/queso/, '🧀'],
  [/mantequilla/, '🧈'],
  [/huevo/, '🥚'],
  [/yogur|kéfir|requesón|leche|nata|bebida/, '🥛'],
  [/pollo|pavo/, '🍗'],
  [/jamón/, '🍖'],
  [/ternera|carne|cerdo|solomillo|salchicha/, '🥩'],
  [/gamba|mejillon|marisco/, '🦐'],
  [/merluza|salmón|bacalao|dorada|pescado|atún|sardin|surimi/, '🐟'],
  [/tomate|kétchup/, '🍅'],
  [/pimiento/, '🫑'],
  [/zanahoria/, '🥕'],
  [/calabacín|pepino/, '🥒'],
  [/espinaca|brócoli|ensalada|verdura/, '🥬'],
  [/patata/, '🥔'],
  [/boniato/, '🍠'],
  [/ajo/, '🧄'],
  [/cebolla/, '🧅'],
  [/maíz/, '🌽'],
  [/aguacate/, '🥑'],
  [/manzana|compota/, '🍎'],
  [/plátano/, '🍌'],
  [/naranja|zumo/, '🍊'],
  [/lenteja|garbanzo|alubia|guisante|legumbre|tofu|tempeh|seitán/, '🫘'],
  [/almendra|nuez|nueces|frutos secos/, '🌰'],
  [/cacahuete|pipas|chía|semillas/, '🥜'],
  [/aceite/, '🫒'],
  [/vinagre/, '🍶'],
  [/mayonesa|mahonesa|mostaza|pesto|salsa/, '🥫'],
  [/caldo/, '🍲'],
  [/sal /, '🧂'],
  [/agua/, '💧'],
  [/cola|refresco/, '🥤'],
  [/infusión/, '🍵'],
  [/cerveza/, '🍺'],
  [/vino/, '🍷'],
];

const TINTES = ['#FFE7D6', '#DDF4EB', '#EFE8FF', '#FFF1C2', '#D9EBFF', '#FFDDEB', '#E4F6C9'];

export function emojiProducto(p: Pick<Producto, 'nombre' | 'categoria'>): string {
  const nombre = p.nombre.toLowerCase();
  const regla = REGLAS.find(([r]) => r.test(nombre)) ?? REGLAS.find(([r]) => r.test(p.categoria.toLowerCase()));
  return regla ? regla[1] : '🛒';
}

/** Color pastel estable por categoría, para que cada sección tenga su tono. */
export function tinteProducto(categoria: string): string {
  let h = 0;
  for (const c of categoria) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTES[h % TINTES.length];
}
