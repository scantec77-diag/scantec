// Scantec Mi Taller: bloqueo local opcional WebAuthn.
// La clave privada permanece en el autenticador del dispositivo; esta capa
// no reemplaza controles de acceso aplicados en un servidor.
const enc=new TextEncoder();
const b64=bytes=>{let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const un64=str=>Uint8Array.from(atob(str.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((str.length+3)%4)),c=>c.charCodeAt(0));
const random=()=>crypto.getRandomValues(new Uint8Array(32));
const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
function assertClient(response,type,challenge){
  const c=JSON.parse(new TextDecoder().decode(response.clientDataJSON));
  if(c.type!==type||c.origin!==location.origin||c.challenge!==b64(challenge))throw new Error("La validación del origen o del desafío no coincide.");
}
function assertFlags(data){
  if(data.length<37||(data[32]&0x05)!==0x05)throw new Error("El dispositivo no confirmó presencia y desbloqueo del usuario.");
}
function derToRaw(sig){
  // La firma WebAuthn ECDSA llega en DER; WebCrypto requiere IEEE P1363.
  let p=0;
  function len(){let l=sig[p++];if(l&0x80){let n=l&0x7f;if(n===0||n>2)throw Error("Firma ECDSA inválida.");l=0;for(let i=0;i<n;i++)l=l*256+sig[p++];}return l;}
  if(sig[p++]!==0x30)throw Error("Firma ECDSA inválida.");
  const seqLen=len(),end=p+seqLen;if(end!==sig.length)throw Error("Firma ECDSA inválida.");
  const out=new Uint8Array(64);
  for(let i=0;i<2;i++){
    if(sig[p++]!==0x02)throw Error("Firma ECDSA inválida.");
    const n=len();let v=sig.slice(p,p+n);p+=n;
    while(v.length>32&&v[0]===0)v=v.slice(1);
    if(v.length>32||v.length===0)throw Error("Firma ECDSA inválida.");
    out.set(v,32*i+32-v.length);
  }
  if(p!==end)throw Error("Firma ECDSA inválida.");
  return out;
}
function concat(a,b){const out=new Uint8Array(a.length+b.length);out.set(a);out.set(b,a.length);return out}
export function disponible(){return window.isSecureContext&&!!window.PublicKeyCredential&&!!navigator.credentials&&!!crypto.subtle}
export async function enrolar(user){
  if(!disponible())throw new Error("Este navegador no admite credenciales de dispositivo. Probá desde Chrome actualizado.");
  const challenge=random();
  const created=await navigator.credentials.create({publicKey:{
    rp:{name:"Scantec Mi Taller",id:location.hostname},
    user:{id:enc.encode(user.uid).slice(0,64),name:user.email||"Cuenta Scantec",displayName:user.displayName||user.email||"Cuenta Scantec"},
    challenge,pubKeyCredParams:[{type:"public-key",alg:-7}],timeout:60000,
    authenticatorSelection:{authenticatorAttachment:"platform",residentKey:"preferred",userVerification:"required"},
    attestation:"none"
  }});
  if(!created||created.type!=="public-key")throw new Error("No se creó la credencial.");
  assertClient(created.response,"webauthn.create",challenge);
  if(typeof created.response.getAuthenticatorData==="function")assertFlags(new Uint8Array(created.response.getAuthenticatorData()));
  const pub=created.response.getPublicKey?.();
  const alg=created.response.getPublicKeyAlgorithm?.();
  if(!pub||alg!==-7)throw new Error("El dispositivo no entregó una clave compatible.");
  return {id:b64(new Uint8Array(created.rawId)),publicKey:b64(new Uint8Array(pub)),rp:location.hostname,version:1};
}
export async function verificar(record){
  if(!disponible())throw new Error("WebAuthn no está disponible. Abrí Mi Taller con Chrome actualizado.");
  if(!record||record.rp!==location.hostname)throw new Error("Credencial incompatible con este sitio.");
  const challenge=random();
  const result=await navigator.credentials.get({publicKey:{
    challenge,rpId:location.hostname,userVerification:"required",timeout:60000,
    allowCredentials:[{type:"public-key",id:un64(record.id),transports:["internal","hybrid"]}]
  }});
  if(!result||result.type!=="public-key"||b64(new Uint8Array(result.rawId))!==record.id)throw new Error("No coincide la credencial registrada.");
  assertClient(result.response,"webauthn.get",challenge);
  const ad=new Uint8Array(result.response.authenticatorData);
  assertFlags(ad);
  const rpHash=new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(location.hostname)));
  if(!equal(ad.slice(0,32),rpHash))throw new Error("El dispositivo confirmó otro sitio.");
  const key=await crypto.subtle.importKey("spki",un64(record.publicKey),{name:"ECDSA",namedCurve:"P-256"},false,["verify"]);
  const clientHash=new Uint8Array(await crypto.subtle.digest("SHA-256",result.response.clientDataJSON));
  const signature=derToRaw(new Uint8Array(result.response.signature));
  const good=await crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},key,signature,concat(ad,clientHash));
  if(!good)throw new Error("No se pudo verificar la firma de seguridad.");
  return true;
}