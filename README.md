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
