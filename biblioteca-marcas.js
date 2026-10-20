/* Biblioteca por marca · fase inicial Chevrolet.
 * Enlaces a documentación externa sin copiar archivos de terceros.
 * No se anuncia ningún pinado como exacto sin validar motor + ECU + mercado.
 */
(function(){
'use strict';
const BASE='./biblioteca/chevrolet/catalogo.json';
const GM_SI='https://www.acdelcotds.com/';
let panel=null, solicitud=0, promesa=null;
const $=id=>document.getElementById(id);
function normal(t){return String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function texto(el,t){el.textContent=String(t||'');return el;}
function nodo(tag,contenido,clase){
 const el=document.createElement(tag);
 if(contenido!==undefined&&contenido!==null)texto(el,contenido);
 if(clase)el.className=clase;
 return el;
}
function urlValida(u){
 try{const x=new URL(u);return x.protocol==='https:'&&['www.opelbook.ru','www.acdelcotds.com','mi.chevrolet.com.ar'].includes(x.hostname);}
 catch{return false}
}
function enlace(t,u,clase){
 const a=nodo('a',t,clase||'bib-link');
 if(urlValida(u)){a.href=u;a.target='_blank';a.rel='noopener noreferrer';}
 else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');}
 return a;
}
function esChevrolet(v){return /\b(chevrolet|chevy|chev|gm)\b/.test(normal(v));}
function modelo(v){
 const s=normal(v);
 if(/\bastra\b/.test(s))return 'astra';
 if(/\b(corsa|classic)\b/.test(s))return 'corsa';
 if(/\bmeriva\b/.test(s))return 'meriva';
 if(/\bagile\b/.test(s))return 'agile';
 if(/\b(zafira|vectra|s10|cruze|onix|prisma|spin)\b/.test(s))return s.match(/\b(zafira|vectra|s10|cruze|onix|prisma|spin)\b/)[0];
 return '';
}
function anio(v){const match=String(v||'').match(/\b(19[89]\d|20[0-3]\d)\b/);return match?Number(match[0]):null;}
function claveMotor(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
function coincidenciaMotor(motores,fuente){return Array.isArray(motores)&&motores.some(m=>{
 const codigo=claveMotor(m);
 // No admitir coincidencias accidentales en kilometrajes, patentes o palabras.
 const tokens=String(fuente||'').toUpperCase().match(/[A-Z][A-Z0-9_-]{3,}/g)||[];
 return tokens.some(token=>claveMotor(token)===codigo);
});}
function conflictoValvulas(d,fuente){
 // Ejemplo crítico: un Astra Chevrolet 2.0 8V NO equivale a X20XEV 16V.
 const s=normal(fuente);
 return /\b8\s*v(?:alvulas)?\b/.test(s)&&
 (d.motores||[]).some(m=>['X20XEV','X14XE','X16XEL','X18XE1','Z14XE','Z18XE'].includes(claveMotor(m)));
}
function sistemas(code){
 const c=String(code||'').toUpperCase().replace(/\s/g,'');
 let base=(window.ScantecSensores&&window.ScantecSensores.tipo(c))||'';
 const x=new Set(base?[base]:[]);
 if(/^P020[0-9]$/.test(c)||/^P021[0-9]$/.test(c))x.add('injectors');
 if(/^P023[0-4]$/.test(c))x.add('fuelpump');
 if(/^P030[0-9]$/.test(c)||/^P035[0-9]$/.test(c))x.add('misfire');
 if(/^P0128$/.test(c)||/^P048[0-9]$/.test(c))x.add('cooling');
 if(/^P011[5-9]$/.test(c))x.add('cooling');
 if(/^P053[0-9]$/.test(c))x.add('ac');
 return [...x];
}
function nombreSistema(x){
 return ({map:'MAP',maf:'MAF',ect:'ECT / refrigeración',iat:'IAT',tps:'TPS / acelerador',ckp:'CKP',cmp:'CMP',oxygen:'sonda lambda',knock:'detonación',fuel:'presión de combustible',fuelpump:'bomba de combustible',injectors:'inyectores',misfire:'encendido / combustión',cooling:'refrigeración',ac:'aire acondicionado'})[x]||x;
}
function cargar(){
 if(!promesa)promesa=fetch(BASE,{cache:'no-cache'}).then(r=>{
  if(!r.ok)throw Error('Error HTTP '+r.status);
  return r.json();
 }).then(d=>{
  if(d.marca!=='Chevrolet'||!Array.isArray(d.planos))throw Error('Biblioteca incompleta');
  return d;
 }).catch(e=>{promesa=null;throw e;});
 return promesa;
}
function asegurar(){
 if(panel)return panel;
 const card=$('resultCard'),ref=$('resultCaution');
 if(!card||!ref)return null;
 panel=nodo('section',null,'bib-chevrolet');
 panel.id='bibliotecaChevrolet';
 panel.setAttribute('aria-label','Biblioteca Chevrolet de planos eléctricos');
 card.insertBefore(panel,ref);
 return panel;
}
function renglon(doc,estado){
 const art=nodo('article',null,'bib-doc');
 const head=nodo('div',null,'bib-doc-head');
 head.appendChild(nodo('strong',doc.titulo));
 head.appendChild(nodo('span',estado,'bib-status'));
 art.appendChild(head);
 art.appendChild(nodo('p',doc.plataforma||'Chevrolet','result-caption'));
 if(doc.motores?.length)art.appendChild(nodo('p','Motor de la fuente: '+doc.motores.join(' / '),'result-caption'));
 if(doc.nota)art.appendChild(nodo('p',doc.nota,'result-caption'));
 art.appendChild(enlace(doc.tipo==='indice'?'📚 Explorar colección de diagramas ↗':doc.tipo==='manual'?'📖 Abrir manual del propietario ↗':'📄 Abrir plano original ↗',doc.url));
 return art;
}
function etiquetaAnio(doc,year){return !year||!Array.isArray(doc.anios)||year>=doc.anios[0]&&year<=doc.anios[1];}
function renderizar(d,code,vehiculo,motorEcu){
 const el=asegurar();if(!el)return;
 el.replaceChildren();
 const mdl=modelo(vehiculo),year=anio(vehiculo+' '+motorEcu);
 const fuente=[vehiculo,motorEcu].filter(Boolean).join(' ');
 const grupos=sistemas(code);
 const mDesc=mdl?mdl.charAt(0).toUpperCase()+mdl.slice(1):'modelo no especificado';
 el.appendChild(nodo('h4','📚 Biblioteca Chevrolet · Planos eléctricos'));
 el.appendChild(nodo('p','Falla '+code+' · '+(grupos.length?grupos.map(nombreSistema).join(' / '):'Sistema sin correspondencia definida')+' · '+mDesc+(year?' '+year:''),'bib-sub'));
 el.appendChild(nodo('p','⚠️ El código de falla sirve para sugerir el circuito, no para demostrar que un plano coincide con la ECU. Los diagramas Opel son referencias de otras versiones: no medir por sus pines hasta confirmar la equivalencia.','bib-warning'));
 if(!mdl){
  el.appendChild(nodo('p','Escribí Chevrolet + modelo + año y, si lo conocés, el código del motor o la ECU (ej.: Astra 1999, motor X20XEV). Para vehículos de Argentina puede ser diferente.','result-caption'));
 }else{
  if(/8\s*v\b/i.test(fuente)&&mdl==='astra'){
   el.appendChild(nodo('p','⚠️ Astra 8 válvulas: NO se mostrará como coincidencia un plano europeo X20XEV de 16 válvulas. Falta identificar el sistema eléctrico correcto de esta versión regional.','bib-warning'));
  }
  if(/\bclassic\b/i.test(fuente)){
   el.appendChild(nodo('p','Classic: las series Opel Corsa B/C de la biblioteca no son automáticamente equivalentes al Chevrolet Classic argentino.','result-caption'));
  }
  const docs=d.planos.filter(a=>a.modelo===mdl&&etiquetaAnio(a,year));
  const específicos=docs.filter(a=>a.tipo==='plano'&&
      Array.isArray(a.motores)&&coincidenciaMotor(a.motores,fuente)&&
      !conflictoValvulas(a,fuente)&&
      grupos.length&&a.sistemas?.some(g=>grupos.includes(g)));
  const generales=docs.filter(a=>a.tipo==='sistema'&&grupos.length&&a.sistemas?.some(g=>grupos.includes(g)));
  const indices=docs.filter(a=>a.tipo==='indice');
  const manuales=docs.filter(a=>a.tipo==='manual');
  if(específicos.length){
   el.appendChild(nodo('h5','Esquemas relacionados con el motor declarado (validar ECU y mercado)'));
   específicos.forEach(a=>el.appendChild(renglon(a,'Referencia Opel · motor declarado')));
  }else{
   el.appendChild(nodo('p','No hay un plano de motor/ECU confirmado para esta consulta. No se muestran planos específicos de otras motorizaciones como si fueran compatibles.','result-caption'));
   if(!motorEcu.trim())el.appendChild(nodo('p','Para afinar: completá el campo «Motor / ECU» con el código de motor real (por ejemplo X20XEV), no solo cilindrada.','result-caption'));
  }
  if(generales.length){
   el.appendChild(nodo('h5','Esquemas generales del sistema (no homologados para tu vehículo)'));
   generales.forEach(a=>el.appendChild(renglon(a,'Referencia Opel · sistema')));
  }
  if(indices.length){
   el.appendChild(nodo('h5','Colecciones de diagramas para comparar'));
   indices.forEach(a=>el.appendChild(renglon(a,'Índice externo · no validado')));
  }
  if(manuales.length){
   el.appendChild(nodo('h5','Documentación Chevrolet complementaria'));
   manuales.forEach(a=>el.appendChild(renglon(a,'Manual original · no es plano ECU')));
  }
  if(!docs.length)el.appendChild(nodo('p','Por ahora no hay diagramas enlazados para este modelo y año. Se seguirá ampliando la biblioteca Chevrolet.','result-caption'));
 }
 const oficina=nodo('div',null,'bib-oficial');
 oficina.appendChild(nodo('strong','Fuente de servicio GM'));
 oficina.appendChild(nodo('p','Acceso a información de servicio de GM mediante ACDelco TDS. Requiere suscripción y la cobertura argentina debe verificarse. No abre directamente el diagrama.','result-caption'));
 oficina.appendChild(enlace('🔗 Ir al portal técnico oficial GM ↗',GM_SI));
 el.appendChild(oficina);
 el.appendChild(nodo('p','La documentación externa requiere conexión a internet. Scantec enlaza el material en su sitio de origen; no copia ni redistribuye planos de terceros.','result-caption'));
}
async function mostrar(code,vehiculo,kind,motorEcu){
 const seq=++solicitud,el=asegurar();
 if(!el)return;
 if(kind==='invalid'||!esChevrolet(vehiculo)){el.hidden=true;el.replaceChildren();return;}
 el.hidden=false;
 el.replaceChildren(nodo('p','Buscando diagramas en la biblioteca Chevrolet…','result-caption'));
 try{
  const d=await cargar();
  if(seq!==solicitud)return;
  renderizar(d,String(code||'').trim().toUpperCase(),String(vehiculo||'').trim(),String(motorEcu||'').trim());
 }catch(e){
  if(seq!==solicitud)return;
  el.replaceChildren();
  el.appendChild(nodo('h4','📚 Biblioteca Chevrolet'));
  el.appendChild(nodo('p','La biblioteca no se pudo cargar en este momento. Probá con conexión o actualizá la app.','result-caption'));
  el.appendChild(enlace('Abrir portal oficial de GM ↗',GM_SI));
 }
}
window.ScantecBiblioteca=Object.freeze({mostrar,modelo,sistemas,esChevrolet});
})();