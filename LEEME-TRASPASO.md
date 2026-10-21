# Libre — guía de traspaso a otro PC

App móvil (Expo / React Native, Android) para gente con intolerancias y alergias alimentarias, para toda España. Esta guía dice qué instalar en el otro PC, cómo dejar todo funcionando y en qué punto estábamos.

Hay **dos proyectos** que se copian:

| Carpeta | Qué es |
|---|---|
| `APP INTOLERANCIAS project\Libre` | La app (Expo + React Native + TypeScript) |
| `Base de datos` | Pipeline en Python que llena la base de datos de productos en Supabase (Open Food Facts + Open Prices) |

---

## 1. Qué copiar y qué NO copiar

**Copiar:**
- `APP INTOLERANCIAS project\Libre` **sin** las carpetas `node_modules`, `android\build`, `android\.gradle`, `android\app\build`, `android\app\.cxx` y `.expo`. Se regeneran solas y pesan mucho.
- `Base de datos` **sin** `.venv` (no es portable entre PCs) y **sin** `.pytest_cache`. La carpeta `data\` (parquets, ~12 MB) sí conviene copiarla.
- El archivo `Base de datos\.env` contiene la cadena de conexión con la **contraseña** de la base de datos. Cópialo por un medio privado (USB o similar), **nunca** lo subas a GitHub, ni lo pegues en chats. Si dudas de que se haya filtrado, cambia la contraseña en Supabase (Project Settings → Database).

**Consejo importante:** en el PC nuevo pon el proyecto de la app en una **ruta corta**, por ejemplo `C:\libre`, y no dentro de OneDrive. Windows limita las rutas a 260 caracteres y la compilación nativa del mapa y de las pantallas falla con rutas largas (nos pasó: `Filename longer than 260 characters`). Además OneDrive sincroniza miles de archivos de `node_modules` y va lentísimo.

---

## 2. Programas que hay que instalar en el otro PC

Versiones con las que funciona hoy (Windows 10/11):

| Programa | Versión usada | Para qué |
|---|---|---|
| **Node.js** | 24.x (vale una LTS reciente, ≥ 20) | Ejecutar Expo y la app |
| **npm** | 11.x (viene con Node) | Instalar dependencias |
| **JDK 17** (Microsoft OpenJDK o Temurin) | 17.0.x | Compilar la APK (Gradle). Tiene que ser la 17 |
| **Android SDK** | en `C:\Android\sdk` | Compilar la APK |
| **Git** (opcional) | cualquiera | Solo si vas a usar GitHub Actions |
| **uv** (opcional) | 0.12.x | Solo para la base de datos (Python) |
| **Python 3.12** (opcional) | 3.12 | Solo para la base de datos (uv puede instalarlo solo) |
| **Expo Go** en el móvil | última versión | Probar la app sin compilar |

### Android SDK (paquetes que hay que tener)
Se instala con Android Studio (SDK Manager) o solo con las command-line tools:
- `platforms;android-35` y `platforms;android-36`
- `build-tools;35.0.0` y `build-tools;36.0.0`
- `platform-tools` (trae `adb`)
- `ndk;27.1.12297006`
- `cmake;3.22.1`
- Aceptar las licencias: `sdkmanager --licenses`

### Variables de entorno (Panel de control → Variables de entorno)
- `JAVA_HOME` = ruta del JDK 17, por ejemplo `C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot\`
- `ANDROID_HOME` = `C:\Android\sdk`
- Añadir al `PATH`: `%JAVA_HOME%\bin`, `%ANDROID_HOME%\platform-tools`
- Cerrar y abrir la terminal después. Comprueba con `java -version` (debe decir 17) y `node -v`.

---

## 3. Poner en marcha la app (modo desarrollo, con Expo Go)

```powershell
cd C:\libre                       # tu carpeta corta con el proyecto Libre
npm install --legacy-peer-deps    # OBLIGATORIO --legacy-peer-deps (hay un conflicto de peer dependencies conocido)
npx expo start
```

- Siempre hay que estar **dentro de la carpeta `Libre`** (la que tiene `package.json`). Si lanzas `expo start` en la carpeta de arriba sale `ConfigError`.
- Escanea el QR **con la app Expo Go** (no con la cámara normal en Android). Móvil y PC en la misma wifi.
- Si sale `java.io.IOException: Failed to download remote update`, el móvil no llega al PC: usa `npx expo start --tunnel -c` (pide instalar `@expo/ngrok`, responde `y`).
- Si algo raro pasa con la caché: `npx expo start -c`.
- Comprobar tipos antes de dar algo por terminado: `npx tsc --noEmit` (debe salir sin errores).

**Límites de Expo Go:** la lectura de etiquetas con la cámara (OCR, módulo `expo-mlkit-ocr`) **no funciona en Expo Go**; solo en la APK compilada. Lo demás sí.

**Instalar librerías nuevas:** con `npx expo install <paquete> -- --legacy-peer-deps`.

---

## 4. Configuración de la base de datos en la app

Archivo `Libre\src\config.ts`:

```ts
export const SUPABASE_URL = 'https://ypwefbjatloiwswquxdm.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_...';   // clave PÚBLICA, pensada para ir dentro de la app
```

- La clave `sb_publishable_…` es pública y solo puede **leer** (las tablas tienen RLS de solo lectura).
- **Nunca** pongas en la app la clave `service_role` ni la cadena `SUPABASE_DB_URL`.
- La app pide los datos por la API REST de Supabase (`/rest/v1/productos`), sin librería `supabase-js`. El código está en `src/lib/supabase.ts` y `src/lib/catalogoRemoto.ts`. Si la clave está vacía o no hay conexión, la app cae al catálogo interno (~190 productos).

---

## 5. Compilar la APK (Android, sin cuenta de Expo)

La APK incluye todo el código dentro: no necesita el PC ni `expo start`. Es la versión para instalar en el móvil.

```powershell
cd C:\libre
npx expo prebuild --platform android --no-install     # genera/actualiza la carpeta android\ (no editarla a mano)
notepad android\gradle.properties                     # cambiar la línea de jvmargs por: org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
cd android
.\gradlew.bat assembleRelease --no-daemon "-PreactNativeArchitectures=arm64-v8a"
```

- Resultado: `C:\libre\android\app\build\outputs\apk\release\app-release.apk` (~46 MB).
- `arm64-v8a` = móviles Android de 64 bits (casi todos). Compila más rápido que todas las arquitecturas.
- La primera compilación tarda 10-20 min; las siguientes 1-3 min.
- Cada vez que cambies algo en `app.json` o instales una librería nativa, repite `expo prebuild`.
- Instalar en el móvil: copiar el `.apk` al móvil y abrirlo (permitir orígenes desconocidos), o por USB con depuración USB: `adb install -r app-release.apk`. Conviene desinstalar la versión anterior si algo raro pasa.
- La APK va firmada con la clave de depuración: vale para probar y compartir, **no para Google Play** (para eso hará falta una clave propia y un `.aab`).

### Problemas que ya nos han pasado al compilar
| Error | Causa / solución |
|---|---|
| `Filename longer than 260 characters` (ninja/CMake) | Ruta del proyecto demasiado larga (OneDrive). Poner el proyecto en `C:\libre` |
| `Gradle build daemon disappeared unexpectedly` | Se quedó sin memoria o había un `java.exe` colgado de otra compilación. Matar los `java` viejos (Administrador de tareas), subir `-Xmx` a 4096m en `android\gradle.properties` y reintentar |
| `expo-system-ui` aviso en prebuild | Solo es un aviso; forzamos el modo claro con `Appearance.setColorScheme('light')` en `app/_layout.tsx` |
| `Cannot find native module ...` al abrir en Expo Go | Ese módulo (mapa WebView, OCR) requiere la APK compilada |

---

## 6. La base de datos de productos (carpeta `Base de datos`)

Proyecto Python (`off-supermercados-db`) que baja el volcado de Open Food Facts + Open Prices, lo filtra a España/supermercados y lo carga en **Supabase**. Toda la especificación está en `Base de datos\README.md`.

**Estado real de la base (comprobado en solo lectura el 27/09/2026):**
- 41.106 productos, 19 supermercados, 536 precios reales, 118 estimaciones por categoría, 43.869 relaciones producto-supermercado.
- 137 MB en Supabase (límite gratuito 500 MB). Fotos en 40.519 productos.
- RLS activado: lectura pública en `productos`, `supermercados`, `producto_supermercado`, `precios`, `precios_estimados_categoria`; `ejecuciones` es privada.
- Proyecto Supabase: referencia `ypwefbjatloiwswquxdm`.

**Instalar y usar en el PC nuevo:**
```powershell
cd "C:\ruta\Base de datos"
uv sync                              # crea .venv e instala dependencias (duckdb, psycopg, httpx, pyyaml, python-dotenv, pyarrow)
copy .env.example .env               # si no copiaste el .env: rellenar SUPABASE_DB_URL y CONTACT_EMAIL
uv run offdb --help                  # comandos: explore, init-db, build, load, prices, estimate, all
uv run pytest                        # tests
```
- `.env` necesita `SUPABASE_DB_URL` (cadena del **Session pooler**, Supabase → Project Settings → Database → Connection string) y `CONTACT_EMAIL` (se usa en el User-Agent).
- La actualización automática semanal está en `.github\workflows\actualizar.yml` (GitHub Actions; necesita los Secrets `SUPABASE_DB_URL`, `CONTACT_EMAIL` y `HF_TOKEN`). El volcado de OFF pesa ~8 GB y se descarga en el runner de GitHub, no en tu PC.
- **Reglas del proyecto:** solo datos abiertos (nada de scrapear webs de supermercados), guardar la fuente, no subir secretos ni `data\` al repo, no hacer operaciones destructivas sin preguntar.

### Aviso de calidad de datos (importante)
- **18.570 de los 41.106 productos no tienen ingredientes** registrados, y en muchos el campo `alergenos` está vacío solo porque falta el dato, no porque no tengan alérgenos.
- Miles de productos tienen "leche"/"trigo" en los ingredientes pero no traen la etiqueta de alérgeno correspondiente.
- Por eso la app **no se fía solo del campo de alérgenos**: además busca palabras en el texto de los ingredientes (`src/lib/compatibilidad.ts`), y un producto sin ingredientes sale como "Precaución", nunca "Apto". Los filtros de perfil dejan fuera los productos sin ingredientes. Es una red de seguridad, no una garantía: la etiqueta física manda siempre.
- Mejora pendiente sugerida: en el pipeline, limpiar/normalizar los alérgenos (`avena`, `avoine`, `leche`, `none`, `ausencia`… son valores sin normalizar en la columna).

---

## 7. Qué tiene la app (resumen de lo hecho)

- **Navegación** (Expo Router): pestañas Inicio, Productos, Tiendas, Recetas, Más; pantallas Perfil, Lista de la compra, Escáner de códigos de barras, Analizar etiqueta, ficha de producto, receta y supermercado.
- **Perfiles**: hasta 4 (p. ej. tu hijo), con intolerancias y tipo de dieta; toda la app se filtra por el perfil activo. Se guardan en el móvil (AsyncStorage). Cada perfil tiene **avatar** (emoji elegible, se asigna uno libre al crear) y **edad** opcional. Según la edad se muestra una **tarjeta de recomendaciones** (bebé, niño pequeño, niño, adolescente, adulto, mayor) en la pantalla de perfil, y **avisos de seguridad por categoría** en la ficha de producto (p. ej. frutos secos enteros = atragantamiento en menores de 4-5 años, miel en menores de 1 año, sal/azúcar en niños pequeños). Son orientativos, no un criterio médico. Código: `src/data/recomendacionesEdad.ts`.
- **20 intolerancias** (gluten, lactosa, huevo, frutos secos, cacahuete, soja, pescado, marisco, sésamo, mostaza, apio, sulfitos, altramuces, fructosa, sorbitol, ajo, cebolla, tomate, maíz, legumbres) y **4 dietas** (vegano, vegetariano, sin azúcar añadido, alto en proteína).
- **Productos**: catálogo online de la base de datos (41.000+), carga infinita, buscador con texto completo, filtros en servidor (compatibilidad con el perfil, 25 categorías, supermercado, precio, Nutri-Score, orden). Ficha con foto grande, Nutri-Score, tabla nutricional y fotos de ingredientes/tabla. Catálogo interno de ~190 productos genéricos como respaldo sin conexión (marcados "Orientativo").
- **Recetas**: 80 recetas con filtros (momento, dieta, tiempo, dificultad, coste, orden, búsqueda por ingrediente).
- **Tiendas**: mapa en **modo satélite** (Esri) con botón para cambiar a mapa normal (OpenStreetMap), supermercados de toda España desde OpenStreetMap/Overpass (con 4 servidores de respaldo), marcadores con chincheta y nombre, filtro por cadena, buscador de ciudad/CP (Nominatim), y ficha de la tienda con productos aptos.
- **Analizar etiqueta (📸)**: foto a la etiqueta → lectura de texto en el móvil (ML Kit, sin internet) → compara con las intolerancias del perfil → rodea la foto en **rojo** (no apto), **ámbar** (trazas/precaución), **verde** (parece apto) o **gris** (no se puede leer), y marca las líneas concretas. Nunca da por apto un texto ilegible.
- **Diseño**: tema claro juvenil (menta, lavanda, coral), tipografía Poppins, sombras suaves, animaciones al pulsar y al aparecer, degradado en Inicio.
- **Atribución legal** de Open Food Facts / Open Prices (ODbL, CC BY-SA) en la pestaña Más.

---

## 8. Estructura del código de la app (`Libre\`)

```
app/                    Pantallas (Expo Router). (tabs)/ = pestañas
  etiqueta.tsx          Analizar etiqueta con la cámara (OCR)
  perfil.tsx            Gestión de perfiles
  producto/[id].tsx     Ficha de producto
  cadena/[id].tsx       Productos de un supermercado
