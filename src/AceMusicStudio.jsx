import React, { useEffect, useRef, useState } from 'react';
import { AudioLines, Download, LoaderCircle, Music2, PenLine, Play, Sparkles, WandSparkles } from 'lucide-react';
import './ace-music-studio.css';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export default function AceMusicStudio({ requestText }) {
  const [style, setStyle] = useState('Amapiano, warm log drums, deep rolling bass, soulful piano chords, bright percussion, uplifting South African club energy');
  const [lyrics, setLyrics] = useState('');
  const [duration, setDuration] = useState(120);
  const [language, setLanguage] = useState('en');
  const [instrumental, setInstrumental] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [trackInfo, setTrackInfo] = useState(null);
  const [writing, setWriting] = useState(false);
  const activeRun = useRef(false);

  useEffect(() => () => { activeRun.current = false; }, []);

  const writeLyrics = async () => {
    setWriting(true);
    setError('');
    try {
      const text = await requestText(
        'Write original, singable song lyrics for this direction: ' + style + '. Use [Verse 1], [Chorus], [Verse 2], [Bridge] and [Outro] labels. Keep the chorus memorable. Avoid imitating existing artists or songs.',
        'You are a professional songwriter. Create original lyrics only.'
      );
      setLyrics(text);
      setInstrumental(false);
    } catch (e) {
      setError(e.message || 'Could not write lyrics.');
    } finally {
      setWriting(false);
    }
  };

  const generate = async () => {
    if (!style.trim() || busy) return;
    setBusy(true);
    activeRun.current = true;
    setError('');
    setAudioUrl('');
    setTrackInfo(null);
    setStage('Sending your track to ACE-Step…');
    try {
      const create = await fetch('/api/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', prompt: style, lyrics, duration, instrumental, language })
      });
      const created = await create.json().catch(() => ({}));
      if (!create.ok) throw new Error(created.error || 'Could not start ACE-Step generation.');
      const taskId = created.taskId;
      if (!taskId) throw new Error('ACE-Step returned no task ID.');

      let completed = false;
      for (let attempt = 0; attempt < 150 && activeRun.current; attempt += 1) {
        setStage(attempt < 2 ? 'Preparing the music models…' : 'Composing your track…');
        await sleep(4000);
        const response = await fetch('/api/music', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', taskId })
        });
        const statusData = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(statusData.error || 'Could not check music generation status.');
        if (statusData.status === 2) throw new Error(statusData.error || 'ACE-Step could not generate this track. Try a shorter prompt or a different style.');
        if (statusData.status === 1 && statusData.audioPath) {
          setStage('Preparing your audio download…');
          const audioResponse = await fetch('/api/music?action=audio&path=' + encodeURIComponent(statusData.audioPath));
          if (!audioResponse.ok) {
            const details = await audioResponse.json().catch(() => ({}));
            throw new Error(details.error || 'Your track was generated, but the audio download failed.');
          }
          const blob = await audioResponse.blob();
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          setTrackInfo({ prompt: statusData.prompt || style, lyrics: statusData.lyrics || lyrics, metas: statusData.metas || null });
          setStage('Your track is ready');
          completed = true;
          break;
        }
      }
      if (!completed && activeRun.current) throw new Error('This generation is taking longer than expected. Please try again; the server may still be processing your task.');
    } catch (e) {
      setError(e.message || 'Music generation failed.');
      setStage('');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = 'fedemic-original-track.mp3';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return <div className="ace-music-page">
    <div className="ace-music-heading">
      <div><div className="ace-music-eyebrow"><Sparkles size={13}/> FEDEMIC / ACE-STEP 1.5</div><h1>Make a complete song.</h1><p>Turn a music direction and your lyrics into a full generated track with vocals or an instrumental.</p></div>
      <span className="ace-music-model"><AudioLines size={15}/> ACE-STEP 1.5</span>
    </div>

    <div className="ace-music-layout">
      <section className="ace-music-panel">
        <div className="ace-panel-title"><div><strong>Music direction</strong><span>Describe the sound, mood, genre and instruments</span></div><Music2 size={19}/></div>
        <textarea className="ace-style-input" value={style} onChange={e => setStyle(e.target.value)} rows={4} maxLength={4000} placeholder="Describe your song…"/>
        <div className="ace-quick-styles">
          {['Amapiano with soulful vocals','Afrobeat summer anthem','Dark trap instrumental','Cinematic orchestral score'].map(item => <button key={item} onClick={() => setStyle(item)}>{item}</button>)}
        </div>

        <div className="ace-lyrics-head"><div><strong>Lyrics</strong><span>{instrumental ? 'Instrumental mode is enabled' : 'Add your own lyrics or write them with Fedemic'}</span></div><button className="ace-lyrics-ai" disabled={writing || busy} onClick={writeLyrics}>{writing ? <LoaderCircle size={14} className="ace-spin"/> : <WandSparkles size={14}/>} {writing ? 'Writing…' : 'Write lyrics'}</button></div>
        <textarea className="ace-lyrics-input" value={lyrics} onChange={e => setLyrics(e.target.value)} rows={9} disabled={instrumental} placeholder={'[Verse 1]\nWrite your lyrics here…\n\n[Chorus]\nYour hook goes here…'}/>
        <div className="ace-music-options">
          <label>Track length<select value={duration} onChange={e => setDuration(Number(e.target.value))}><option value={60}>1 minute</option><option value={90}>1 minute 30 seconds</option><option value={120}>2 minutes</option><option value={180}>3 minutes</option><option value={240}>4 minutes</option></select></label>
          <label>Vocal language<select value={language} onChange={e => setLanguage(e.target.value)}><option value="en">English</option><option value="zh">Chinese</option><option value="ja">Japanese</option><option value="ko">Korean</option><option value="es">Spanish</option><option value="fr">French</option><option value="pt">Portuguese</option></select></label>
        </div>
        <label className="ace-instrumental-toggle"><input type="checkbox" checked={instrumental} onChange={e => setInstrumental(e.target.checked)}/> Generate instrumental only (no lyrics)</label>
        <button className="ace-generate-button" disabled={busy || !style.trim()} onClick={generate}>{busy ? <><LoaderCircle size={17} className="ace-spin"/> Generating your track…</> : <><Music2 size={17}/> Generate full song <Play size={15}/></>}</button>
        {busy && <div className="ace-generation-status"><span className="ace-status-dot"/>{stage}<div className="ace-status-track"><i/></div></div>}
        {error && <p className="ace-music-error">{error}</p>}
        <p className="ace-music-footnote">ACE-Step runs on a separate GPU server. Generation is available when the ACE-Step API URL is configured for this deployment.</p>
      </section>

      <section className="ace-music-result">
        <div className="ace-panel-title"><div><strong>Your generated track</strong><span>Original music created by ACE-Step 1.5</span></div><AudioLines size={19}/></div>
        {audioUrl ? <div className="ace-track-ready">
          <div className="ace-album-art"><AudioLines size={42}/><span>FEDEMIC ORIGINAL</span></div>
          <strong>Track generated successfully</strong>
          <p>{trackInfo?.prompt || style}</p>
          <audio controls src={audioUrl}/>
          {trackInfo?.metas && <div className="ace-track-meta">{trackInfo.metas.bpm ? <span>{trackInfo.metas.bpm} BPM</span> : null}{trackInfo.metas.genres ? <span>{trackInfo.metas.genres}</span> : null}{trackInfo.metas.duration ? <span>{trackInfo.metas.duration}s</span> : null}</div>}
          <button className="ace-download-button" onClick={download}><Download size={16}/> Download MP3</button>
        </div> : <div className="ace-music-empty"><div><Music2 size={30}/></div><strong>Your song will appear here</strong><p>Choose a genre, add lyrics and generate. You can listen to the finished track and download it.</p></div>}
      </section>
    </div>
  </div>;
}
