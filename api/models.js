export const MODELS = [
 {id:'nvidia/nemotron-3.5-lightning-30b-a3b',name:'Nemotron 3.5 Lightning',provider:'NVIDIA NIM',env:'FEDEMIC',baseURL:'https://integrate.api.nvidia.com/v1',tier:'Free tier',keyUrl:'https://build.nvidia.com/'},
 {id:'moonshotai/kimi-k2-instruct',name:'Kimi K2 Instruct',provider:'Groq',env:'GROQ_API_KEY',baseURL:'https://api.groq.com/openai/v1',tier:'Free tier',keyUrl:'https://console.groq.com/keys'},
 {id:'llama-3.3-70b',name:'Llama 3.3 70B',provider:'Cerebras',env:'CEREBRAS_API_KEY',baseURL:'https://api.cerebras.ai/v1',tier:'Free tier',keyUrl:'https://cloud.cerebras.ai/'},
 {id:'open-mistral-7b',name:'Mistral 7B',provider:'Mistral AI',env:'MISTRAL_API_KEY',baseURL:'https://api.mistral.ai/v1',tier:'Free tier',keyUrl:'https://console.mistral.ai/'},
 {id:'deepseek-chat',name:'DeepSeek Chat',provider:'DeepSeek',env:'DEEPSEEK_API_KEY',baseURL:'https://api.deepseek.com/v1',tier:'Free access varies',keyUrl:'https://platform.deepseek.com/'},
 {id:'nvidia/nemotron-3-super-120b-a12b:free',name:'Nemotron 3 Super (Free)',provider:'OpenRouter',env:'OPENROUTER_API_KEY',baseURL:'https://openrouter.ai/api/v1',tier:'Free model',keyUrl:'https://openrouter.ai/keys'},
 {id:'deepseek-v3-0324',name:'DeepSeek V3',provider:'LLM7.io',env:'LLM7_API_KEY',baseURL:'https://api.llm7.io/v1',tier:'Free tier',keyUrl:'https://llm7.io/'},
 {id:'Qwen/Qwen3.5-27B',name:'Qwen 3.5 27B',provider:'ModelScope',env:'MODELSCOPE_API_KEY',baseURL:'https://api-inference.modelscope.cn/v1',tier:'Free tier',keyUrl:'https://modelscope.cn/'},
 {id:'meta-llama/Meta-Llama-3.1-70B-Instruct',name:'Llama 3.1 70B',provider:'Chutes.ai',env:'CHUTES_API_KEY',baseURL:'https://api.chutes.ai/v1',tier:'Community free tier',keyUrl:'https://chutes.ai/'},
 {id:'meta-llama/Meta-Llama-3.1-70B-Instruct',name:'Llama 3.1 70B',provider:'Glhf.chat',env:'GLHF_API_KEY',baseURL:'https://glhf.chat/api/openai/v1',tier:'Free model tier',keyUrl:'https://glhf.chat/'}
];
export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed.'});}
 const models=MODELS.map(({id,name,provider,env,tier,keyUrl})=>({id,name,provider,tier,keyUrl,configured:Boolean(process.env[env]||(env==='FEDEMIC'&&(process.env.fedemic||process.env.navidiakey)))}));
 return res.status(200).json({models,source:'https://github.com/open-free-llm-api/awesome-freellm-apis'});
}