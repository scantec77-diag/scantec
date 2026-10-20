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
 try{const x=new URL(u);return x.protocol==='https:'&&['www.opelbook.ru','www.acdelcotds.com','mi.chevrolet.com.ar','pt.scribd.com','es.slideshare.net'].includes(x.hostname);}
 catch{return false}
}
function enlace(t,u,clase){
 const a=nodo('a',t,clase||'bib-link');
 if(urlValida(u)){a.href=u;a.target='_blank';a.rel='noopener noreferrer';}
 else{a.removeAttribute('href');a.setAttribute('aria-disabled','true');}
 return a;
}
function esChevrolet(v){
 const s=normal(v);
 if(/\b(chevrolet|chevy|chev|gm|opel)\b/.test(s))return true;
 // Reconocer modelos GM habituales en Argentina sin exigir escribir la marca.
 if(/\b(astra|corsa|meriva|classic|agile|zafira|vectra)\b/.test(s)&&
   !/\b(volkswagen|vw|fiat|renault|ford|peugeot|citroen|toyota|honda|nissan|kia|hyundai)\b/.test(s))return true;
 return false;
}
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
 card.insertBefore(panel,$('causesBox')||ref);
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

function circuitoECT(){
 const envoltura=nodo('div',null,'bib-circuit');
 const titulo=nodo('strong','📐 Circuito de ECT tipo NTC · referencia funcional');
 envoltura.appendChild(titulo);
 envoltura.appendChild(nodo('p','Este dibujo es un circuito orientativo del sensor y la ECU. NO es un plano de Chevrolet ni identifica pines, colores, fusibles o conectores.','result-caption'));
 const details=nodo('details',null,'bib-schematic');
 details.open=true;
 const summary=nodo('summary','Ver circuito ECT en Scantec · normalmente 2 cables');
 details.appendChild(summary);
 const svg=nodo('div',null,'bib-svg');
 // SVG original, no se copia de manuales de terceros. Dibujo de lógica NTC en divisor resistivo.
 svg.innerHTML='<svg viewBox="0 0 720 280" role="img" aria-label="Esquema funcional del sensor ECT: una resistencia interna ECU desde 5 voltios a una línea de señal; sensor NTC entre señal y retorno a masa de ECU. No muestra números de pines." xmlns="http://www.w3.org/2000/svg">'
 +'<rect x="16" y="20" width="360" height="232" rx="13" fill="#103453" stroke="#3d9ac8" stroke-width="2"/>'
 +'<rect x="432" y="20" width="272" height="232" rx="13" fill="#173b50" stroke="#3d9ac8" stroke-width="2"/>'
 +'<g font-size="18" font-family="system-ui" fill="#effaff"><text x="36" y="50">ECU / computadora</text><text x="456" y="50">Sensor ECT (NTC)</text></g>'
 +'<g font-size="15" font-family="system-ui" fill="#c9e4f5"><text x="34" y="90">Referencia interna</text><text x="40" y="121">5 V</text><text x="36" y="184">Entrada de señal</text><text x="36" y="226">Retorno sensor</text><text x="548" y="100">NTC</text><text x="562" y="231">Masa ECU</text></g>'
 +'<g stroke="#80dfff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M115 118H220V130"/><path d="M220 174V178H445H565V129"/><path d="M220 178H178"/><path d="M178 220H570V188"/><path d="M220 130v10m0 25v9"/></g>'
 +'<g stroke="#ffb56c" stroke-width="3" fill="none"><rect x="207" y="140" width="26" height="25" rx="2"/><path d="M552 128l25 12-25 12 25 12-25 13 13 11"/></g>'
 +'<g fill="#ecfbff"><circle cx="220" cy="178" r="5"/><circle cx="565" cy="178" r="4"/></g>'
 +'<g font-size="13" font-family="system-ui" fill="#f7cda7"><text x="248" y="151">Resistencia</text><text x="248" y="167">pull-up</text></g>'
 +'<g font-size="14" font-family="system-ui" fill="#fff"><text x="385" y="165">Señal</text><text x="383" y="214">Retorno</text></g>'
 +'</svg>';
 details.appendChild(svg);
 details.appendChild(nodo('p','Al subir la temperatura, la resistencia del NTC suele disminuir y cambia la tensión de señal. La curva, valores y conexión real deben verificarse según ECU y sensor.','result-caption'));
 envoltura.appendChild(details);
 return envoltura;
}
function documentoRegionalCompatible(d,vehiculo,year,motorEcu){
 if(d.tipo!=='plano_regional'&&d.tipo!=='archivo_regional')return false;
 if(!etiquetaAnio(d,year))return false;
 const v=normal(vehiculo);
 if(d.modelo!=='astra'||!/\bastra\b/.test(v))return false;
 const ecu=normal(motorEcu);
 // Impedir ofrecer diagramas Motronic M1.5.5 cuando la ECU/motorización declarada sea otra.
 if(/\b(x20xev|x18xe1|z18xe|z14xe|x16szr|x16xel|simtec|multec)\b/.test(ecu))return false;
 if(/\b16\s*v(?:alvulas)?\b/.test(ecu))return false;
 // El catálogo de esta etapa describe Astra 2.0 8V, no motores distintos.
 if(/\b16\s*v(?:alvulas)?\b/.test(v)||/\b(1[.,]6|1[.,]8|2[.,]2)\b/.test(v))return false;
 return true;
}
function fichaRegional(d,vehiculo,motorEcu){
 const f=[vehiculo,motorEcu].join(' ');
 const confirma8v=/\b2[.,]0\s*8\s*v\b/i.test(f)||/\b2[.,]0\s*8\s*valvulas\b/i.test(f);
 const diceOtro=!!motorEcu.trim()&&!/m1[.,]5[.,]5|motronic|\b2[.,]0\s*8\s*v/i.test(motorEcu);
 return confirma8v&&!diceOtro?'Referencia de Astra 2.0 8V · ECU por validar':'Fuente candidata · motor y ECU sin validar';
}

