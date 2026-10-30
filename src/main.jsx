import React, { useEffect, useMemo, useState } from 'react'
import { InferenceClient } from '@huggingface/inference'
import { createRoot } from 'react-dom/client'
import {
  Sparkles, Image as ImageIcon, MessageSquareText, Mic2, Music2, Video,
  WandSparkles, Settings2, Menu, X, ArrowUpRight, Download, Copy, Check,
  LoaderCircle, ChevronDown, Plus, History, Zap, Send, Volume2, Play,
  ExternalLink, SlidersHorizontal, Headphones, Clapperboard, PenLine,
  LayoutDashboard, CircleHelp, Sun, Moon, KeyRound, RefreshCw, Trash2
} from 'lucide-react'
import './style.css'

const tools = [
  { id:'image', label:'Image generator', sub:'Turn ideas into images', icon:ImageIcon, tag:'POPULAR' },
  { id:'chat', label:'AI chat', sub:'Think, plan and create', icon:MessageSquareText },
  { id:'writer', label:'AI writer', sub:'Words that get noticed', icon:PenLine },
  { id:'voice', label:'Text to voice', sub:'Give your words a voice', icon:Mic2 },
  { id:'music', label:'Music studio', sub:'Make your next soundtrack', icon:Music2, tag:'BETA' },
  { id:'video', label:'Video studio', sub:'Generate cinematic AI videos', icon:Video, tag:'NEW' },
]
const examples = [
  { title:'Cinematic product shot', prompt:'Luxury perfume bottle on a black reflective surface, dramatic studio lighting, cinematic editorial photography, ultra detailed', type:'image', color:'purple' },
  { title:'Brand launch caption', prompt:'Write a bold, modern Instagram launch caption for a new streetwear brand. Include a strong hook and call to action.', type:'writer', color:'blue' },
  { title:'Dreamy R&B instrumental', prompt:'A dreamy late-night R&B instrumental, warm Rhodes piano, soft atmospheric pads, deep rounded bass, relaxed 82 BPM, no vocals', type:'music', color:'pink' },
]
const initialHistory = [
  { id:1, title:'Welcome to Fedemic', type:'system', time:'Just now', prompt:'Your creative workspace is ready.' }
]

