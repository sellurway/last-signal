export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed.'})}
 const key=process.env.FEDEMIC||process.env.fedemic||process.env.navidiakey;
 if(!key)return res.status(500).json({error:'NVIDIA API key is not configured.'});
 try{
  const r=await fetch('https://877104f7-e885-42b9-8de8-f6e4c6303969.invocation.api.nvcf.nvidia.com/v1/audio/list_voices',{headers:{Authorization:`Bearer ${key}`}});
  const body=await r.text();if(!r.ok)return res.status(r.status).json({error:body.slice(0,600)});
  return res.status(200).json(JSON.parse(body));
 }catch{return res.status(502).json({error:'Could not load NVIDIA voice catalog.'})}
}
