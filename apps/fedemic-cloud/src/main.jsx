import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, Blocks, Check, ChevronDown,
  CircleHelp, Cloud, Code2, Command, ExternalLink, FileCode2, Folder,
  Globe2, LayoutDashboard, LifeBuoy, Menu, MoreHorizontal, Plus, Search,
  Settings2, ShieldCheck, Sparkles, WandSparkles, X, Zap
} from 'lucide-react'
import './styles.css'

const starterProjects = [
  { id: 'demo-1', name: 'Northstar Studio', slug: 'northstar-studio', type: 'visual', status: 'Published', updatedAt: Date.now() - 3600000, color: 'violet' },
  { id: 'demo-2', name: 'Atelier Commerce', slug: 'atelier-commerce', type: 'github', status: 'Draft', updatedAt: Date.now() - 86400000, color: 'blue' },
]

function readProjects() {
  try {
    const saved = localStorage.getItem('fedemic-cloud-projects')
    return saved ? JSON.parse(saved) : starterProjects
  } catch {
    return starterProjects
  }
}

function App() {
  const [projects, setProjects] = useState(readProjects)
  const [showCreate, setShowCreate] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('visual')
  const [activeNav, setActiveNav] = useState('Overview')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  const saveProjects = (next) => {
    setProjects(next)
    localStorage.setItem('fedemic-cloud-projects', JSON.stringify(next))
  }

  const visibleProjects = useMemo(() => projects.filter(project =>
    project.name.toLowerCase().includes(search.toLowerCase())
  ), [projects, search])

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const createProject = (event) => {
    event.preventDefault()
    const clean = projectName.trim()
    if (!clean) return
    const base = clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-website'
    const slug = projects.some(project => project.slug === base) ? base + '-' + Math.random().toString(36).slice(2, 6) : base
    const project = { id: crypto.randomUUID(), name: clean, slug, type: projectType, status: 'Draft', updatedAt: Date.now(), color: projectType === 'github' ? 'blue' : 'violet' }
    saveProjects([project, ...projects])
    setProjectName('')
    setProjectType('visual')
    setShowCreate(false)
    notify('Project created. Your workspace is ready.')
  }

  const deleteProject = (id) => {
    const project = projects.find(item => item.id === id)
    if (!project || !window.confirm('Delete "' + project.name + '" from this browser demo?')) return
    saveProjects(projects.filter(item => item.id !== id))
    notify('Project removed from this demo workspace.')
  }

  const navGroups = [
    { label: 'WORKSPACE', items: [{ name: 'Overview', icon: LayoutDashboard }, { name: 'My projects', icon: Folder }, { name: 'AI website builder', icon: WandSparkles, pill: 'AI' }, { name: 'Templates', icon: Blocks }] },
    { label: 'DEVELOPERS', items: [{ name: 'GitHub', icon: Code2 }, { name: 'Deployments', icon: Cloud }, { name: 'Domains', icon: Globe2 }] },
    { label: 'MANAGE', items: [{ name: 'Usage & billing', icon: Activity }, { name: 'Settings', icon: Settings2 }] },
  ]

  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (mobileNav ? 'sidebar-open' : '')}>
        <div className="brand-row">
          <div className="brand-mark"><span>f</span></div>
          <div className="brand-copy"><strong>fedemic<span>.</span></strong><small>CLOUD</small></div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button>
        </div>
        <button className="workspace-switch">
          <div className="workspace-avatar">S</div>
          <span><strong>Personal workspace</strong><small>Free plan</small></span>
          <ChevronDown size={15}/>
        </button>
        <nav className="side-nav">
          {navGroups.map(group => <div className="nav-group" key={group.label}>
            <p className="nav-label">{group.label}</p>
            {group.items.map(item => {
              const Icon = item.icon
              return <button key={item.name} className={'nav-item ' + (activeNav === item.name ? 'active' : '')} onClick={() => { setActiveNav(item.name); setMobileNav(false); if (item.name !== 'Overview' && item.name !== 'My projects') notify(item.name + ' is planned for a later phase.') }}>
                <Icon size={17}/><span>{item.name}</span>{item.pill && <em>{item.pill}</em>}
              </button>
            })}
          </div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Zap size={16}/></div>
            <strong>Make more possible</strong>
            <p>Get more hosting resources as your projects grow.</p>
            <button onClick={() => notify('Paid hosting upgrades are coming in a later phase.')}>Explore plans <ArrowUpRight size={14}/></button>
          </div>
          <button className="nav-item muted" onClick={() => notify('Help centre is coming soon.')}><LifeBuoy size={17}/>Help centre</button>
          <div className="user-row"><div className="user-avatar">S</div><span><strong>Starter account</strong><small>Demo workspace</small></span><MoreHorizontal size={18}/></div>
        </div>
      </aside>

      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={19}/></button>
            <div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>{activeNav}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="command-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." /><kbd>⌘ K</kbd></div>
            <button className="icon-button" onClick={() => notify('You are all caught up.')} aria-label="Notifications"><Bell size={18}/><i/></button>
            <button className="help-button" onClick={() => notify('Fedemic Cloud help is coming soon.')}><CircleHelp size={17}/><span>Help</span></button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="pulse-dot"/> YOUR CLOUD WORKSPACE</div><h1>Good to see you.</h1><p>Build something brilliant. We'll help you bring it online.</p></div>
            <button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={17}/> New project</button>
          </section>

          <section className="stats-grid">
            <div className="stat-card"><div className="stat-top"><span>Projects</span><div className="stat-icon purple"><Folder size={17}/></div></div><strong>{projects.length.toString().padStart(2, '0')}</strong><small><span className="stat-neutral">Your workspace</span></small></div>
            <div className="stat-card"><div className="stat-top"><span>Live websites</span><div className="stat-icon green"><Globe2 size={17}/></div></div><strong>{projects.filter(p => p.status === 'Published').length.toString().padStart(2, '0')}</strong><small><span className="stat-neutral">Ready for visitors</span></small></div>
            <div className="stat-card"><div className="stat-top"><span>Deployments</span><div className="stat-icon blue"><Cloud size={17}/></div></div><strong>—</strong><small><span className="stat-neutral">Deployment engine coming next</span></small></div>
            <div className="stat-card"><div className="stat-top"><span>Plan</span><div className="stat-icon amber"><Zap size={17}/></div></div><strong className="plan-value">Free</strong><small><span className="stat-neutral">Limited demo workspace</span></small></div>
          </section>

          <section className="launch-panel">
            <div className="launch-copy"><div className="launch-tag"><Sparkles size={13}/> YOUR NEXT BIG THING</div><h2>From idea to online.<br/><span>All in one place.</span></h2><p>Start with AI, shape every detail in the visual editor, then publish when you're ready.</p><div className="launch-actions"><button className="primary-button" onClick={() => { setProjectType('visual'); setShowCreate(true) }}><WandSparkles size={16}/> Create with AI <ArrowUpRight size={15}/></button><button className="text-button" onClick={() => { setProjectType('visual'); setShowCreate(true) }}>Start from scratch <ArrowUpRight size={14}/></button></div></div>
            <div className="launch-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="floating-window window-back"><div className="window-dots"><i/><i/><i/></div><div className="skeleton-line short"/><div className="skeleton-block"/><div className="skeleton-line"/></div><div className="floating-window window-front"><div className="mini-browser"><span/><span/><span/><b>yourbrand.com</b></div><div className="mini-hero"><div/><div/><div/></div><div className="mini-grid"><i/><i/><i/></div></div><div className="sparkle-one"><Sparkles size={20}/></div><div className="sparkle-two"><Zap size={17}/></div></div>
          </section>

          <section className="projects-section">
            <div className="section-heading"><div><h2>Your projects</h2><p>Everything you're building, in one place.</p></div><button className="subtle-button" onClick={() => setActiveNav('My projects')}>View all <ArrowUpRight size={14}/></button></div>
            <div className="project-toolbar"><div className="filter-label"><span className="filter-dot"/> All projects <span className="count">{projects.length}</span></div><button className="sort-button" onClick={() => notify('Projects are sorted by most recently updated.')}>Recently updated <ChevronDown size={14}/></button></div>
            {visibleProjects.length ? <div className="project-grid">{visibleProjects.map(project => <article className="project-card" key={project.id}>
              <div className={'project-preview ' + project.color}><div className="preview-top"><span className="preview-brand">{project.name.slice(0,1).toUpperCase()}</span><span className="preview-menu"><i/><i/><i/></span></div><div className="preview-content"><div className="preview-kicker">MADE WITH FEDEMIC</div><div className="preview-title">{project.name}</div><div className="preview-lines"><i/><i/></div><div className="preview-button"/></div><div className="preview-orb"/></div>
              <div className="project-info"><div className="project-title-row"><div><h3>{project.name}</h3><p>{project.slug}.fedemic.site</p></div><button className="icon-button project-more" onClick={() => deleteProject(project.id)} title="Delete project"><MoreHorizontal size={18}/></button></div><div className="project-meta"><span className={'status ' + project.status.toLowerCase()}><i/>{project.status}</span><span>{project.type === 'github' ? <Code2 size={13}/> : <WandSparkles size={13}/>} {project.type === 'github' ? 'GitHub import' : 'Visual builder'}</span><span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span></div><button className="open-project" onClick={() => notify('Project workspace is the next builder milestone.')}>Open project <ArrowUpRight size={14}/></button></div>
            </article>)}</div> : <div className="empty-state"><div className="empty-icon"><Folder size={22}/></div><h3>No projects found</h3><p>Try another search or create your first website.</p><button className="primary-button" onClick={() => setShowCreate(true)}><Plus size={16}/> Create project</button></div>}
          </section>

          <footer className="page-footer"><span>© 2026 Fedemic Cloud</span><span><ShieldCheck size={13}/> Built for creators and developers</span><span>Phase 1 preview</span></footer>
        </div>
      </main>

      {showCreate && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowCreate(false) }}><form className="create-modal" onSubmit={createProject}>
        <button type="button" className="modal-close icon-button" onClick={() => setShowCreate(false)} aria-label="Close"><X size={18}/></button>
        <div className="modal-icon"><Plus size={20}/></div><div className="eyebrow">NEW WORKSPACE</div><h2>Create a project</h2><p>Choose how you want to start. You can change your direction later.</p>
        <label className="field-label" htmlFor="project-name">Project name</label><input id="project-name" className="text-input" autoFocus placeholder="e.g. My awesome website" value={projectName} onChange={e => setProjectName(e.target.value)} maxLength={80} required/>
        <label className="field-label">How would you like to start?</label>
        <div className="type-options"><button type="button" className={'type-option ' + (projectType === 'visual' ? 'selected' : '')} onClick={() => setProjectType('visual')}><div><WandSparkles size={18}/></div><span><strong>Visual builder</strong><small>AI or drag-and-drop editor</small></span>{projectType === 'visual' && <Check size={16}/>}</button><button type="button" className={'type-option ' + (projectType === 'github' ? 'selected' : '')} onClick={() => setProjectType('github')}><div><FileCode2 size={18}/></div><span><strong>Import from GitHub</strong><small>Connect a code repository</small></span>{projectType === 'github' && <Check size={16}/>}</button></div>
        <div className="modal-note"><ShieldCheck size={15}/> Your projects are private to your account once authentication is connected.</div>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="primary-button" disabled={!projectName.trim()}>Create project <ArrowUpRight size={15}/></button></div>
      </form></div>}

      {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