function App() {
  const [active, setActive] = useState('home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [hfToken, setHfToken] = useState('')
  const [videoFile, setVideoFile] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [history, setHistory] = useState(initialHistory)
  const [copied, setCopied] = useState(false)
  const [voice, setVoice] = useState('alloy')
  const [chatMessages, setChatMessages] = useState([{ role:'assistant', content:'Hey! I’m Fedemic. What are we creating today?' }])
  const [chatInput, setChatInput] = useState('')
  const [dark, setDark] = useState(true)

  const current = tools.find(t => t.id === active)
  const title = active === 'home' ? 'Create something extraordinary.' : current?.label || 'Your workspace'
  const subtitle = active === 'home' ? 'Your ideas deserve more than one tool. Make it happen with Fedemic AI.' : current?.sub || 'Your creative workspace.'

  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light' }, [dark])
  const addHistory = (title, type, p) => setHistory(h => [{ id:Date.now(), title, type, prompt:p, time:'Just now' }, ...h].slice(0,20))
  const requireKey = () => {
    if (!apiKey.trim()) { setSettingsOpen(true); setError('Connect an authorized Pollinations browser key in Settings to use online AI generation.'); return false }
    return true
  }
  const generateImage = async () => {
    if (!prompt.trim() || !requireKey()) return
    setBusy(true); setError(''); setResult(null)
    try {
      const url = 'https://gen.pollinations.ai/image/' + encodeURIComponent(prompt.trim()) + '?model=black-forest-labs/flux.1-schnell&width=1024&height=1024&safe=true'
      const response = await fetch(url, { headers:{ Authorization:'Bearer ' + apiKey.trim() } })
      if (!response.ok) throw new Error('Image provider returned ' + response.status + '. Check your key, model access or quota.')
      const blob = await response.blob()
      const imageUrl = URL.createObjectURL(blob)
      setResult({ kind:'image', url:imageUrl, name:'fedemic-image-' + Date.now() + '.png' })
      addHistory('AI image', 'image', prompt)
    } catch(e) { setError(e.message || 'Could not generate image. Please try again.') }
    finally { setBusy(false) }
  }
  const generateText = async (input = prompt, mode = active) => {
    if (!input.trim() || !requireKey()) return
    setBusy(true); setError(''); setResult(null)
    const system = mode === 'writer' ? 'You are an expert creative writer and marketing copywriter. Produce polished, useful writing. Follow the user request.' : 'You are Fedemic AI, a helpful, clear and creative assistant. Give useful answers.'
    try {
      const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + apiKey.trim() },
        body:JSON.stringify({ model:'openai/gpt-5.4-nano', messages:[{role:'system',content:system},{role:'user',content:input}], temperature:0.8 })
      })
      if (!response.ok) throw new Error('Text provider returned ' + response.status + '. Check your key or quota.')
      const data = await response.json()
      const text = data.choices?.[0]?.message?.content || 'No text returned.'
      setResult({ kind:'text', text }); addHistory(mode === 'writer' ? 'AI writing' : 'AI chat', mode, input)
    } catch(e) { setError(e.message || 'Could not generate text.') }
    finally { setBusy(false) }
  }
  const generateVoice = async () => {
    if (!prompt.trim()) return
    if (!apiKey.trim()) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(prompt)
        utterance.rate = 1; utterance.pitch = 1
        window.speechSynthesis.speak(utterance)
        addHistory('Browser voice playback', 'voice', prompt)
        setResult({ kind:'voice-local', text:'Your browser is speaking the text. For an MP3 download, connect an authorized Pollinations key.' })
      } else setError('Speech synthesis is not supported in this browser.')
      return
    }
    setBusy(true); setError(''); setResult(null)
    try {
      const response = await fetch('https://gen.pollinations.ai/v1/audio/speech', {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + apiKey.trim() },
        body:JSON.stringify({ model:'openai/tts-1', input:prompt, voice, response_format:'mp3' })
      })
      if (!response.ok) throw new Error('Voice provider returned ' + response.status + '. Try browser voice or check your key.')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setResult({ kind:'audio', url, name:'fedemic-voice-' + Date.now() + '.mp3' })
      addHistory('Text to voice', 'voice', prompt)
    } catch(e) { setError(e.message || 'Voice generation failed.') }
    finally { setBusy(false) }
  }
  const generateVideo = async ({ prompt: videoPrompt, imageFile, duration = 5, aspect = '16:9' }) => {
    if (!videoPrompt.trim()) { setError('Write a prompt describing the video you want.'); return }
    if (!hfToken.trim()) { setSettingsOpen(true); setError('Connect a Hugging Face token in Settings to generate video.'); return }
    setBusy(true); setError(''); setResult(null)
    try {
      const client = new InferenceClient(hfToken.trim())
      const model = 'Wan-AI/Wan2.2-TI2V-5B'
      let blob
      if (imageFile) {
        blob = await client.imageToVideo({ inputs: imageFile, model, provider: 'fal-ai', parameters: { prompt: videoPrompt.trim(), num_frames: duration <= 5 ? 81 : 121, guidance_scale: 5 } })
      } else {
        blob = await client.textToVideo({
          inputs: videoPrompt.trim(), model, provider: 'fal-ai',
          parameters: { num_frames: duration <= 5 ? 81 : 121, guidance_scale: 5 }
        })
      }
      if (!(blob instanceof Blob) || !blob.size) throw new Error('The video provider returned an empty file. Try a shorter prompt or another attempt.')
      const videoUrl = URL.createObjectURL(blob)
      setResult({ kind:'video', url:videoUrl, name:'fedemic-video-' + Date.now() + '.mp4' })
      addHistory(imageFile ? 'AI image-to-video' : 'AI text-to-video', 'video', videoPrompt)
    } catch(e) {
      const message = e?.message || 'Video generation failed.'
      if (/402|payment|credit|billing/i.test(message)) setError('Your Hugging Face free credits may be exhausted, or this model requires provider credits. Check your Hugging Face billing and inference-provider settings. No paid request is made by Fedemic itself.')
      else if (/401|403|token|auth/i.test(message)) setError('Hugging Face rejected the token. Create a token with Inference Providers permission and try again.')
      else setError(message + ' Check that Wan 2.2 is available through your selected provider.')
    } finally { setBusy(false) }
  }
  const generateMusic = async () => {
    if (!prompt.trim() || !requireKey()) return
    setBusy(true); setError(''); setResult(null)
    try {
      const url = 'https://gen.pollinations.ai/audio/' + encodeURIComponent(prompt.trim()) + '?model=elevenlabs/music-v2.5'
      const response = await fetch(url, { headers:{ Authorization:'Bearer ' + apiKey.trim() } })
      if (!response.ok) throw new Error('Music provider returned ' + response.status + '. Check your key, audio model access or quota.')
      const blob = await response.blob()
      const audioUrl = URL.createObjectURL(blob)
      setResult({ kind:'audio', url:audioUrl, name:'fedemic-music-' + Date.now() + '.mp3' })
      addHistory('AI music track', 'music', prompt)
    } catch(e) { setError(e.message || 'Music generation failed.') }
    finally { setBusy(false) }
  }
  const sendChat = async () => {
    const value = chatInput.trim()
    if (!value || busy) return
    setChatMessages(m => [...m, {role:'user',content:value}]); setChatInput('')
    if (!apiKey.trim()) { setSettingsOpen(true); setError('Connect your authorized AI key in Settings to chat.'); return }
    setBusy(true); setError('')
    try {
      const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method:'POST', headers:{'Content-Type':'application/json',Authorization:'Bearer '+apiKey.trim()},
        body:JSON.stringify({model:'openai/gpt-5.4-nano',messages:[...chatMessages,{role:'user',content:value}],temperature:0.7})
      })
      if (!response.ok) throw new Error('Chat provider returned ' + response.status)
      const data = await response.json()
      setChatMessages(m => [...m,{role:'assistant',content:data.choices?.[0]?.message?.content || 'No response.'}])
    } catch(e) { setError(e.message) }
    finally { setBusy(false) }
  }
  const copyPrompt = async (value) => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(()=>setCopied(false),1400) }
  const downloadResult = () => {
    if (!result?.url) return
    const a = document.createElement('a'); a.href=result.url; a.download=result.name || 'fedemic-download'; a.click()
  }
  const selectTool = id => { setActive(id); setPrompt(''); setResult(null); setError(''); setMobileOpen(false) }

  return <div className="app-shell">
    <aside className={'sidebar ' + (mobileOpen ? 'mobile-open' : '')}>
      <div className="brand"><div className="brand-mark"><Sparkles size={21}/></div><span>fedemic<span className="brand-ai">.ai</span></span><button className="mobile-close icon-btn" onClick={()=>setMobileOpen(false)}><X size={18}/></button></div>
      <button className={'nav-item '+(active==='home'?'selected':'')} onClick={()=>selectTool('home')}><LayoutDashboard size={18}/><span>Overview</span></button>
      <div className="nav-label">CREATE</div>
      {tools.map(t=><button key={t.id} className={'nav-item '+(active===t.id?'selected':'')} onClick={()=>selectTool(t.id)}><t.icon size={18}/><span>{t.label}</span>{t.tag && <small className="nav-tag">{t.tag}</small>}</button>)}
      <div className="sidebar-spacer"/>
      <div className="sidebar-promo"><div className="promo-icon"><Zap size={17}/></div><strong>Your ideas, upgraded.</strong><p>One workspace for your next big thing.</p><button onClick={()=>setSettingsOpen(true)}>Connect AI provider <ArrowUpRight size={14}/></button></div>
      <button className="nav-item" onClick={()=>setSettingsOpen(true)}><Settings2 size={18}/><span>Settings</span></button>
      <div className="profile"><div className="avatar">F</div><div><strong>Creator workspace</strong><span>Free access</span></div><button className="icon-btn" onClick={()=>setSettingsOpen(true)}><Settings2 size={16}/></button></div>
    </aside>
    {mobileOpen && <div className="mobile-backdrop" onClick={()=>setMobileOpen(false)}/>}
    <main className="main">
      <header className="topbar"><div className="top-left"><button className="mobile-menu icon-btn" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <b>{active==='home'?'Overview':current?.label}</b></div></div><div className="top-actions"><div className={'provider-pill '+(apiKey?'connected':'')}><span/>{apiKey?'Provider connected':'Provider not connected'}</div><button className="icon-btn" title="Toggle theme" onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><button className="settings-btn" onClick={()=>setSettingsOpen(true)}><Settings2 size={16}/> Settings</button></div></header>
      <div className="page">
        {active==='home' ? <Home title={title} subtitle={subtitle} onSelect={selectTool} history={history} examples={examples}/> :
        active==='music' ? <MusicStudio prompt={prompt} setPrompt={setPrompt} onCopy={copyPrompt} copied={copied} result={result} busy={busy} error={error} onMusic={generateMusic} onDownload={downloadResult}/> :
        active==='video' ? <VideoStudio onGenerate={generateVideo} busy={busy} result={result} error={error} onDownload={downloadResult} videoFile={videoFile} setVideoFile={setVideoFile}/> :
        active==='chat' ? <ChatStudio messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={sendChat} busy={busy}/> :
        <Studio tool={current} title={title} subtitle={subtitle} prompt={prompt} setPrompt={setPrompt} busy={busy} result={result} error={error} onImage={generateImage} onText={()=>generateText()} onVoice={generateVoice} onDownload={downloadResult} onCopy={copyPrompt} copied={copied} voice={voice} setVoice={setVoice}/>}
      </div>
      <footer className="footer"><span>© 2026 FEDEMIC AI</span><span>Made for the creators <Sparkles size={12}/></span><button onClick={()=>setSettingsOpen(true)}><CircleHelp size={13}/> Help & provider setup</button></footer>
    </main>
    {settingsOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSettingsOpen(false)}}><div className="modal"><div className="modal-head"><div><span className="eyebrow">WORKSPACE SETTINGS</span><h2>Connect your AI</h2></div><button className="icon-btn" onClick={()=>setSettingsOpen(false)}><X size={19}/></button></div><p className="modal-copy">Fedemic uses Pollinations for image, text and audio, and Hugging Face Inference Providers for video. Add your own authorized tokens. Provider usage limits and charges may apply.</p><label className="field-label">Pollinations browser key</label><div className="key-field"><KeyRound size={17}/><input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="Paste an authorized key"/></div><div className="security-note"><KeyRound size={15}/><span>Use only a key intended for browser use, with a small budget. Only use personal tokens you are comfortable using in this browser. They stay in this tab and are not saved to GitHub. For a public multi-user launch, move provider calls behind a secure backend.</span></div><a className="provider-link" href="https://enter.pollinations.ai/keys" target="_blank" rel="noreferrer">Pollinations key dashboard <ExternalLink size={14}/></a><label className="field-label hf-label">Hugging Face token (video generation)</label><div className="key-field"><KeyRound size={17}/><input type="password" value={hfToken} onChange={e=>setHfToken(e.target.value)} placeholder="hf_..."/></div><a className="provider-link" href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer">Create a token with Inference Providers permission <ExternalLink size={14}/></a><div className="modal-actions"><button className="btn-secondary" onClick={()=>{setApiKey('');setHfToken('');setSettingsOpen(false)}}>Disconnect</button><button className="btn-primary" onClick={()=>setSettingsOpen(false)}>Save for this tab <Check size={15}/></button></div></div></div>}
  </div>
}