src/
  config.ts             URL y clave pública de Supabase
  theme.ts              Colores, tipografía, sombras
  components/           Texto (tipografía), SoftPressable, Aparece, ProductCard, GrupoChips, FotoProducto, SelectorPerfil…
  data/                 intolerancias, productos(+Extra), recetas(+Extra), cadenas (supermercados),
                        recomendacionesEdad (consejos y avisos por edad/categoría)
  lib/                  supabase.ts, catalogoRemoto.ts, compatibilidad.ts (reglas de aptitud),
                        etiqueta.ts (análisis del OCR), openFoodFacts.ts, supermercados.ts (Overpass),
                        mapaHtml.ts (mapa Leaflet), perfil.ts / PerfilContext.tsx, imagenProducto.ts
```
Notas: los archivos `CLAUDE.md`/`AGENTS.md` piden mirar la documentación de Expo de la versión instalada (SDK 57); las rutas están en `app/` (no en `src/app/`).

---

## 9. Dónde nos quedamos (lo que se estaba haciendo)

1. **Última APK compilada con éxito** (29/09/2026, ~62 MB): incluye el **analizador de etiquetas** (OCR) y las mejoras de perfil (avatares, edad, recomendaciones y avisos por categoría). Se compiló con `-Xmx4096m` en `android\gradle.properties` (el arreglo del fallo de memoria) y `tsc --noEmit` pasa limpio. **Falta probarla en el móvil.**
2. **Analizar etiqueta**: ✅ **ya va incluido en la APK del 29/09/2026** (antes solo estaba el código y faltaba compilarlo). Usa `expo-mlkit-ocr` y `expo-image-picker`. Recuerda que en **Expo Go no funciona**, solo en la APK. Pendiente: probar con fotos de etiquetas reales en el móvil.
3. **Sin confirmar todavía en el móvil**: (a) que la app carga la base de datos completa (contador "N productos" en Productos, no "catálogo sin conexión"); (b) que ya no se recortan textos de los chips ("Yo", "＋ Añadir perfil") tras el arreglo de `SoftPressable`; (c) que el mapa satélite se ve bien; (d) el analizador de etiquetas con fotos reales; (e) las mejoras de perfil: avatar por miembro, campo edad, tarjeta de recomendaciones por edad y el aviso ámbar por categoría en la ficha de producto (p. ej. perfil con edad 2 + producto de "Frutos secos" / "Dulces").
4. **Limitación conocida**: una leche "sin lactosa" se marca como no apta para el perfil "Lactosa / leche" (a propósito, es conservador porque ese ajuste también cubre la alergia a la leche). Idea pendiente: separar "intolerancia a la lactosa" de "alergia a la proteína de la leche".

## 10. Ideas pendientes

- Probar en el móvil la APK del 29/09/2026 (analizador de etiquetas + mejoras de perfil). Ya está compilada; solo falta instalarla y verificarla.
- Separar lactosa / proteína de la leche como dos intolerancias distintas.
- Limpiar y normalizar alérgenos en el pipeline de la base de datos (y ampliar la cobertura de ingredientes).
- Pantalla "Acerca de" propia con la atribución (ahora está al final de la pestaña Más).
- Guardar productos favoritos y el historial de etiquetas analizadas.
- Cuentas de usuario y sincronización de perfiles entre móviles (Supabase Auth) — requiere pensar la privacidad.
- Para publicar en Google Play: clave de firma propia, `.aab`, política de privacidad y textos de la ficha.
- Dietas (vegano, etc.) en el catálogo online: la base de datos aún no trae ese dato.

## 11. Seguridad — resumen

- La app solo lleva la **clave publishable** (solo lectura). No hay claves privadas en su código.
- `Base de datos\.env` tiene la contraseña de Postgres: no compartir, no subir a Git (ya está en `.gitignore`).
- Los datos de Open Food Facts son comunitarios y pueden estar incompletos o mal: la app siempre avisa de que hay que comprobar la etiqueta física.
