# Libre · Analizador de restaurantes

Rastreador que, para una ciudad, saca de **OpenStreetMap** los restaurantes que tienen web,
visita su web pública, busca menciones de alérgenos/intolerancias y clasifica cada intolerancia
como **apto** (verde), **dudoso** (ámbar) o **no** (rojo). El resultado se guarda en el mapa de
Libre (D1, vía el Worker `libre-api`) y se ve en la pestaña Tiendas → Restaurantes.

## Uso

```bash
cd crawler-restaurantes
export LIBRE_ADMIN_TOKEN=xxxxxxxx      # token admin del Worker (secreto)
node analizar.mjs "Valencia" 25        # ciudad y nº máximo de restaurantes
```

- Requiere **Node 20+** (usa `fetch` nativo). Sin dependencias que instalar.
- `LIBRE_API` (opcional) apunta al Worker; por defecto el de producción.
- Sin `LIBRE_ADMIN_TOKEN` solo analiza e imprime, no guarda nada.

## Cómo clasifica (y por qué es conservador)

- **apto (verde):** la web dice algo explícito, p. ej. "sin gluten", "opciones veganas", "apto celíacos".
- **dudoso (ámbar):** la web habla de alérgenos/intolerancias pero sin concretar esa intolerancia.
- **no (rojo):** solo si la web dice explícitamente que NO (p. ej. "no apto para celíacos"). Es raro.
- **sin datos:** no se marca nada. **La ausencia de información nunca se interpreta como peligro.**

En una app de alergias esto es deliberado: no afirmamos "apto" sin una frase explícita, y no
marcamos "no apto" por falta de datos (sería injusto para el restaurante y peligroso para el
usuario). Se guarda siempre la **URL y la fecha**, y la app muestra *"según su web, confírmalo en
el restaurante"*. La etiqueta/carta física y preguntar en el sitio mandan siempre.

## Buenas prácticas del rastreo

- Solo datos y páginas **públicas** (OSM + la propia web del restaurante).
- **Ritmo lento** (pausa entre webs) y **User-Agent identificable** con contacto.
- Pensado para pasadas pequeñas, ciudad por ciudad.

## Ideas / siguiente nivel

- Sustituir la detección por palabras clave por un paso con **IA** (Workers AI o la API de Claude)
  que lea el texto y devuelva banderas estructuradas + cita textual (más preciso, con coste).
- Programarlo (cron) para re-analizar por zonas periódicamente.
- Mostrar el color del marcador en el mapa según el veredicto para el perfil activo.
