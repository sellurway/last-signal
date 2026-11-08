export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

function parseWav(buffer) {
  if (buffer.length < 44 || buffer.toString('ascii',0,4) !== 'RIFF' || buffer.toString('ascii',8,12) !== 'WAVE') throw new Error('Upload a valid WAV recording.');
  let offset=12, channels=0, sampleRate=0, bits=0, dataSize=0, format=0;
  while(offset+8<=buffer.length){
    const id=buffer.toString('ascii',offset,offset+4), size=buffer.readUInt32LE(offset+4);
    if(id==='fmt ' && offset+24<=buffer.length){format=buffer.readUInt16LE(offset+8);channels=buffer.readUInt16LE(offset+10);sampleRate=buffer.readUInt32LE(offset+12);bits=buffer.readUInt16LE(offset+22)}
    if(id==='data'){dataSize=size;break}
    offset+=8+size+(size%2);
  }
  if(format!==1||channels!==1||bits!==16||sampleRate<22050) throw new Error('Voice sample must be PCM, 16-bit, mono WAV at 22.05 kHz or higher.');
  const seconds=dataSize/(sampleRate*channels*(bits/8));
  if(seconds<3||seconds>10) throw new Error('Voice sample must be between 3 and 10 seconds. Aim for about 5 seconds.');
}

export default async function handler(req,res){
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'})}
  const apiKey=process.env.FEDEMIC||process.env.fedemic||process.env.navidiakey||process.env.Nvidiakey;
  const endpoint=process.env.NVIDIA_MAGPIE_ZEROSHOT_URL;
  if(!apiKey)return res.status(500).json({error:'NVIDIA API key is not configured.'});
  if(!endpoint)return res.status(503).json({error:'Voice cloning needs an approved NVIDIA Magpie ZeroShot endpoint. Configure NVIDIA_MAGPIE_ZEROSHOT_URL in Vercel after NVIDIA grants access. Standard Magpie TTS does not support cloning.'});
  const {text,language='en-US',audioBase64,consent}=req.body||{};
  if(consent!==true)return res.status(400).json({error:'Confirm that you own this voice or have the speaker’s explicit permission.'});
  if(typeof text!=='string'||!text.trim()||text.length>2000)return res.status(400).json({error:'Enter a script of up to 2,000 characters.'});
  const languages=['en-US','es-US','fr-FR','de-DE','zh-CN','vi-VN','it-IT','hi-IN','ja-JP','ko-KR','ar-XA','pt-BR'];
  if(!languages.includes(language))return res.status(400).json({error:'Unsupported language.'});
  if(typeof audioBase64!=='string'||audioBase64.length>3500000)return res.status(400).json({error:'Upload a WAV voice sample smaller than 2.5 MB.'});
  try{
    const raw=audioBase64.replace(/^data:audio\/wav;base64,/i,'');
    const audio=Buffer.from(raw,'base64');
    parseWav(audio);
    const form=new FormData();
    form.append('text',text.trim());
    form.append('language',language);
    form.append('voice','Magpie-ZeroShot-Multilingual');
    form.append('audio_prompt',new Blob([audio],{type:'audio/wav'}),'voice-reference.wav');
    form.append('sample_rate_hz','22050');
    const base=endpoint.replace(/\/$/,'');
    const url=base.endsWith('/v1/audio/synthesize')?base:base+'/v1/audio/synthesize';
    const upstream=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${apiKey}`},body:form});
    if(!upstream.ok){const detail=await upstream.text();return res.status(upstream.status).json({error:`NVIDIA voice cloning error (${upstream.status}): ${detail.slice(0,800)}`})}
    const wav=Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type','audio/wav');res.setHeader('Content-Disposition','attachment; filename="fedemic-cloned-voice.wav"');res.setHeader('Cache-Control','no-store');
    return res.status(200).send(wav);
  }catch(error){return res.status(400).json({error:error.message||'Voice cloning failed.'})}
}
