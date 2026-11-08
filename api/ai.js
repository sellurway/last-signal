import { MODELS } from './models.js';
export const config={api:{bodyParser:{sizeLimit:'6mb'}}};
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed.'});}
 const {prompt,system,images,model:requestedModel}=req.body||{};
 if(typeof prompt!=='string'||(!prompt.trim()&&!Array.isArray(images)))return res.status(400).json({error:'Enter a message or attach an image.'});
 if(prompt.length>20000||(typeof system==='string'&&system.length>5000))return res.status(413).json({error:'Your prompt is too long. Please shorten it and try again.'});
 const attached=Array.isArray(images)?images:[];
 if(attached.length>3)return res.status(400).json({error:'You can attach up to 3 images per message.'});
 const validImages=[];
 for(const image of attached){if(typeof image!=='string'||!/^data:image\/(jpeg|png|webp);base64,/i.test(image)||image.length>1500000)return res.status(400).json({error:'An image is invalid or too large. Use JPG, PNG or WEBP images under 1.1 MB after compression.'});validImages.push(image);}
 const selected=MODELS.find(item=>item.id===requestedModel)||MODELS[0];
 const provider=validImages.length?MODELS[0]:selected;
 const apiKey=process.env[provider.env]||(provider.env==='FEDEMIC'?(process.env.fedemic||process.env.navidiakey):'');
 if(!apiKey)return res.status(503).json({error:provider.provider+' is not connected. Add '+provider.env+' in Vercel Project Settings → Environment Variables, then redeploy.'});
 try{
  const userContent=validImages.length?[...validImages.map(url=>({type:'image_url',image_url:{url}})),{type:'text',text:prompt.trim()||'Please describe and help me understand the attached image(s).'}]:prompt.trim();
  const upstream=await fetch(provider.baseURL+'/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({model:validImages.length?'nvidia/nemotron-nano-12b-v2-vl':provider.id,messages:[{role:'system',content:typeof system==='string'&&system.trim()?system:'You are Fedemic AI, a helpful, clear and creative assistant.'},{role:'user',content:userContent}],temperature:0.7,max_tokens:4096,stream:false})});
  const responseBody=await upstream.text();let data={};try{data=responseBody?JSON.parse(responseBody):{};}catch{data={};}
  if(!upstream.ok){const message=data?.error?.message||data?.error?.detail||data?.message||data?.detail||data?.title||(responseBody?responseBody.slice(0,1000):'No error details returned by the provider.');return res.status(upstream.status>=400&&upstream.status<600?upstream.status:502).json({error:provider.provider+' HTTP '+upstream.status+': '+message});}
  const text=data?.choices?.[0]?.message?.content;if(typeof text!=='string'||!text.trim())return res.status(502).json({error:provider.provider+' returned an empty response. Try another model.'});
  return res.status(200).json({text,provider:provider.provider,model:provider.id});
 }catch{return res.status(502).json({error:'Could not reach '+provider.provider+'. Please try again.'});}
}