function Home({title,subtitle,onSelect,history,examples}) {
  return <><section className="hero"><div className="hero-glow"/><div className="eyebrow"><span className="eyebrow-dot"/> YOUR CREATIVE AI WORKSPACE</div><h1>{title.split(' ').slice(0,-1).join(' ')} <span>{title.split(' ').slice(-1)}</span></h1><p>{subtitle}</p><div className="hero-actions"><button className="btn-primary large" onClick={()=>onSelect('image')}><Sparkles size={17}/> Start creating <ArrowUpRight size={16}/></button><span className="hero-caption"><Zap size={14}/> Images · Video · Voice · Music · Words</span></div><div className="hero-orb orb-one"/><div className="hero-orb orb-two"/><div className="hero-grid"/></section>
    <section className="section"><div className="section-heading"><div><span className="eyebrow">YOUR TOOLKIT</span><h2>What will you create?</h2><p>Everything you need to turn a spark into something real.</p></div><span className="tool-count">06 TOOLS</span></div><div className="tool-grid">{tools.map((t,i)=><button key={t.id} className={'tool-card card-'+t.id} onClick={()=>onSelect(t.id)}><div className="tool-card-top"><div className="tool-icon"><t.icon size={21}/></div>{t.tag&&<span className="tool-tag">{t.tag}</span>}<ArrowUpRight className="tool-arrow" size={17}/></div><strong>{t.label}</strong><span>{t.sub}</span></button>)}</div></section>
    <section className="section"><div className="section-heading"><div><span className="eyebrow">GET INSPIRED</span><h2>Start with a spark.</h2><p>Try a prompt and make it your own.</p></div></div><div className="inspiration-grid">{examples.map((e,i)=><button className={'inspiration insp-'+e.color} key={e.title} onClick={()=>onSelect(e.type)}><span className="insp-number">0{i+1}</span><span className="insp-type">{e.type.toUpperCase()} PROMPT</span><strong>{e.title}</strong><span className="insp-prompt">{e.prompt}</span><span className="insp-cta">Use this idea <ArrowUpRight size={14}/></span></button>)}</div></section>
    <section className="section recent-section"><div className="section-heading"><div><span className="eyebrow">YOUR ACTIVITY</span><h2>Recently created</h2></div><History size={18} className="muted-icon"/></div><div className="history-list">{history.slice(0,4).map(h=><div className="history-row" key={h.id}><div className="history-icon"><Sparkles size={16}/></div><div className="history-info"><strong>{h.title}</strong><span>{h.prompt}</span></div><time>{h.time}</time></div>)}</div></section>
  </>
}

