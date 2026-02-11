'use client'

import { useState, useEffect, useCallback } from 'react'

// Types
interface Domain { id: string; name: string; feedbackCount: number }
interface TermLibrary { id: string; name: string; description?: string; termCount: number }
interface Term { id: string; source: string; target: string; frequency: number; type: string }
interface Feedback { id: string; sourceText: string; modelOutput: string; rating: number; isGolden: boolean; createdAt: string }

export default function Home() {
  const [activeTab, setActiveTab] = useState('translate')
  const [domains, setDomains] = useState<Domain[]>([])
  const [libraries, setLibraries] = useState<TermLibrary[]>([])
  const [selectedLibrary, setSelectedLibrary] = useState('')
  const [terms, setTerms] = useState<Term[]>([])
  const [sourceText, setSourceText] = useState('随着人工智能技术的快速发展，大模型在各个领域都取得了突破性进展。')
  const [translatedText, setTranslatedText] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('通用')
  const [isTranslating, setIsTranslating] = useState(false)
  const [matchedTerms, setMatchedTerms] = useState<{source: string; target: string}[]>([])
  const [rating, setRating] = useState(4)
  const [isGolden, setIsGolden] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [feedbackStats, setFeedbackStats] = useState({ avgRating: 0, highQualityCount: 0, totalCount: 0 })
  const [memoryStats, setMemoryStats] = useState({ whitelistCount: 0, blacklistCount: 0 })
  const [newDomain, setNewDomain] = useState('')
  const [newLibraryName, setNewLibraryName] = useState('')
  const [newTermSource, setNewTermSource] = useState('')
  const [newTermTarget, setNewTermTarget] = useState('')
  const [showAddTerm, setShowAddTerm] = useState(false)

  const fetchData = useCallback(async () => {
    await fetch('/api/init')
    const [domainsRes, librariesRes, feedbacksRes, memoryRes] = await Promise.all([
      fetch('/api/domains'),
      fetch('/api/terms'),
      fetch('/api/feedback?limit=20'),
      fetch('/api/memory')
    ])
    const [domainsData, librariesData, feedbacksData, memoryData] = await Promise.all([
      domainsRes.json(), librariesRes.json(), feedbacksRes.json(), memoryRes.json()
    ])
    if (domainsData.success) setDomains(domainsData.domains)
    if (librariesData.success) setLibraries(librariesData.libraries)
    if (feedbacksData.success) { setFeedbacks(feedbacksData.feedbacks); setFeedbackStats(feedbacksData.stats) }
    if (memoryData.success) setMemoryStats(memoryData.stats)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    if (selectedLibrary) fetch(`/api/terms?libraryId=${selectedLibrary}`).then(r => r.json()).then(d => d.success && setTerms(d.terms))
  }, [selectedLibrary])

  const handleTranslate = async () => {
    if (!sourceText.trim()) return alert('请输入文本')
    setIsTranslating(true)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText, domain: selectedDomain, libraryId: selectedLibrary || undefined })
      })
      const data = await res.json()
      if (data.success) {
        setTranslatedText(data.translation)
        setMatchedTerms(data.matchedTerms)
        alert(data.termCount > 0 ? `翻译完成，使用了 ${data.termCount} 个术语` : '翻译完成')
      } else alert(data.error)
    } finally { setIsTranslating(false) }
  }

  const handleSubmitFeedback = async () => {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceText, modelOutput: translatedText, rating, isGolden })
    })
    alert('反馈已提交')
    fetchData()
  }

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return
    await fetch('/api/domains', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newDomain }) })
    setNewDomain('')
    fetchData()
  }

  const handleDeleteDomain = async (id: string) => {
    await fetch('/api/domains', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    fetchData()
  }

  const handleCreateLibrary = async () => {
    if (!newLibraryName.trim()) return
    await fetch('/api/terms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'createLibrary', name: newLibraryName }) })
    setNewLibraryName('')
    fetchData()
  }

  const handleDeleteLibrary = async (libraryId: string) => {
    await fetch('/api/terms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteLibrary', libraryId }) })
    if (selectedLibrary === libraryId) { setSelectedLibrary(''); setTerms([]) }
    fetchData()
  }

  const handleAddTerm = async () => {
    if (!newTermSource.trim() || !newTermTarget.trim() || !selectedLibrary) return
    await fetch('/api/terms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addTerm', libraryId: selectedLibrary, source: newTermSource, target: newTermTarget }) })
    setNewTermSource(''); setNewTermTarget(''); setShowAddTerm(false)
    fetch(`/api/terms?libraryId=${selectedLibrary}`).then(r => r.json()).then(d => d.success && setTerms(d.terms))
  }

  const handleDeleteTerm = async (termId: string) => {
    await fetch('/api/terms', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deleteTerm', termId }) })
    fetch(`/api/terms?libraryId=${selectedLibrary}`).then(r => r.json()).then(d => d.success && setTerms(d.terms))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e0e0e0', padding: '16px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>🤖</div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>自主进化翻译智能体</h1>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Self-Evolving Translation Agent</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
            <span style={{ padding: '4px 8px', background: '#e0e0e0', borderRadius: '4px' }}>领域: {domains.length}</span>
            <span style={{ padding: '4px 8px', background: '#e0e0e0', borderRadius: '4px' }}>术语库: {libraries.length}</span>
            <span style={{ padding: '4px 8px', background: '#e0e0e0', borderRadius: '4px' }}>反馈: {feedbackStats.totalCount}</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['translate', 'terms', 'domains', 'monitor'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer',
              background: activeTab === tab ? '#2563eb' : '#e0e0e0', color: activeTab === tab ? 'white' : 'black'
            }}>
              {tab === 'translate' ? '🌐 翻译工作台' : tab === 'terms' ? '📚 术语库管理' : tab === 'domains' ? '⚙️ 领域管理' : '📊 系统监控'}
            </button>
          ))}
        </div>

        {activeTab === 'translate' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 8px 0' }}>源文本</h2>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px 0' }}>输入需要翻译的中文文本</p>
              <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} style={{ width: '100%', height: '200px', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '4px', resize: 'vertical' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>翻译领域</label>
                  <select value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    {domains.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>术语库</label>
                  <select value={selectedLibrary} onChange={e => setSelectedLibrary(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                    <option value="">不使用术语库</option>
                    {libraries.map(l => <option key={l.id} value={l.id}>{l.name} ({l.termCount}个术语)</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleTranslate} disabled={isTranslating || !sourceText.trim()} style={{ width: '100%', marginTop: '16px', padding: '12px', background: isTranslating ? '#93c5fd' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
                {isTranslating ? '翻译中...' : '🚀 开始翻译'}
              </button>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 8px 0' }}>翻译结果</h2>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px 0' }}>AI 生成的英文翻译</p>
              <textarea value={translatedText} onChange={e => setTranslatedText(e.target.value)} placeholder="翻译结果将显示在这里..." style={{ width: '100%', height: '200px', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '4px', resize: 'vertical' }} />
              {matchedTerms.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '14px', color: '#666' }}>使用的术语 ({matchedTerms.length})</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {matchedTerms.map((t, i) => <span key={i} style={{ padding: '4px 8px', background: '#e0e7ff', borderRadius: '4px', fontSize: '14px' }}>{t.source} → {t.target}</span>)}
                  </div>
                </div>
              )}
              {translatedText && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                  <h4 style={{ margin: '0 0 12px 0' }}>质量反馈</h4>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '14px' }}>评分: {rating} ⭐</label>
                    <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} style={{ width: '100%', marginTop: '4px' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <input type="checkbox" id="golden" checked={isGolden} onChange={e => setIsGolden(e.target.checked)} />
                    <label htmlFor="golden" style={{ fontSize: '14px' }}>标记为高质量样本</label>
                  </div>
                  <button onClick={handleSubmitFeedback} style={{ width: '100%', padding: '10px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📝 提交反馈</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 16px 0' }}>术语库列表</h2>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input value={newLibraryName} onChange={e => setNewLibraryName(e.target.value)} placeholder="新术语库名称" style={{ flex: 1, padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }} />
                <button onClick={handleCreateLibrary} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>创建</button>
              </div>
              {libraries.length === 0 ? <p style={{ color: '#666', textAlign: 'center', padding: '16px' }}>暂无术语库</p> : libraries.map(lib => (
                <div key={lib.id} onClick={() => setSelectedLibrary(lib.id)} style={{ padding: '12px', border: selectedLibrary === lib.id ? '2px solid #2563eb' : '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{lib.name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{lib.termCount} 个术语</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDeleteLibrary(lib.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                </div>
              ))}
            </div>

            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0 }}>术语列表</h2>
                  <p style={{ color: '#666', fontSize: '14px', margin: '4px 0 0 0' }}>{selectedLibrary ? `当前: ${libraries.find(l => l.id === selectedLibrary)?.name}` : '请选择术语库'}</p>
                </div>
                {selectedLibrary && <button onClick={() => setShowAddTerm(true)} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>➕ 添加术语</button>}
              </div>
              {showAddTerm && (
                <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '4px', marginBottom: '16px' }}>
                  <input value={newTermSource} onChange={e => setNewTermSource(e.target.value)} placeholder="原文（中文）" style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '8px' }} />
                  <input value={newTermTarget} onChange={e => setNewTermTarget(e.target.value)} placeholder="译文（英文）" style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleAddTerm} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>添加</button>
                    <button onClick={() => setShowAddTerm(false)} style={{ padding: '8px 16px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
                  </div>
                </div>
              )}
              {selectedLibrary ? (terms.length === 0 ? <p style={{ color: '#666', textAlign: 'center', padding: '32px' }}>暂无术语</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '2px solid #e0e0e0' }}><th style={{ textAlign: 'left', padding: '8px' }}>原文</th><th style={{ textAlign: 'left', padding: '8px' }}>译文</th><th style={{ textAlign: 'left', padding: '8px' }}>频次</th><th></th></tr></thead>
                  <tbody>{terms.map(t => <tr key={t.id} style={{ borderBottom: '1px solid #e0e0e0' }}><td style={{ padding: '8px' }}>{t.source}</td><td style={{ padding: '8px' }}>{t.target}</td><td style={{ padding: '8px' }}>{t.frequency}</td><td style={{ padding: '8px' }}><button onClick={() => handleDeleteTerm(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button></td></tr>)}</tbody>
                </table>
              )) : <p style={{ color: '#666', textAlign: 'center', padding: '32px' }}>请从左侧选择术语库</p>}
            </div>
          </div>
        )}

        {activeTab === 'domains' && (
          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 8px 0' }}>翻译领域管理</h2>
            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px 0' }}>添加或删除翻译领域（最多10个）</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="新领域名称" style={{ flex: 1, padding: '8px', border: '1px solid #e0e0e0', borderRadius: '4px' }} disabled={domains.length >= 10} />
              <button onClick={handleAddDomain} disabled={domains.length >= 10 || !newDomain.trim()} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>➕ 添加</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {domains.map(d => (
                <div key={d.id} style={{ padding: '16px', border: '1px solid #e0e0e0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{d.name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{d.feedbackCount} 条反馈</p>
                  </div>
                  {domains.length > 1 && <button onClick={() => handleDeleteDomain(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: '总反馈数', value: feedbackStats.totalCount },
                { label: '高质量样本', value: feedbackStats.highQualityCount },
                { label: '平均评分', value: `${feedbackStats.avgRating.toFixed(1)} ⭐` },
                { label: '记忆条目', value: memoryStats.whitelistCount + memoryStats.blacklistCount }
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{s.value}</div>
                  <p style={{ color: '#666', fontSize: '14px', margin: '8px 0 0 0' }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 16px 0' }}>记忆系统状态</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{memoryStats.whitelistCount}</div>
                  <p style={{ color: '#16a34a', margin: '4px 0 0 0' }}>✅ 白名单术语</p>
                </div>
                <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>{memoryStats.blacklistCount}</div>
                  <p style={{ color: '#dc2626', margin: '4px 0 0 0' }}>🚫 黑名单术语</p>
                </div>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ margin: '0 0 16px 0' }}>最近反馈</h2>
              {feedbacks.length === 0 ? <p style={{ color: '#666', textAlign: 'center', padding: '32px' }}>暂无反馈记录</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '2px solid #e0e0e0' }}><th style={{ textAlign: 'left', padding: '8px' }}>时间</th><th style={{ textAlign: 'left', padding: '8px' }}>源文本</th><th style={{ textAlign: 'left', padding: '8px' }}>评分</th><th style={{ textAlign: 'left', padding: '8px' }}>高质量</th></tr></thead>
                  <tbody>{feedbacks.slice(0, 10).map(f => <tr key={f.id} style={{ borderBottom: '1px solid #e0e0e0' }}><td style={{ padding: '8px', fontSize: '12px' }}>{new Date(f.createdAt).toLocaleString('zh-CN')}</td><td style={{ padding: '8px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.sourceText}</td><td style={{ padding: '8px' }}>{f.rating} ⭐</td><td style={{ padding: '8px' }}>{f.isGolden ? '✅' : '-'}</td></tr>)}</tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid #e0e0e0', padding: '16px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
        © 2026 自主进化翻译智能体 - 基于 AI 大模型
      </footer>
    </div>
  )
}
