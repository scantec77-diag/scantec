import {getFirestore,collection,getDocs,doc,writeBatch} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

// Todos los documentos se guardan bajo usuarios/{uid}/...  Las
// reglas de Firestore comprueban uid en el servidor antes de permitir acceso.
const TIPOS=["clientes","vehiculos","trabajos","documentos"];
const copia=x=>JSON.parse(JSON.stringify(x));
const objectMap=items=>new Map((items||[]).filter(v=>v&&typeof v.id==="string").map(v=>[v.id,v]));
const limitId=id=>typeof id==="string"&&id.length>0&&id.length<250&&!id.includes("/");
export async function cargarNube(app,uid){
 const firestore=getFirestore(app);
 const listas=await Promise.all(TIPOS.map(async tipo=>{
   const query=await getDocs(collection(firestore,"usuarios",uid,tipo));
   return query.docs.map(d=>({...(d.data()||{}),id:d.id}));
 }));
 const configSnap=await getDocs(collection(firestore,"usuarios",uid,"configuracion"));
 const config=configSnap.docs.find(d=>d.id==="general")?.data()||{correo:"",whatsapp:""};
 const datos={...Object.fromEntries(TIPOS.map((tipo,i)=>[tipo,listas[i]])),ajustes:config};
 return {datos,firestore};
}
export async function persistirNube(firestore,uid,antes,despues){
 const cambios=[];
 for(const tipo of TIPOS){
   const anteriores=objectMap(antes[tipo]),actuales=objectMap(despues[tipo]);
   for(const [id,old] of anteriores) if(!actuales.has(id))cambios.push({tipo,id,eliminar:true});
   for(const [id,valor] of actuales)if(JSON.stringify(valor)!==JSON.stringify(anteriores.get(id))){
     if(!limitId(id))throw new Error("Una ficha tiene un identificador no válido.");
     cambios.push({tipo,id,valor});
   }
 }
 if(JSON.stringify(antes.ajustes||{})!==JSON.stringify(despues.ajustes||{})){
   cambios.push({tipo:"configuracion",id:"general",valor:despues.ajustes||{correo:"",whatsapp:""}});
 }
 for(let start=0;start<cambios.length;start+=450){
   const batch=writeBatch(firestore);
   for(const m of cambios.slice(start,start+450)){
     const ref=doc(firestore,"usuarios",uid,m.tipo,m.id);
     if(m.eliminar)batch.delete(ref);
     else batch.set(ref,m.valor);
   }
   await batch.commit();
 }
 return copia(despues);
}