function Studio({tool,title,subtitle,prompt,setPrompt,busy,result,error,onImage,onText,onVoice,onDownload,onCopy,copied,voice,setVoice}) {
  const isImage=tool?.id==='image', isVoice=tool?.id==='voice', isWriter=tool?.id==='writer'
  const placeholder=isImage?'A futuristic city floating above the clouds at golden hour, cinematic lighting...':isVoice?'Paste or write the words you want to turn into speech...':'Write a detailed prompt. Be as creative as you like...'
  const submit=()=>isImage?onImage():isVoice?onVoice():onText()
  return <><div className="studio-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> FEDEMIC STUDIO</div><h1>{title}</h1><p>{subtitle}</p></div><span className="studio-chip"><Sparkles size={13}/> AI POWERED</span></div>
    <div className="studio-layout"><section className="control-panel"><div className="panel-title"><div><strong>{isImage?'Describe your image':isVoice?'Your script':'What should we create?'}</strong><span>{isImage?'Be descriptive for the best results':isVoice?'Write naturally. Add punctuation for better delivery':'Give the AI a clear direction'}</span></div><WandSparkles size={19}/></div><textarea className="prompt-input" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder={placeholder} rows={7}/><div className="prompt-meta"><span>{prompt.length} characters</span><button onClick={()=>setPrompt('')}><Trash2 size={13}/> Clear</button></div>
      {isVoice&&<div className="option-row"><label>Voice style</label><select value={voice} onChange={e=>setVoice(e.target.value)}><option value="alloy">Alloy — Neutral</option><option value="nova">Nova — Bright</option><option value="shimmer">Shimmer — Warm</option><option value="echo">Echo — Deep</option><option value="onyx">Onyx — Rich</option></select></div>}
      {isImage&&<div className="option-row"><label>Image model</label><span className="model-chip">Flux Schnell <span>FAST</span></span></div>}
      <button className="btn-primary generate-btn" onClick={submit} disabled={busy||!prompt.trim()}>{busy?<><LoaderCircle className="spin" size={17}/> Creating...</>:<><Sparkles size={17}/> {isImage?'Generate image':isVoice?'Generate voice':'Generate with AI'} <ArrowUpRight size={16}/></>}</button>
      <p className="fine-print"><Zap size={12}/> Provider usage or quotas may apply.</p>
    </section><section className="output-panel"><div className="output-head"><strong>Your creation</strong><span>{result?'READY':'OUTPUT PREVIEW'}</span></div><div className="output-content">{busy?<div className="loading-state"><div className="loading-orb"><Sparkles size={24}/></div><strong>Creating your masterpiece</strong><span>This can take a little moment...</span><div className="loading-bar"><i/></div></div>:error?<div className="empty-state error-state"><div className="empty-icon"><CircleHelp size={24}/></div><strong>Something needs attention</strong><p>{error}</p></div>:result?.kind==='image'?<div className="result-image-wrap"><img src={result.url} alt="AI generated result"/><button className="download-float" onClick={onDownload}><Download size={16}/> Download</button></div>:result?.kind==='text'?<div className="text-result"><div className="result-label"><Sparkles size={14}/> GENERATED TEXT</div><p>{result.text}</p><button className="btn-secondary" onClick={()=>onCopy(result.text)}>{copied?<Check size={14}/>:<Copy size={14}/>} {copied?'Copied':'Copy text'}</button></div>:result?.kind==='audio'?<div className="audio-result"><div className="audio-art"><Headphones size={35}/></div><strong>Your voice is ready</strong><audio controls src={result.url}/><button className="btn-primary" onClick={onDownload}><Download size={15}/> Download MP3</button></div>:result?.kind==='voice-local'?<div className="audio-result"><div className="audio-art"><Volume2 size={35}/></div><strong>Browser voice playback</strong><p>{result.text}</p><button className="btn-secondary" onClick={()=>window.speechSynthesis?.cancel()}>Stop speaking</button></div>:<div className="empty-state"><div className="empty-art"><div className="art-circle c1"/><div className="art-circle c2"/><div className="art-spark"><Sparkles size={27}/></div></div><strong>Your next creation starts here</strong><p>Enter a prompt and hit generate. Your result will appear in this space.</p><span className="empty-tip"><Zap size={13}/> Tip: Specific prompts create better results.</span></div>}</div></section></div>
  </>
}

