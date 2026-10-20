# Scantec — Catálogo Chevrolet (estructura inicial)

Objetivo: una ficha por componente físico y referencias por vehículo, motor, año y ECU. No inferir compatibilidad solo por apariencia o cilindrada.

## Modelos prioritarios para relevar
Astra, Corsa, Classic, Celta, Meriva, Zafira, Agile, Prisma, Onix, Spin, Vectra, S10, Montana, Cruze, Sonic, Tracker, Captiva y otros modelos Chevrolet, incluyendo variantes regionales.

## Entidades
- Vehículo: marca, modelo, generación, año, mercado.
- Motor: código de motor, cilindrada, válvulas, ECU y variantes.
- Sensor: ID interno, denominación, función, tecnología, ubicación, fotografía con licencia, conectores, pinout y condiciones de medición.
- Aplicación: vehículo + motor + intervalo de años + sensor + número OEM + fuente.
- Código DTC: código, norma/fabricante, módulo, significado, causas posibles, pruebas y sensores relacionados.
- Manual: título, cobertura, fuente autorizada, enlace, idioma y acceso sin conexión.

## Compatibilidad
Estados: confirmado idéntico (misma referencia OEM y especificación), equivalente documentado, pendiente de verificar, incompatible. Una misma ficha puede referenciar múltiples aplicaciones, sin duplicar imágenes o datos. Registrar fuentes y fecha de verificación.

## Seguridad y calidad
No publicar pinouts, tensiones, resistencias o compatibilidades no verificadas como hechos. Identificar guía genérica versus dato específico. Un DTC no prueba por sí solo que el sensor esté averiado.

## Primer lote de componentes por investigar
CMP (árbol de levas), CKP (cigüeñal), MAP, MAF, ECT, IAT, TPS, APP, oxígeno/lambda, detonación, presión de combustible, velocidad de vehículo y presión de aire acondicionado.

Estado: esquema editorial inicial; no implica que ya se hayan verificado manuales, piezas ni aplicaciones.
