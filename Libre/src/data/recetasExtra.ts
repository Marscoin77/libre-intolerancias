import type { Receta, Momento } from './recetas';
import type { DietaId, IntoleranciaId } from './intolerancias';

/**
 * Recetas ampliadas. `contiene` recoge las intolerancias de los ingredientes tal cual
 * están escritos (incluidos ajo, cebolla, tomate, maíz y legumbres). Adapta los ingredientes
 * a tu perfil y revisa siempre las etiquetas de los productos que uses.
 */

const CODIGO: Record<string, IntoleranciaId> = {
  G: 'gluten',
  L: 'lactosa',
  H: 'huevo',
  F: 'frutos_secos',
  C: 'cacahuete',
  S: 'soja',
  P: 'pescado',
  M: 'marisco',
  A: 'sesamo',
  X: 'mostaza',
  E: 'apio',
  U: 'sulfitos',
  J: 'ajo',
  B: 'cebolla',
  O: 'tomate',
  Z: 'maiz',
  K: 'legumbres',
};
const DIETA: Record<string, DietaId> = { V: 'vegano', T: 'vegetariano', S: 'sin_azucar', P: 'alto_proteina' };

type Dif = 'Fácil' | 'Media' | 'Alta';
type Coste = '€' | '€€' | '€€€';
// [nombre, emoji, momento, min, dificultad, coste, personas, contiene, dietas, ingredientes|…, pasos|…]
type Fila = [string, string, Momento, number, Dif, Coste, number, string, string, string, string];