function MusicStudio({prompt,setPrompt,onCopy,copied,result,busy,error,onMusic,onDownload}) {
  const examples=['A chilled lo-fi hip hop beat with dusty drums, warm vinyl crackle and mellow electric piano','An epic cinematic orchestral soundtrack with rising strings, huge drums and a heroic brass melody','A soulful Afro-house groove with warm percussion, deep bass, uplifting synths and sunset energy']
  return <><div className="studio-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> FEDEMIC MUSIC LAB</div><h1>Make some noise.</h1><p>Describe a feeling, a genre or a whole new sound.</p></div><span className="studio-chip beta"><Music2 size={13}/> MUSIC STUDIO</span></div><div className="music-hero"><div className="music-visual"><div className="wave-bars">{Array.from({length:35},(_,i)=><i key={i} style={{'--i':i}}/>)}</div><div className="music-disc"><div/></div><div className="music-orbit"/></div><div className="music-copy"><span className="eyebrow">YOUR SOUND STARTS HERE</span><h2>Turn a thought<br/>into a <span>soundtrack.</span></h2><p>Generate original music from a text description. Choose a genre, mood, instruments and energy to shape your track.</p><span className="music-model-tag">ELEVEN MUSIC · MUSIC V2.5</span></div></div><div className="music-prompt-panel"><div className="panel-title"><div><strong>Describe your track</strong><span>Include genre, mood, instruments, tempo and vocals</span></div><Music2 size={19}/></div><textarea className="prompt-input" rows={4} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="A soulful Afro-house track with deep bass, warm percussion, sunset energy..."/><div className="music-actions"><button className="btn-secondary" onClick={()=>onCopy(prompt||examples[0])}><Copy size={14}/>{copied?'Copied':'Copy prompt'}</button><button className="btn-primary" disabled={busy||!prompt.trim()} onClick={onMusic}>{busy?<><LoaderCircle className="spin" size={15}/> Creating track...</>:<><Music2 size={15}/> Generate music <ArrowUpRight size={15}/></>}</button></div>{error&&<p className="music-error">{error}</p>}{busy&&<div className="music-progress"><i/></div>}{result?.kind==='audio'&&<div className="music-output"><div className="music-output-icon"><Headphones size={21}/></div><div><strong>Your track is ready</strong><span>Generated audio · MP3</span></div><audio controls src={result.url}/><button className="btn-secondary" onClick={onDownload}><Download size={14}/> Download</button></div>}</div><div className="section music-examples"><div className="section-heading"><div><span className="eyebrow">PROMPT STARTERS</span><h2>Find your sound.</h2></div></div><div className="example-list">{examples.map((e,i)=><button key={e} onClick={()=>setPrompt(e)}><span>0{i+1}</span><p>{e}</p><Plus size={16}/></button>)}</div></div><p className="music-disclaimer">Music generation uses the connected provider and may consume usage credits. Model availability and pricing can change.</p></>
}
function VideoStudio({onGenerate,busy,result,error,onDownload,videoFile,setVideoFile}) {
  const [videoPrompt,setVideoPrompt] = useState('')
  const [duration,setDuration] = useState(5)
  const [mode,setMode] = useState('text')
  const [localError,setLocalError] = useState('')
  const submit = () => {
    setLocalError('')
    if (mode === 'image' && !videoFile) { setLocalError('Choose an image to animate first.'); return }
    onGenerate({prompt:videoPrompt,imageFile:mode === 'image' ? videoFile : null,duration})
  }
  return <><div className="studio-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> FEDEMIC MOTION LAB</div><h1>Bring your ideas to life.</h1><p>Generate short AI videos from a text prompt or animate an image with Wan 2.2.</p></div><span className="studio-chip"><Video size={13}/> TEXT TO VIDEO</span></div>
    <div className="video-layout"><section className="control-panel video-controls"><div className="panel-title"><div><strong>Create your video</strong><span>Be clear about the subject, action, camera and atmosphere</span></div><Clapperboard size={19}/></div>
      <div className="video-mode"><button className={mode==='text'?'active':''} onClick={()=>setMode('text')}>Text to video</button><button className={mode==='image'?'active':''} onClick={()=>setMode('image')}>Image to video</button></div>
      {mode==='image'&&<label className="video-upload"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];if(f&&f.size>10*1024*1024){setLocalError('Please choose an image smaller than 10 MB.');e.target.value='';return}setLocalError('');setVideoFile(f||null)}}/><span><ImageIcon size={20}/><strong>{videoFile?.name || 'Choose an image to animate'}</strong><small>PNG, JPG or WebP · keep files under 10 MB</small></span></label>}
      <textarea className="prompt-input" rows={6} value={videoPrompt} onChange={e=>setVideoPrompt(e.target.value)} placeholder="A cinematic shot of a futuristic sports car driving through a neon-lit Tokyo street at night, rain reflecting the lights, smooth tracking camera, realistic motion..."/>
      <div className="video-options"><label>Clip length<select value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value={5}>About 5 seconds</option><option value={8}>About 8 seconds</option></select></label><div className="video-format-note"><span>OUTPUT</span><strong>Model default · MP4</strong></div></div>
      <button className="btn-primary generate-btn" onClick={submit} disabled={busy||!videoPrompt.trim()}>{busy?<><LoaderCircle className="spin" size={17}/> Generating video...</>:<><Video size={17}/> Generate video <ArrowUpRight size={16}/></>}</button>
      <p className="fine-print"><Zap size={12}/> Requires your Hugging Face token. Free credits are limited; provider billing may apply.</p>
      {(localError||error)&&<p className="video-error">{localError||error}</p>}
    </section><section className="output-panel video-output-panel"><div className="output-head"><strong>Your video</strong><span>{result?.kind==='video'?'READY':'VIDEO PREVIEW'}</span></div><div className="output-content">{busy?<div className="loading-state"><div className="loading-orb"><Video size={24}/></div><strong>Rendering your video</strong><span>Video generation can take a few minutes. Keep this tab open.</span><div className="loading-bar"><i/></div></div>:result?.kind==='video'?<div className="generated-video"><video controls playsInline src={result.url}/><button className="btn-primary" onClick={onDownload}><Download size={15}/> Download MP4</button></div>:<div className="empty-state"><div className="coming-art"><Clapperboard size={36}/><Sparkles size={17}/></div><strong>Your next video starts here</strong><p>Choose text-to-video or image-to-video, describe the motion, then generate.</p><span className="empty-tip"><Zap size={13}/> Tip: Describe camera movement and subject action.</span></div>}</div></section></div>
    <section className="section video-tips"><div className="section-heading"><div><span className="eyebrow">PROMPT TIPS</span><h2>Get better motion.</h2></div></div><div className="video-tip-grid"><div><strong>01 · Subject</strong><p>Describe who or what is in the scene, including details that should stay consistent.</p></div><div><strong>02 · Action</strong><p>Use clear movement: walking, turning, flowing fabric, drifting smoke or driving.</p></div><div><strong>03 · Camera</strong><p>Try a slow dolly, tracking shot, orbit, close-up or aerial reveal.</p></div></div></section>
  </>
}

