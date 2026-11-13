# Publicación de MisGigas

Al entregar una actualización de MisGigas, publicarla también en este canal salvo que Ari pida expresamente una compilación sin publicar.

1. Compilar con versionCode mayor al publicado y conservar la identidad ar.ari.gigas y la firma existente. Verificar la APK con apksigner y contrastar su versión y certificado con la anterior.
2. Subir misgigas/MisGigas_v<versión>_pruebas.apk.
3. Actualizar misgigas/updates.json conservando la apariencia remota: packageName, versionCode, versionName, apkUrl del mismo canal y SHA-256 de los bytes finales firmados.
4. Publicar APK y manifiesto en un único commit, preservando el árbol existente. Actualizar la rama misgigas-updates con el SHA esperado; no forzar ni sobrescribir cambios concurrentes.
5. Verificar después el manifiesto remoto y el blob de la APK. No anunciar que el teléfono vio el aviso sin evidencia del dispositivo.
6. Indicar que el círculo rojo aparece al detectar una versión mayor. La consulta es periódica, aproximadamente cada 15 minutos y sujeta a Android; no es push ni instalación silenciosa. Android solicita confirmar la instalación.

Las versiones intermedias quedan como historial: un teléfono antiguo descarga directamente la última publicada. No necesita instalar cada versión por separado.

No publicar claves de firma, contraseñas, cookies ni credenciales en este canal.
