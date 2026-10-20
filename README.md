# Scantec — Diagnóstico Automotor

Aplicación web de ayuda técnica para celular y computadora.

## Consulta de códigos
- Permite consultar un código DTC **sin ingresar marca**, mostrando la descripción general disponible y las interpretaciones diferentes por fabricante.
- Si se indica marca y modelo, destaca las interpretaciones de esa marca **sin ocultar** el resto.
- Advierte ante códigos incompletos o inválidos (por ejemplo P340) y **no convierte** automáticamente un código ambiguo.
- Muestra resultados en la misma pantalla. Puede guardarse una ficha completa, incluidos los textos disponibles por fabricante y las notas del técnico, en el almacenamiento local del navegador.
- Google y ChatGPT se abren aparte solo como opciones adicionales; **sus respuestas no vuelven automáticamente** a Scantec.
- El reconocimiento de voz depende del navegador.

## Datos importados
- `db/genericos.json`: 9.415 definiciones obtenidas de ficheros P, B, C y U del catálogo abierto. **No todas representan definiciones universales garantizadas**: algunas familias de códigos varían por fabricante, modelo y año.
- `db/marcas-a.json`, `db/marcas-b.json`, `db/marcas-c.json` y `db/marcas-d.json`: entradas específicas de **31 marcas o denominaciones** según la fuente comunitaria.
- Fuente: [Wal33D/dtc-database](https://github.com/Wal33D/dtc-database), autor Waleed Judah, licencia MIT. Licencia íntegra en `db/LICENSE-fuente-MIT.txt`.
- Datos externos conservados en **inglés** para no introducir errores de traducción automatizada. Las fichas iniciales de Scantec en español incluyen causas y comprobaciones generales.
- Algunos ficheros de origen muestran repeticiones o descripciones discutibles; **no se validaron individualmente** los miles de códigos contra manuales oficiales.
- Actualmente faltan catálogos específicos para Citroën, Peugeot, Renault y Fiat. Si una marca no está cargada, Scantec lo dice expresamente: una variante de otra marca no reemplaza el dato faltante.
- Las descripciones deben confirmarse con documentación específica del año, motorización, módulo y mercado antes de un trabajo de reparación.

## Arquitectura
GitHub Pages publica `index.html` desde `main`. La web lee las bases JSON de la misma carpeta `db/` bajo el mismo sitio, **sin cuentas ni secretos**. Usa el catálogo local inicial de 87 DTC como respaldo cuando la biblioteca externa no esté disponible; en ese caso marca los resultados como **parciales**.

**Mi Taller:** usa Firebase Authentication para identificar la cuenta y Cloud Firestore para guardar clientes, vehículos, trabajos, presupuestos y configuración bajo `usuarios/{uid}/`. Las reglas en `firestore.rules` permiten el acceso solo a documentos del usuario autenticado. La sincronización es por recarga y escritura: no hay caché offline ni actualización en tiempo real. La protección WebAuthn es un bloqueo local opcional del navegador, con huella/PIN/patrón según Android, y no sustituye una verificación del servidor. Las antiguas fichas de consultas DTC fuera de Mi Taller siguen en el almacenamiento local del navegador; esas **no** se sincronizan.

Página: https://scantec77-diag.github.io/scantec/

## Guías eléctricas por sensor (octubre de 2026)
- Al consultar ciertos DTC, la misma ficha incorpora una guía del sensor relacionado: MAP, MAF, ECT, IAT, TPS/APP, lambda, CKP, CMP, detonación y presión de combustible.
- Muestra **funciones posibles de terminales, condiciones de medición, valores de ejemplo y pruebas paso a paso**, junto con enlace a documentación técnica de HELLA o Bosch. Las guías también se agregan al texto de «Copiar ficha».
- **No se publican números de pin ni colores de cables sin validación** para vehículo, motor, año, ECU y versión. Una función de terminal no es un pinado.
- Referencias como NTC 25 °C / 80 °C, alimentación de 5 V o lambda de 0,1–0,9 V se aplican solo a las tecnologías indicadas; nunca son especificaciones universales.
- Las fichas de diagnóstico no sustituyen la confirmación del código y la comprobación con manual oficial. En sensores Hall/activos, identificar tecnología antes de usar ohmímetro.
- Implementación de esta primera etapa: `sensores.js` enlazado a `index.html`. No modifica Firebase, Mi Taller ni el formato de presupuestos.

### Imágenes y cables habituales
Las fichas de las diez familias de sensores incorporan una visualización orientativa y cantidad de conductores habitual, con variantes (CKP Hall/inductivo, lambda convencional/AFR, IAT y MAP/MAF combinados, etc.). Los esquemas vectoriales se generan localmente en `sensores.js` para funcionar sin cargar imágenes remotas. Las fotografías de referencia de MAF, TPS y lambda, con atribución y enlace a sus fichas de licencia de Wikimedia Commons, se cargan si hay internet; si fallan, aparece automáticamente la ilustración local. Estas imágenes **no identifican una pieza exacta de un vehículo ni la posición de sus pines**. La cantidad de conductores no equivale a un pinado validado.

## Biblioteca Chevrolet por código de falla · primera etapa
- Archivos nuevos: `biblioteca/chevrolet/catalogo.json` (catálogo editable de enlaces y metadatos) y `biblioteca-marcas.js` (búsqueda contextual).
- Al consultar un DTC con marca **Chevrolet** en el campo Vehículo, aparece la sección **Biblioteca Chevrolet**. Detecta sistema relacionado (ECT, MAP, CKP, CMP, etc.), modelo y año, y ofrece fuentes con el nivel de correspondencia indicado.
- Se incorpora el campo opcional **Motor / ECU**; se guarda en borradores y fichas de consulta, se recupera del historial y se agrega al texto copiado. Ejemplo: vehículo `Chevrolet Astra 1999`, motor `X20XEV`, DTC `P0117`: aparecen enlaces a los diagramas Opel del motor declarado, **aún pendientes de validación de ECU/mercado**.
- Cuando falta motor/ECU, no se promociona ningún plano de una motorización distinta como exacto: se ven los **índices** de diagramas que correspondan por modelo/año, y algunos esquemas generales marcados como orientativos.
- En particular, un `Chevrolet Astra 2.0 8V 1999` **no** se hace pasar por motor europeo X20XEV de 16 válvulas. Para Meriva MY2012 se enlaza el **manual original de propietario de Chevrolet Argentina**, rotulado expresamente como **no plano ECU**.
- Las fuentes externas incluyen diagramas de OpelBook y el portal oficial GM/ACDelco TDS (general, potencialmente pago). Estos enlaces no implican equivalencia verificada con los Chevrolet fabricados/comercializados en Argentina o Brasil.
- No se descargan, rehostean ni se redistribuyen los manuales de terceros; se abren las fuentes externas. El catálogo y el código están en la caché de la app, pero los planos remotos necesitan conexión.
- Para ampliar con planos propios/autorizados, agregar documentos con metadatos confiables de vehículo, año, código motor, identificación ECU, mercado y circuito. No cargar pinouts de otra motorización como si fuesen iguales.