function renderizar(d,code,vehiculo,motorEcu){
 const el=asegurar();if(!el)return;
 el.replaceChildren();
 const mdl=modelo(vehiculo),year=anio(vehiculo+' '+motorEcu);
 const fuente=[vehiculo,motorEcu].filter(Boolean).join(' ');
 const grupos=sistemas(code);
 const mDesc=mdl?mdl.charAt(0).toUpperCase()+mdl.slice(1):'modelo no especificado';
 el.appendChild(nodo('h4','📚 Biblioteca Chevrolet · Planos eléctricos'));
 el.appendChild(nodo('p','Falla '+code+' · '+(grupos.length?grupos.map(nombreSistema).join(' / '):'Sistema sin correspondencia definida')+' · '+mDesc+(year?' '+year:''),'bib-sub'));
 el.appendChild(nodo('p','⚠️ Un DTC orienta el circuito, no confirma la ECU. Los enlaces externos son referencias sin homologación para el vehículo concreto: no usar sus números de pin sin verificar motor, ECU y mercado.','bib-warning'));
 if(grupos.includes('ect'))el.appendChild(circuitoECT());
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
  const regionales=docs.filter(a=>documentoRegionalCompatible(a,vehiculo,year,motorEcu)&&grupos.length&&a.sistemas?.some(g=>grupos.includes(g)));
  const específicos=docs.filter(a=>a.tipo==='plano'&&
      Array.isArray(a.motores)&&coincidenciaMotor(a.motores,fuente)&&
      !conflictoValvulas(a,fuente)&&
      grupos.length&&a.sistemas?.some(g=>grupos.includes(g)));
  const generales=docs.filter(a=>a.tipo==='sistema'&&grupos.length&&a.sistemas?.some(g=>grupos.includes(g)));
  const orientativos=!String(motorEcu||'').trim()?
   docs.filter(a=>a.tipo==='plano'&&!específicos.includes(a)&&!conflictoValvulas(a,fuente)&&grupos.length&&a.sistemas?.some(g=>grupos.includes(g))).slice(0,5):[];

  const indices=docs.filter(a=>a.tipo==='indice');
  const manuales=docs.filter(a=>a.tipo==='manual');
  if(regionales.length){
   el.appendChild(nodo('h5','📄 Planos eléctricos del Astra 2.0 8V publicados para consulta'));
   el.appendChild(nodo('p','Encontré documentación para esta versión regional. El enlace abre el documento original en otra pestaña; puede requerir cuenta. Revisá la identificación Bosch Motronic M1.5.5 antes de usar los pines.','result-caption'));
   regionales.forEach(a=>el.appendChild(renglon(a,fichaRegional(a,vehiculo,motorEcu))));
  }
  if(específicos.length){
   el.appendChild(nodo('h5','Esquemas relacionados con el motor declarado (validar ECU y mercado)'));
   específicos.forEach(a=>el.appendChild(renglon(a,'Referencia Opel · motor declarado')));
  }else{
   el.appendChild(nodo('p',regionales.length?'Aún no hay un pinado de ECU confirmado para este vehículo. La documentación regional de arriba es una referencia pendiente de validación.':'No hay un plano de motor/ECU confirmado para esta consulta. No se muestran planos de otras motorizaciones como si fueran compatibles.','result-caption'));
   if(!motorEcu.trim())el.appendChild(nodo('p','Para afinar: completá el campo «Motor / ECU» con el código de motor real (por ejemplo X20XEV), no solo cilindrada.','result-caption'));
  }
  if(orientativos.length){
   el.appendChild(nodo('h5','Diagramas orientativos para el sistema (motor sin verificar)'));
   el.appendChild(nodo('p','Estos diagramas son de motores Opel diferentes: sirven para explorar el sistema, NO como pinado del Chevrolet. Para confirmar una correspondencia, identificá la ECU.','bib-warning'));
   orientativos.forEach(a=>el.appendChild(renglon(a,'Motor no identificado · no usar pines')));
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
 if(kind==='invalid'){el.hidden=true;el.replaceChildren();return;}
 const c=String(code||'').toUpperCase().replace(/\s+/g,'');
 if(!esChevrolet(vehiculo)){
  // Permitir que se vea al menos el circuito ECT aunque el usuario
  // haya buscado un DTC sin completar todavía la marca/modelo.
  if(/^P011[5-9]$/.test(c)){
   el.hidden=false;
   el.replaceChildren();
   el.appendChild(nodo('h4','📐 Plano funcional · Sensor ECT'));
   el.appendChild(circuitoECT());
   el.appendChild(nodo('p','Para enlazar planos publicados del vehículo, completá arriba Chevrolet, modelo y año (por ejemplo: Chevrolet Astra 2.0 8V 1999). El diagrama anterior es solo orientativo.','result-caption'));
  }else{el.hidden=true;el.replaceChildren();}
  return;
 }
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
  el.appendChild(nodo('p','Mientras tanto podés entrar a la biblioteca independiente, que incluye un acceso directo al plano MAP de Corsa Z14XE.','result-caption'));
  const pagina=nodo('a','📚 Abrir Planos y Manuales ↗','bib-link');pagina.href='./biblioteca.html';el.appendChild(pagina);

  el.appendChild(enlace('Abrir portal oficial de GM ↗',GM_SI));
 }
}
window.ScantecBiblioteca=Object.freeze({mostrar,modelo,sistemas,esChevrolet});
})();