function ChatStudio({messages,input,setInput,onSend,busy}) {
  return <><div className="studio-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> FEDEMIC ASSISTANT</div><h1>Let's think bigger.</h1><p>Your creative partner for questions, ideas and problem solving.</p></div><span className="studio-chip"><Sparkles size={13}/> AI CHAT</span></div><div className="chat-panel"><div className="chat-top"><div className="chat-avatar"><Sparkles size={18}/></div><div><strong>Fedemic Assistant</strong><span><i/> Ready to help</span></div><button className="icon-btn" onClick={()=>window.location.reload()} title="New chat"><Plus size={18}/></button></div><div className="chat-messages">{messages.map((m,i)=><div key={i} className={'chat-message '+m.role}><div className="message-avatar">{m.role==='assistant'?<Sparkles size={14}/>: 'Y'}</div><div className="message-bubble">{m.content}</div></div>)}{busy&&<div className="chat-message assistant"><div className="message-avatar"><Sparkles size={14}/></div><div className="message-bubble typing"><i/><i/><i/></div></div>}</div><div className="chat-compose"><textarea rows={1} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();onSend()}}} placeholder="Ask anything or share an idea..."/><button className="send-btn" onClick={onSend} disabled={busy||!input.trim()}><Send size={17}/></button></div><span className="chat-hint">Enter to send · Shift + Enter for a new line</span></div></>
}

createRoot(document.getElementById('root')).render(<App />)
