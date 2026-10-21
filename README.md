# Libre

App Android (Expo / React Native) para personas con **intolerancias y alergias alimentarias** en España. Busca productos de supermercado, escanea etiquetas y códigos de barras, y muestra un veredicto claro **Apto / Precaución / No apto** según el perfil de intolerancias de cada persona. Incluye un mapa comunitario de supermercados y restaurantes con análisis de aptitud.

> ⚠️ La información puede ser incompleta. La app **siempre** recomienda comprobar la etiqueta física del producto y confirmar en el restaurante.

## Estructura

| Carpeta | Qué es |
|---|---|
| `Libre/` | App Expo SDK 57 / React Native. Rutas en `app/` (Expo Router), lógica en `src/`. |
| `worker-libre/` | Cloudflare Worker (`libre-api`) sobre D1: catálogo de productos (solo lectura) + mapa comunitario (lectura/escritura con id anónimo de dispositivo). |
| `crawler-restaurantes/` | Analizador de restaurantes: lee OpenStreetMap (etiquetas `diet:*`) y la web pública de cada local, clasifica por intolerancia de forma conservadora y lo sube al mapa. |

## Datos y privacidad

- Catálogo de productos a partir de datos abiertos (Open Food Facts). No se hace scraping de webs de supermercados.
- La app solo lleva la URL pública del Worker; **no contiene claves ni secretos**.
- El analizador de restaurantes es **conservador por seguridad**: nunca marca "apto" sin una señal explícita y **nunca** marca "no apto" por ausencia de información. Siempre guarda la fuente y la fecha, y la app indica "según su web, confírmalo en el restaurante".
- Respeta `robots.txt`, limita el ritmo de peticiones y se identifica con un User-Agent con contacto.

## Desarrollo

```bash
cd Libre
npm install
npx expo start          # desarrollo
# Build Android (release):
npx expo prebuild
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

El Worker se despliega con `wrangler deploy` desde `worker-libre/`. El `ADMIN_TOKEN` del Worker es un secreto (`wrangler secret put`), nunca vive en el repositorio.