const FILAS: Fila[] = [
  // Desayunos
  ['Tostadas con tomate y aceite', '🍅', 'Desayuno', 5, 'Fácil', '€', 1, 'GO', 'V', '2 rebanadas de pan|1 tomate maduro|Aceite de oliva|Sal', 'Tuesta el pan.|Ralla el tomate y extiéndelo sobre las tostadas.|Aliña con aceite y una pizca de sal.'],
  ['Porridge de avena con frutos rojos', '🥣', 'Desayuno', 10, 'Fácil', '€', 1, 'G', 'VS', '40 g de copos de avena|250 ml de bebida vegetal|Frutos rojos|Canela', 'Calienta la avena con la bebida a fuego medio 5 minutos.|Remueve hasta que espese.|Sirve con los frutos rojos y canela.'],
  ['Tortilla francesa con espinacas', '🍳', 'Desayuno', 10, 'Fácil', '€', 1, 'H', 'TP', '2 huevos|Un puñado de espinacas|Aceite de oliva|Sal', 'Saltea las espinacas 1 minuto.|Bate los huevos con sal y viértelos en la sartén.|Cuaja por ambos lados y sirve.'],
  ['Tostada de aguacate y huevo', '🥑', 'Desayuno', 10, 'Fácil', '€', 1, 'GH', 'TP', '1 rebanada de pan|1/2 aguacate|1 huevo|Limón|Sal', 'Tuesta el pan y machaca el aguacate con limón y sal.|Cocina el huevo a la plancha o poché.|Monta la tostada con el aguacate y el huevo encima.'],
  ['Batido de fresa y plátano', '🍓', 'Desayuno', 5, 'Fácil', '€', 1, '', 'VS', '150 g de fresas|1 plátano|250 ml de bebida de arroz', 'Trocea la fruta.|Tritura con la bebida de arroz hasta que quede cremoso.|Sirve frío.'],
  ['Pancakes de plátano y avena', '🥞', 'Desayuno', 15, 'Fácil', '€', 2, 'GH', 'T', '2 plátanos maduros|2 huevos|60 g de avena|Canela', 'Tritura todos los ingredientes.|Cocina montoncitos en una sartén antiadherente 2 minutos por lado.|Sirve con fruta.'],
  ['Pudin de chía', '🍮', 'Desayuno', 5, 'Fácil', '€', 1, '', 'VS', '3 cucharadas de semillas de chía|200 ml de bebida de arroz|Fruta troceada|Canela', 'Mezcla la chía con la bebida.|Deja reposar en la nevera al menos 4 horas.|Sirve con fruta troceada.'],
  ['Yogur con granola y miel', '🍯', 'Desayuno', 3, 'Fácil', '€', 1, 'LG', 'T', '1 yogur natural|Granola|1 cucharadita de miel', 'Pon el yogur en un bol.|Añade la granola por encima.|Termina con un hilo de miel.'],
  ['Bol de fruta y semillas', '🍓', 'Desayuno', 8, 'Fácil', '€', 1, '', 'VS', 'Fruta de temporada|Semillas de calabaza y girasol|Zumo de naranja', 'Lava y trocea la fruta.|Colócala en un bol.|Espolvorea las semillas y riega con zumo.'],
  ['Tostada de hummus y pepino', '🥒', 'Desayuno', 5, 'Fácil', '€', 1, 'GAKJ', 'V', '2 rebanadas de pan|Hummus|1/2 pepino|Pimienta', 'Tuesta el pan.|Unta el hummus.|Añade el pepino en rodajas y pimienta.'],
  ['Huevos revueltos con tomate', '🍳', 'Desayuno', 10, 'Fácil', '€', 1, 'HO', 'TP', '2 huevos|1 tomate|Aceite de oliva|Sal', 'Sofríe el tomate troceado 3 minutos.|Añade los huevos batidos.|Remueve a fuego suave hasta cuajar.'],
  ['Gachas de arroz con canela', '🍚', 'Desayuno', 15, 'Fácil', '€', 2, '', 'VS', '60 g de arroz|500 ml de bebida de arroz|Canela|1 manzana', 'Cuece el arroz con la bebida a fuego bajo 12 minutos.|Añade la manzana rallada.|Sirve con canela.'],
  // Comidas
  ['Lentejas estofadas con verduras', '🍲', 'Comida', 45, 'Media', '€', 3, 'KBJ', 'VP', '250 g de lentejas|1 zanahoria|1 cebolla|1 pimiento|2 dientes de ajo|Aceite de oliva|Sal', 'Sofríe la cebolla, el ajo y el pimiento.|Añade la zanahoria, las lentejas y cubre con agua.|Cuece 35 minutos a fuego suave.'],
  ['Garbanzos con espinacas', '🥬', 'Comida', 30, 'Fácil', '€', 2, 'KJ', 'VP', '1 bote de garbanzos cocidos|300 g de espinacas|2 dientes de ajo|Comino|Aceite de oliva', 'Dora el ajo en aceite.|Añade las espinacas y saltea.|Incorpora los garbanzos y el comino y cocina 10 minutos.'],
  ['Arroz al horno con verduras', '🍚', 'Comida', 45, 'Media', '€€', 3, 'BJO', 'V', '300 g de arroz|Tomate|Cebolla|Pimiento|Ajo|Caldo de verduras|Aceite de oliva', 'Sofríe las verduras y el ajo.|Añade el arroz y el caldo caliente.|Hornea a 200 °C durante 25 minutos.'],
  ['Paella de verduras', '🥘', 'Comida', 45, 'Media', '€€', 3, 'BJOK', 'V', '300 g de arroz|Judías verdes|Alcachofas|Tomate|Cebolla|Ajo|Azafrán|Caldo de verduras', 'Sofríe las verduras.|Añade el arroz, el azafrán y el caldo.|Cuece 18 minutos sin remover y deja reposar.'],
  ['Ensalada de quinoa y aguacate', '🥗', 'Comida', 20, 'Fácil', '€€', 2, 'O', 'VPS', '150 g de quinoa|1 aguacate|Tomates cherry|Pepino|Limón|Aceite de oliva', 'Cuece la quinoa 12 minutos y enfría.|Corta el aguacate, los tomates y el pepino.|Mezcla todo y aliña con limón y aceite.'],
  ['Ensalada de atún, huevo y maíz', '🥗', 'Comida', 15, 'Fácil', '€', 2, 'PHZ', '', 'Lechuga|1 lata de atún|2 huevos cocidos|Maíz dulce|Aceite de oliva|Sal', 'Cuece los huevos 10 minutos.|Trocea la lechuga y mézclala con el atún y el maíz.|Añade los huevos y aliña.'],
  ['Ensalada de garbanzos', '🥗', 'Comida', 10, 'Fácil', '€', 2, 'KBO', 'VP', '1 bote de garbanzos cocidos|1 tomate|1/2 cebolla|Pepino|Perejil|Aceite y vinagre', 'Escurre y aclara los garbanzos.|Pica las verduras.|Mezcla todo y aliña.'],
  ['Pollo a la plancha con arroz', '🍗', 'Comida', 25, 'Fácil', '€', 2, '', 'P', '2 filetes de pechuga de pollo|150 g de arroz|Limón|Aceite de oliva|Sal', 'Cuece el arroz.|Dora el pollo en la plancha 4 minutos por lado.|Sirve con limón y un chorrito de aceite.'],
  ['Pechuga de pollo al limón', '🍋', 'Comida', 20, 'Fácil', '€€', 2, 'J', 'P', '2 pechugas de pollo|1 limón|2 dientes de ajo|Perejil|Aceite de oliva', 'Dora el pollo en filetes finos.|Añade el ajo, el zumo de limón y un poco de agua.|Cocina 5 minutos y sirve con perejil.'],
  ['Ternera guisada con patatas', '🥩', 'Comida', 60, 'Media', '€€', 3, 'BJ', 'P', '500 g de ternera para guisar|3 patatas|1 cebolla|2 dientes de ajo|Aceite de oliva|Agua|Sal', 'Sella la carne en la olla.|Añade la cebolla y el ajo picados y cubre con agua.|Cuece 40 minutos y añade las patatas 15 minutos antes de terminar.'],
  ['Albóndigas en salsa de tomate', '🍝', 'Comida', 40, 'Media', '€€', 3, 'GHOBJ', '', '400 g de carne picada|1 huevo|Pan rallado|Ajo|Cebolla|Tomate triturado|Aceite de oliva', 'Mezcla la carne con huevo, pan rallado y ajo y forma bolas.|Dóralas en aceite.|Cuécelas 15 minutos en salsa de tomate con cebolla.'],
  ['Pasta con tomate y albahaca', '🍝', 'Comida', 20, 'Fácil', '€', 2, 'GOJ', 'V', '200 g de pasta|Tomate triturado|Ajo|Albahaca|Aceite de oliva|Sal', 'Cuece la pasta.|Sofríe el ajo y añade el tomate 8 minutos.|Mezcla con la pasta y la albahaca.'],
  ['Pasta sin gluten con verduras', '🍝', 'Comida', 20, 'Fácil', '€€', 2, 'ZB', 'V', '200 g de pasta sin gluten de maíz|1 calabacín|1/2 cebolla|Aceite de oliva|Sal', 'Cuece la pasta.|Saltea el calabacín y la cebolla.|Mezcla con la pasta.'],
  ['Macarrones con carne', '🍝', 'Comida', 35, 'Fácil', '€€', 3, 'GOBJ', '', '250 g de macarrones|300 g de carne picada|Tomate triturado|Cebolla|Ajo|Aceite de oliva', 'Sofríe la cebolla y el ajo, añade la carne.|Agrega el tomate y cuece 15 minutos.|Cuece la pasta y mézclala con la salsa.'],
  ['Sopa de verduras', '🥕', 'Comida', 30, 'Fácil', '€', 3, 'EB', 'VS', '2 zanahorias|1 puerro|1 cebolla|2 tallos de apio|1 patata|Aceite de oliva|Sal', 'Trocea las verduras.|Cúbrelas con agua y cuece 25 minutos.|Ajusta de sal y sirve.'],
  ['Crema de calabacín', '🥒', 'Comida', 25, 'Fácil', '€', 3, 'B', 'VS', '3 calabacines|1 patata|1/2 cebolla|Aceite de oliva|Sal', 'Sofríe la cebolla.|Añade el calabacín y la patata troceados y cubre con agua.|Cuece 15 minutos y tritura.'],
  ['Crema de zanahoria y jengibre', '🥕', 'Comida', 30, 'Fácil', '€', 3, 'B', 'V', '500 g de zanahoria|1 cebolla|1 trozo de jengibre|Aceite de oliva|Sal', 'Sofríe la cebolla y el jengibre.|Añade la zanahoria troceada y agua.|Cuece 20 minutos y tritura.'],
  ['Gazpacho', '🍅', 'Comida', 10, 'Fácil', '€', 3, 'GOJ', 'V', '1 kg de tomates|1 pepino|1 pimiento|1 diente de ajo|Pan del día anterior|Aceite y vinagre|Sal', 'Trocea las verduras y el pan.|Tritura todo con aceite, vinagre y sal.|Enfría antes de servir.'],
  ['Salmorejo', '🍅', 'Comida', 15, 'Fácil', '€', 3, 'GOJH', 'T', '1 kg de tomates|200 g de pan|1 diente de ajo|Aceite de oliva|Sal|Huevo duro', 'Tritura el tomate con el ajo y el pan.|Añade el aceite en hilo y la sal.|Sirve frío con huevo duro picado.'],
  ['Tortilla de patatas', '🥔', 'Comida', 30, 'Media', '€', 3, 'HB', 'T', '4 huevos|4 patatas|1 cebolla|Aceite de oliva|Sal', 'Fríe las patatas y la cebolla a fuego suave.|Mezcla con los huevos batidos.|Cuaja en la sartén dándole la vuelta.'],
  ['Merluza en salsa verde', '🐟', 'Comida', 30, 'Media', '€€', 2, 'PJG', '', '2 lomos de merluza|Ajo|Perejil|Harina|Caldo de pescado|Aceite de oliva', 'Sofríe el ajo, añade una cucharada de harina.|Incorpora el caldo y el perejil.|Cuece la merluza 5 minutos en la salsa.'],
  ['Salmón al horno con limón', '🐟', 'Comida', 25, 'Fácil', '€€', 2, 'P', 'PS', '2 lomos de salmón|1 limón|Eneldo|Aceite de oliva|Sal', 'Precalienta el horno a 200 °C.|Coloca el salmón con limón, eneldo y aceite.|Hornea 15 minutos.'],
  ['Gambas al ajillo', '🦐', 'Comida', 15, 'Fácil', '€€€', 2, 'MJ', 'P', '300 g de gambas peladas|4 dientes de ajo|Guindilla|Aceite de oliva|Perejil', 'Dora el ajo laminado con la guindilla.|Añade las gambas y cocina 3 minutos.|Termina con perejil.'],
  ['Dorada al horno con verduras', '🐟', 'Comida', 35, 'Media', '€€', 2, 'PB', 'P', '2 doradas limpias|2 patatas|1 cebolla|Limón|Aceite de oliva|Sal', 'Hornea las patatas y la cebolla en láminas 15 minutos.|Añade las doradas con limón y aceite.|Hornea 20 minutos más.'],
  ['Hamburguesas de lentejas', '🍔', 'Comida', 30, 'Media', '€', 2, 'KBJG', 'V', '250 g de lentejas cocidas|Copos de avena|1/2 cebolla|1 diente de ajo|Comino|Aceite de oliva', 'Tritura las lentejas con la avena y las especias.|Forma hamburguesas.|Dóralas 4 minutos por lado.'],
  ['Curry de garbanzos y coco', '🍛', 'Comida', 30, 'Fácil', '€€', 3, 'KBJ', 'VP', '1 bote de garbanzos cocidos|200 ml de leche de coco|1 cebolla|2 dientes de ajo|Curry|Aceite de oliva', 'Sofríe la cebolla y el ajo con el curry.|Añade los garbanzos y la leche de coco.|Cuece 15 minutos.'],
  ['Wok de tofu y verduras', '🥡', 'Comida', 20, 'Fácil', '€€', 2, 'SBJ', 'VP', '200 g de tofu|Brócoli|Zanahoria|1 cebolleta|Ajo|Salsa tamari|Aceite', 'Dora el tofu en dados.|Saltea las verduras a fuego fuerte.|Junta todo con el tamari.'],
  ['Buddha bowl de boniato y garbanzos', '🥗', 'Comida', 30, 'Fácil', '€€', 2, 'KA', 'VP', '1 boniato|1 bote de garbanzos|Espinacas|Tahini|Limón|Aceite de oliva', 'Hornea el boniato en dados 20 minutos.|Monta el bol con espinacas, garbanzos y boniato.|Aliña con tahini y limón.'],
  ['Tacos de pollo con guacamole', '🌮', 'Comida', 25, 'Fácil', '€€', 2, 'ZBJ', 'P', '4 tortillas de maíz|2 pechugas de pollo|1 aguacate|1/2 cebolla|Limón|Ajo', 'Saltea el pollo en tiras.|Machaca el aguacate con limón, cebolla y ajo.|Rellena las tortillas calientes.'],
  ['Pizza casera de coliflor', '🍕', 'Comida', 40, 'Alta', '€€', 2, 'HLO', 'T', '1 coliflor|1 huevo|Queso rallado|Tomate triturado|Orégano', 'Ralla la coliflor, cuécela y escúrrela bien.|Mezcla con huevo y queso y forma la base; hornea 15 minutos.|Añade el tomate y el queso y gratina.'],
  ['Berenjenas rellenas', '🍆', 'Comida', 50, 'Media', '€€', 2, 'BJLGO', '', '2 berenjenas|200 g de carne picada|Cebolla|Ajo|Tomate|Queso rallado|Pan rallado', 'Hornea las berenjenas abiertas 20 minutos.|Sofríe la carne con cebolla, ajo y tomate.|Rellena, cubre con queso y pan rallado y gratina.'],
  ['Pisto con huevo', '🍳', 'Comida', 35, 'Fácil', '€', 2, 'OBJH', 'T', '1 calabacín|1 pimiento|1 cebolla|Tomate triturado|2 huevos|Aceite de oliva', 'Sofríe las verduras troceadas.|Añade el tomate y cuece 20 minutos.|Cuaja los huevos encima.'],
  ['Fajitas de verduras', '🌯', 'Comida', 25, 'Fácil', '€', 2, 'GB', 'V', '4 tortillas de trigo|Pimientos|1 cebolla|Calabacín|Comino|Aceite de oliva', 'Corta las verduras en tiras y saltéalas con comino.|Calienta las tortillas.|Rellena y enrolla.'],
  ['Risotto de champiñones', '🍄', 'Comida', 40, 'Media', '€€', 2, 'LBU', 'T', '200 g de arroz|250 g de champiñones|1 cebolla|Vino blanco|Caldo de verduras|Queso parmesano|Mantequilla', 'Sofríe la cebolla y los champiñones.|Añade el arroz, el vino y el caldo poco a poco.|Termina con mantequilla y parmesano.'],
  ['Ensalada césar', '🥗', 'Comida', 20, 'Media', '€€', 2, 'GHLPX', '', 'Lechuga|Pollo a la plancha|Picatostes|Parmesano|Salsa césar', 'Prepara el pollo y trocéalo.|Mezcla la lechuga con picatostes y parmesano.|Añade el pollo y la salsa.'],
  // Cenas
  ['Revuelto de champiñones y gambas', '🍳', 'Cena', 15, 'Fácil', '€€', 2, 'HMJ', '', '4 huevos|200 g de champiñones|150 g de gambas|1 diente de ajo|Aceite de oliva', 'Saltea el ajo y los champiñones.|Añade las gambas.|Incorpora los huevos batidos y remueve.'],
  ['Tortilla de calabacín', '🍳', 'Cena', 20, 'Fácil', '€', 2, 'HB', 'TP', '4 huevos|1 calabacín|1/2 cebolla|Aceite de oliva|Sal', 'Pocha el calabacín y la cebolla.|Mezcla con los huevos batidos.|Cuaja por ambos lados.'],
  ['Pescado al papillote', '🐟', 'Cena', 25, 'Fácil', '€€', 2, 'P', 'P', '2 filetes de pescado blanco|Calabacín|Zanahoria|Limón|Aceite de oliva|Sal', 'Coloca el pescado y las verduras en tiras sobre papel de horno.|Aliña y cierra el paquete.|Hornea 18 minutos a 190 °C.'],
  ['Crema de puerros', '🥣', 'Cena', 25, 'Fácil', '€', 3, 'B', 'V', '3 puerros|2 patatas|1/2 cebolla|Aceite de oliva|Sal', 'Sofríe el puerro y la cebolla.|Añade la patata y agua y cuece 15 minutos.|Tritura.'],
  ['Pollo al curry con arroz', '🍛', 'Cena', 30, 'Media', '€€', 2, 'BJ', 'P', '2 pechugas de pollo|1 cebolla|Ajo|Curry|Leche de coco|150 g de arroz', 'Dora el pollo troceado con cebolla y ajo.|Añade curry y leche de coco y cuece 12 minutos.|Sirve con arroz.'],
  ['Verduras al horno con queso feta', '🍆', 'Cena', 35, 'Fácil', '€€', 2, 'LBJ', 'T', 'Berenjena|Calabacín|Pimiento|Cebolla|Ajo|Queso feta|Aceite de oliva', 'Corta las verduras en trozos.|Hornea 25 minutos a 200 °C.|Añade el feta y hornea 5 minutos más.'],
  ['Ensalada templada de lentejas', '🥗', 'Cena', 15, 'Fácil', '€', 2, 'KB', 'VP', '1 bote de lentejas cocidas|1/2 cebolla|Pimiento|Vinagre|Aceite de oliva', 'Calienta las lentejas.|Pica las verduras.|Mezcla y aliña.'],
  // Meriendas
  ['Tostada de crema de cacahuete y plátano', '🥜', 'Merienda', 5, 'Fácil', '€', 1, 'GC', 'V', '1 rebanada de pan|Crema de cacahuete|1 plátano', 'Tuesta el pan.|Unta la crema de cacahuete.|Añade el plátano en rodajas.'],
  ['Hummus con crudités', '🥕', 'Merienda', 10, 'Fácil', '€', 2, 'KAJ', 'V', '1 bote de garbanzos cocidos|Tahini|Limón|1 diente de ajo|Zanahoria y pepino en bastones', 'Tritura garbanzos, tahini, limón y ajo con un poco de agua.|Corta las verduras en bastones.|Sirve para mojar.'],
  ['Yogur con nueces', '🥜', 'Merienda', 3, 'Fácil', '€', 1, 'LF', 'TP', '1 yogur natural|Nueces|Canela', 'Pon el yogur en un vaso.|Añade las nueces troceadas.|Espolvorea canela.'],
  ['Palomitas caseras', '🍿', 'Merienda', 8, 'Fácil', '€', 2, 'Z', 'VS', '50 g de maíz para palomitas|1 cucharada de aceite|Sal', 'Calienta el aceite en una olla tapada.|Añade el maíz y agita hasta que dejen de saltar.|Sala y sirve.'],
  ['Barritas de dátiles y avena', '🍫', 'Merienda', 20, 'Fácil', '€', 4, 'GF', 'V', '200 g de dátiles|100 g de avena|50 g de almendras|Canela', 'Tritura los dátiles hasta formar una pasta.|Mezcla con la avena y las almendras picadas.|Extiende en un molde, enfría y corta en barritas.'],
  ['Smoothie verde', '🥤', 'Merienda', 5, 'Fácil', '€', 1, '', 'VS', 'Espinacas|1 plátano|1/2 pepino|Zumo de limón|Agua', 'Pon todos los ingredientes en la batidora.|Tritura hasta que quede fino.|Sirve con hielo.'],
  // Postres
  ['Arroz con leche', '🍚', 'Postre', 40, 'Media', '€', 4, 'L', 'T', '150 g de arroz|1 litro de leche|Corteza de limón|Canela|Azúcar', 'Cuece el arroz con la corteza de limón en agua 10 minutos.|Añade la leche caliente y el azúcar y cuece 25 minutos removiendo.|Sirve con canela.'],
  ['Natillas caseras', '🍮', 'Postre', 25, 'Media', '€', 4, 'LHZ', 'T', '500 ml de leche|3 yemas|Maicena|Azúcar|Vainilla', 'Calienta la leche con la vainilla.|Bate yemas, azúcar y maicena e incorpora la leche.|Cuece removiendo hasta que espese y enfría.'],
  ['Brownie sin gluten', '🍫', 'Postre', 35, 'Media', '€€', 6, 'HLF', 'T', '150 g de chocolate negro|100 g de mantequilla|3 huevos|100 g de harina de almendra|Azúcar', 'Funde el chocolate con la mantequilla.|Mezcla con los huevos, el azúcar y la harina de almendra.|Hornea 20 minutos a 180 °C.'],
  ['Mousse de chocolate vegana', '🍫', 'Postre', 15, 'Media', '€€', 3, 'K', 'V', '150 g de chocolate negro|Agua de garbanzos (aquafaba)|Azúcar', 'Funde el chocolate y deja templar.|Monta la aquafaba con azúcar hasta que forme picos.|Mezcla con suavidad y enfría 2 horas.'],
  ['Compota de manzana', '🍎', 'Postre', 20, 'Fácil', '€', 2, '', 'VS', '4 manzanas|Canela|Zumo de limón', 'Pela y trocea las manzanas.|Cuece con un poco de agua, canela y limón 15 minutos.|Tritura o aplasta.'],
  ['Helado de plátano', '🍌', 'Postre', 5, 'Fácil', '€', 2, '', 'VS', '3 plátanos maduros congelados', 'Trocea los plátanos congelados.|Tritura hasta obtener una crema.|Sirve al momento.'],
  ['Tarta de queso', '🍰', 'Postre', 60, 'Media', '€€', 8, 'LHG', 'T', '500 g de queso crema|4 huevos|150 g de azúcar|Galletas|Mantequilla', 'Tritura las galletas con mantequilla y forra el molde.|Bate el queso con huevos y azúcar y vierte.|Hornea 40 minutos a 160 °C.'],
  ['Macedonia de frutas', '🍓', 'Postre', 10, 'Fácil', '€', 3, '', 'VS', 'Fruta de temporada|Zumo de naranja', 'Lava y trocea la fruta.|Mezcla en un bol.|Riega con zumo de naranja.'],
  ['Torrijas', '🍞', 'Postre', 30, 'Media', '€', 4, 'GHL', 'T', 'Pan del día anterior|Leche|Huevos|Canela|Azúcar|Aceite', 'Empapa el pan en leche con canela.|Pásalo por huevo batido y fríelo.|Reboza en azúcar y canela.'],
  ['Galletas de avena y plátano', '🍪', 'Postre', 25, 'Fácil', '€', 4, 'G', 'VS', '2 plátanos maduros|150 g de avena|Canela', 'Aplasta los plátanos y mezcla con la avena y la canela.|Forma galletas sobre una bandeja.|Hornea 15 minutos a 180 °C.'],
];

const decodificar = <T extends string>(codigos: string, mapa: Record<string, string>) =>
  [...codigos].map((c) => mapa[c]).filter(Boolean) as T[];

export const RECETAS_EXTRA: Receta[] = FILAS.map(
  ([nombre, emoji, momento, tiempoMin, dificultad, costeAprox, personasBase, contiene, dietas, ingredientes, preparacion], i) => ({
    id: `rx${i + 1}`,
    nombre,
    emoji,
    momento,
    tiempoMin,
    dificultad,
    costeAprox,
    personasBase,
    contiene: decodificar<IntoleranciaId>(contiene, CODIGO),
    dietas: decodificar<DietaId>(dietas, DIETA),
    ingredientes: ingredientes.split('|'),
    preparacion: preparacion.split('|'),
  })
);
