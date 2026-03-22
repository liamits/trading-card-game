import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import './Admin.css'

const ReactQuill = lazy(() =>
  import('react-quill').then(m => {
    import('react-quill/dist/quill.snow.css')
    return m
  })
)

const API_ARTICLES = 'http://localhost:5000/api/articles'
const API_ADMIN_ARTICLES = 'http://localhost:5000/api/admin/articles'
const CATEGORIES_DEFAULT = ['TIER LIST', 'TOP DECKS', 'FARMING & EVENTS', 'LEAKS & UPDATES', 'GUIDES']
const COLORS = ['#8ab4f8', '#c58af9', '#ff77c6', '#51cf66', '#ffd43b']
const IMAGES = [
  '/image/yamiyugi_pfp.webp', '/image/yugimuto_pfp.webp', '/image/setokaiba_pfp.webp',
  '/image/joey_pfp.webp', '/image/mai_pfp.webp', '/image/pegasus_pfp.webp',
  '/image/bakura_pfp.webp', '/image/marik_pfp.webp', '/image/ishuzu_pfp.webp',
]

const emptyArticle = {
  title: '', category: 'TIER LIST', desc: '', content: '',
  image: '', author: 'Admin', published: true, color: '#8ab4f8'
}

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'align',
  'link', 'image'
]

export default function Admin() {
  const navigate = useNavigate()
  const [page, setPage] = useState('articles') // 'articles' | 'categories' | 'settings'
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const token = localStorage.getItem('admin_token')
  const username = localStorage.getItem('admin_user') || 'admin'
  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  const quillRef = useRef(null)

  // Image upload handler for Quill toolbar - called via modules.toolbar.handlers
  const imageHandler = useRef(null)
  imageHandler.current = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files[0]
      if (!file) return
      const fd = new FormData()
      fd.append('image', file)
      try {
        const res = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        })
        const data = await res.json()
        if (data.url) {
          const quill = quillRef.current?.getEditor()
          if (quill) {
            const range = quill.getSelection(true)
            quill.insertEmbed(range.index, 'image', `http://localhost:5000${data.url}`)
          }
        }
      } catch { setError('Image upload failed') }
    }
    input.click()
  }

  const quillModulesRef = useRef({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: () => imageHandler.current?.()
      }
    }
  })

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/login')
  }

  // Article form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyArticle)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Bulk selection
  const [selected, setSelected] = useState(new Set())
  const toggleSelect = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const toggleSelectAll = () => {
    if (selected.size === paginated.length && paginated.length > 0) setSelected(new Set())
    else setSelected(new Set(paginated.map(a => a._id)))
  }
  const clearSelected = () => setSelected(new Set())

  const handleBulkPublish = async (publish) => {
    const ids = [...selected]
    await Promise.all(ids.map(id => {
      const a = articles.find(x => x._id === id)
      return fetch(`${API_ARTICLES}/${id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify({ ...a, published: publish }) })
    }))
    await fetchArticles()
    clearSelected()
    showToast(publish ? `✅ Published ${ids.length} article(s)` : `🔒 Hidden ${ids.length} article(s)`)
  }

  const handleBulkDelete = async () => {
    const ids = [...selected]
    await Promise.all(ids.map(id => fetch(`${API_ARTICLES}/${id}`, { method: 'DELETE', headers: authHeaders })))
    await fetchArticles()
    clearSelected()
    setDeleteConfirm(null)
    showToast(`🗑️ Deleted ${ids.length} article(s)`)
  }

  // Filters
  const [filterTitle, setFilterTitle] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all') // 'all' | 'published' | 'hidden'
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Categories - normalize từ string hoặc object
  const rawCats = JSON.parse(localStorage.getItem('admin_categories') || 'null') || CATEGORIES_DEFAULT
  const normalizeCats = (cats) => cats.map(c => typeof c === 'string' ? { name: c, color: '#8ab4f8' } : c)
  const [categories, setCategories] = useState(normalizeCats(rawCats))
  const [catSearch, setCatSearch] = useState('')
  const [showCatModal, setShowCatModal] = useState(false)
  const [catForm, setCatForm] = useState({ name: '', color: '#8ab4f8' })
  const [catEditId, setCatEditId] = useState(null)

  // Settings
  const [settings, setSettings] = useState(
    JSON.parse(localStorage.getItem('admin_settings') || 'null') || {
      siteName: 'Yu-Gi-Oh! Duel Arena',
      siteDesc: 'Tra cứu bài, đọc hướng dẫn, và thách đấu ngay!',
      articlesPerPage: 9,
      maintenanceMode: false,
      allowComments: false,
    }
  )

  useEffect(() => { fetchArticles() }, [])
  useEffect(() => { setCurrentPage(1) }, [filterTitle, filterCat, filterStatus, filterDateFrom, filterDateTo])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // ── Articles ──────────────────────────────────────────
  const fetchArticles = async () => {
    try {
      setLoading(true)
      const res = await fetch(API_ADMIN_ARTICLES, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setArticles(Array.isArray(data) ? data : [])
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitArticle = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `${API_ARTICLES}/${editingId}` : API_ARTICLES
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error()
      await fetchArticles()
      setShowForm(false)
      setEditingId(null)
      setForm(emptyArticle)
      showToast(editingId ? '✅ Article updated' : '✅ New article added')
    } catch {
      setError('Save failed!')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (a) => {
    setForm({ title: a.title, category: a.category, desc: a.desc, content: a.content || '',
      image: a.image || IMAGES[0], author: a.author || 'Admin', published: a.published, color: a.color || '#8ab4f8' })
    setEditingId(a._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_ARTICLES}/${id}`, { method: 'DELETE', headers: authHeaders })
      setArticles(articles.filter(a => a._id !== id))
      setDeleteConfirm(null)
      showToast('🗑️ Article deleted')
    } catch { setError('Delete failed!') }
  }

  const handleTogglePublish = async (a) => {
    try {
      const res = await fetch(`${API_ARTICLES}/${a._id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ ...a, published: !a.published })
      })
      const updated = await res.json()
      setArticles(articles.map(x => x._id === updated._id ? updated : x))
      showToast(updated.published ? '✅ Published' : '🔒 Hidden')
    } catch { setError('Update failed!') }
  }

  // ── Categories ────────────────────────────────────────
  const saveCategories = (cats) => {
    setCategories(cats)
    localStorage.setItem('admin_categories', JSON.stringify(cats))
    showToast('✅ Categories saved')
  }

  const handleSubmitCat = () => {
    const name = catForm.name.trim().toUpperCase()
    if (!name) return
    if (catEditId !== null) {
      // Edit
      const updated = [...categories]
      updated[catEditId] = { ...updated[catEditId], name, color: catForm.color }
      saveCategories(updated)
    } else {
      // Add - check duplicate
      if (categories.some(c => c.name === name)) {
        setError('Category already exists!')
        return
      }
      saveCategories([...categories, { name, color: catForm.color }])
    }
    setShowCatModal(false)
    setCatForm({ name: '', color: '#8ab4f8' })
    setCatEditId(null)
  }

  const handleDeleteCat = (idx) => {
    saveCategories(categories.filter((_, i) => i !== idx))
  }

  // ── Settings ──────────────────────────────────────────
  const handleSaveSettings = () => {
    localStorage.setItem('admin_settings', JSON.stringify(settings))
    showToast('✅ Settings saved')
  }

  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10

  const filtered = articles.filter(a => {
    if (filterCat !== 'all' && a.category !== filterCat) return false
    if (filterStatus === 'published' && !a.published) return false
    if (filterStatus === 'hidden' && a.published) return false
    if (filterTitle && !a.title.toLowerCase().includes(filterTitle.toLowerCase())) return false
    if (filterDateFrom && new Date(a.createdAt) < new Date(filterDateFrom)) return false
    if (filterDateTo && new Date(a.createdAt) > new Date(filterDateTo + 'T23:59:59')) return false
    return true
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const catNames = categories.map(c => typeof c === 'string' ? c : c.name)
  const hasActiveFilter = filterTitle || filterCat !== 'all' || filterStatus !== 'all' || filterDateFrom || filterDateTo
  const resetFilters = () => { setFilterTitle(''); setFilterCat('all'); setFilterStatus('all'); setFilterDateFrom(''); setFilterDateTo(''); setCurrentPage(1) }

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="logo-yu">YU</span><span className="logo-gi">GI</span><span className="logo-oh">OH</span>
          <span className="admin-logo-sub">ADMIN</span>
        </div>

        <nav className="admin-nav">
          {[
            { key: 'articles', icon: '📰', label: 'Articles' },
            { key: 'categories', icon: '🏷️', label: 'Categories' },
            { key: 'settings', icon: '⚙️', label: 'Settings' },
          ].map(item => (
            <button
              key={item.key}
              className={`admin-nav-item ${page === item.key ? 'active' : ''}`}
              onClick={() => setPage(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-stats">
          <div className="stat-row">
            <span className="stat-label">Total Articles</span>
            <span className="stat-num">{articles.length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Published</span>
            <span className="stat-num published">{articles.filter(a => a.published).length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Hidden</span>
            <span className="stat-num hidden">{articles.filter(a => !a.published).length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Categories</span>
            <span className="stat-num">{categories.length}</span>
          </div>
        </div>

        <div className="admin-user">
          <div className="admin-user-info">
            <span className="admin-user-avatar">👤</span>
            <span className="admin-user-name">{username}</span>
          </div>
          <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
            ⏻
          </button>
        </div>
      </aside>
      <main className="admin-main">
        {error && <div className="admin-error" onClick={() => setError('')}>{error} ✕</div>}
        {toast && <div className="admin-toast">{toast}</div>}

        {/* ── ARTICLES PAGE ── */}
        {page === 'articles' && (
          <>
            <div className="admin-header">
              <div>
                <h1>📰 Articles</h1>
                <p>{filtered.length} / {articles.length} articles</p>
              </div>
              <button className="btn-primary" onClick={() => { setForm(emptyArticle); setEditingId(null); setShowForm(true) }}>
                + Add Article
              </button>
            </div>

            <div className="article-filters">
              {/* Row 1: search + status + reset */}
              <div className="af-row">
                <div className="af-search">
                  <span className="af-search-icon">🔍</span>
                  <input
                    className="af-input"
                    placeholder="Search by title..."
                    value={filterTitle}
                    onChange={e => setFilterTitle(e.target.value)}
                  />
                  {filterTitle && <button className="af-clear" onClick={() => setFilterTitle('')}>✕</button>}
                </div>

                <select className="af-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="published">✅ Published</option>
                  <option value="hidden">🔒 Hidden</option>
                </select>

                <select className="af-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                  <option value="all">All categories</option>
                  {catNames.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="af-date-group">
                  <input type="date" className="af-date" value={filterDateFrom}
                    onChange={e => setFilterDateFrom(e.target.value)} title="Từ ngày" />
                  <span className="af-date-sep">→</span>
                  <input type="date" className="af-date" value={filterDateTo}
                    onChange={e => setFilterDateTo(e.target.value)} title="Đến ngày" />
                </div>

                {hasActiveFilter && (
                  <button className="af-reset" onClick={resetFilters}>✕ Clear filters</button>
                )}
              </div>

              {/* Row 2: result count */}
              <div className="af-result">
                {hasActiveFilter
                  ? <span>Tìm thấy <strong>{filtered.length}</strong> / {articles.length} bài viết</span>
                  : <span>Tổng <strong>{articles.length}</strong> bài viết</span>
                }
              </div>
            </div>

            {loading ? (
              <div className="admin-loading"><div className="spinner" /><p>Loading...</p></div>
            ) : (
              <>
                {/* Bulk action bar */}
                {selected.size > 0 && (
                  <div className="bulk-bar">
                    <span className="bulk-count">Selected <strong>{selected.size}</strong> article(s)</span>
                    <div className="bulk-actions">
                      <button className="bulk-btn publish" onClick={() => handleBulkPublish(true)}>✅ Publish All</button>
                      <button className="bulk-btn hide" onClick={() => handleBulkPublish(false)}>🔒 Hide All</button>
                      <button className="bulk-btn delete" onClick={() => setDeleteConfirm('bulk')}>🗑️ Delete All</button>
                    </div>
                    <button className="bulk-clear" onClick={clearSelected}>✕ Deselect</button>
                  </div>
                )}

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>
                          <input type="checkbox"
                            className="row-check"
                            checked={paginated.length > 0 && selected.size === paginated.length}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th>Ảnh</th><th>Tiêu đề & Mô tả</th><th>Danh mục</th>
                        <th>Tác giả</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0
                        ? <tr><td colSpan={8} className="empty-row">No articles found</td></tr>
                        : paginated.map(a => (
                          <tr key={a._id} className={selected.has(a._id) ? 'row-selected' : ''}>
                            <td>
                              <input type="checkbox"
                                className="row-check"
                                checked={selected.has(a._id)}
                                onChange={() => toggleSelect(a._id)}
                              />
                            </td>
                            <td><img src={a.image} alt="" className="table-thumb" /></td>
                            <td>
                              <div className="table-title">{a.title}</div>
                              <div className="table-desc">{a.desc}</div>
                            </td>
                            <td>
                              <span className="cat-badge" style={{ background: (a.color || '#8ab4f8') + '22', color: a.color || '#8ab4f8', border: `1px solid ${(a.color || '#8ab4f8')}44` }}>
                                {a.category}
                              </span>
                            </td>
                            <td className="table-meta">{a.author}</td>
                            <td>
                              <button className={`status-btn ${a.published ? 'pub' : 'hid'}`} onClick={() => handleTogglePublish(a)}>
                                {a.published ? '✅ Published' : '🔒 Hidden'}
                              </button>
                            </td>
                            <td className="table-meta">{new Date(a.createdAt).toLocaleDateString('en-US')}</td>
                            <td>
                              <div className="action-btns">
                                <button className="btn-icon edit" onClick={() => handleEdit(a)} title="Edit">✏️</button>
                                <button className="btn-icon del" onClick={() => setDeleteConfirm(a._id)} title="Delete">🗑️</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {/* Pagination */}
            {!loading && filtered.length > 0 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setCurrentPage(1)} disabled={safePage === 1}>«</button>
                <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) => p === '...'
                    ? <span key={`e${i}`} className="page-ellipsis">…</span>
                    : <button key={p} className={`page-btn ${p === safePage ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                  )
                }
                <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>›</button>
                <button className="page-btn" onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>»</button>
                <span className="page-info">{safePage} / {totalPages} pages · {filtered.length} article(s)</span>
              </div>
            )}
          </>
        )}

        {/* ── CATEGORIES PAGE ── */}
        {page === 'categories' && (
          <>
            <div className="admin-header">
              <div>
                <h1>🏷️ Categories</h1>
                <p>{categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).length} / {categories.length} categories</p>
              </div>
              <button className="btn-primary" onClick={() => { setCatForm({ name: '', color: '#8ab4f8' }); setCatEditId(null); setShowCatModal(true) }}>
                + Add Category
              </button>
            </div>

            {/* Search */}
            <div className="cat-search-row">
              <input
                className="admin-input"
                placeholder="🔍  Tìm kiếm danh mục..."
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
              />
            </div>

            {/* List */}
            <div className="cat-list">
              {categories
                .filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                .map((cat, idx) => (
                  <div key={idx} className="cat-item">
                    <div className="cat-color-dot" style={{ background: cat.color || '#8ab4f8' }} />
                    <span className="cat-name">{cat.name}</span>
                    <span className="cat-count">{articles.filter(a => a.category === cat.name).length} bài</span>
                    <div className="action-btns">
                      <button className="btn-icon edit" onClick={() => {
                        setCatForm({ name: cat.name, color: cat.color || '#8ab4f8' })
                        setCatEditId(idx)
                        setShowCatModal(true)
                      }}>✏️</button>
                      <button className="btn-icon del" onClick={() => handleDeleteCat(idx)}>🗑️</button>
                    </div>
                  </div>
                ))
              }
              {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).length === 0 && (
                <div className="empty-row" style={{ padding: '32px', textAlign: 'center', color: '#484f58' }}>
                  Không tìm thấy danh mục nào
                </div>
              )}
            </div>
          </>
        )}

        {/* ── SETTINGS PAGE ── */}
        {page === 'settings' && (
          <>
            <div className="admin-header">
              <div>
                <h1>⚙️ Settings</h1>
                <p>General website configuration</p>
              </div>
              <button className="btn-primary" onClick={handleSaveSettings}>💾 Save Settings</button>
            </div>

            <div className="settings-sections">
              <div className="settings-card">
                <h3>🌐 Website Information</h3>
                <div className="settings-group">
                  <label>Website Name</label>
                  <input className="admin-input" value={settings.siteName}
                    onChange={e => setSettings({ ...settings, siteName: e.target.value })} />
                </div>
                <div className="settings-group">
                  <label>Website Description</label>
                  <textarea className="admin-textarea" value={settings.siteDesc}
                    onChange={e => setSettings({ ...settings, siteDesc: e.target.value })} rows={3} />
                </div>
                <div className="settings-group">
                  <label>Articles per page</label>
                  <input className="admin-input small-input" type="number" min={1} max={50}
                    value={settings.articlesPerPage}
                    onChange={e => setSettings({ ...settings, articlesPerPage: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="settings-card">
                <h3>🔧 Features</h3>
                <div className="settings-toggle-row">
                  <div>
                    <div className="toggle-title">Maintenance Mode</div>
                    <div className="toggle-desc">Hide website from regular users</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={settings.maintenanceMode}
                      onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })} />
                    <span className="toggle-track" />
                  </label>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="toggle-title">Allow Comments</div>
                    <div className="toggle-desc">Show comments section below articles</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={settings.allowComments}
                      onChange={e => setSettings({ ...settings, allowComments: e.target.checked })} />
                    <span className="toggle-track" />
                  </label>
                </div>
              </div>

              <div className="settings-card danger-card">
                <h3>⚠️ Danger Zone</h3>
                <div className="danger-row">
                  <div>
                    <div className="toggle-title">Delete all articles</div>
                    <div className="toggle-desc">This action cannot be undone</div>
                  </div>
                  <button className="btn-danger" onClick={() => setDeleteConfirm('all')}>Delete All</button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Article Form Modal */}
      {showForm && (
        <div className="modal-bg" onClick={() => setShowForm(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? '✏️ Sửa bài viết' : '+ Thêm bài viết mới'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmitArticle} className="article-form">
              <div className="form-group">
                <label>Title *</label>
                <input className="admin-input" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter title..." required />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Category *</label>
                  <select className="admin-input" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    {catNames.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Author</label>
                  <input className="admin-input" value={form.author}
                    onChange={e => setForm({ ...form, author: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Short Description *</label>
                <input className="admin-input" value={form.desc}
                  onChange={e => setForm({ ...form, desc: e.target.value })}
                  placeholder="Shown on home page..." required />
              </div>

              <div className="form-group">
                <label>Content</label>
                <div className="quill-wrapper">
                  <Suspense fallback={<div className="admin-textarea" style={{minHeight:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#484f58'}}>Loading editor...</div>}>
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={form.content}
                      onChange={val => setForm({ ...form, content: val })}
                      modules={quillModulesRef.current}
                      formats={quillFormats}
                      placeholder="Detailed content..."
                    />
                  </Suspense>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Cover Image</label>
                  <div className="upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      id="img-upload"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files[0]
                        if (!file) return
                        const fd = new FormData()
                        fd.append('image', file)
                        try {
                          const res = await fetch('http://localhost:5000/api/upload', {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: fd
                          })
                          const data = await res.json()
                          if (data.url) setForm({ ...form, image: `http://localhost:5000${data.url}` })
                          else setError('Upload thất bại')
                        } catch { setError('Upload thất bại') }
                      }}
                    />
                    <label htmlFor="img-upload" className="upload-btn">
                      📁 Choose from computer
                    </label>
                    <span className="upload-hint">JPG, PNG, WEBP · Max 5MB</span>
                  </div>
                  {form.image && <img src={form.image} alt="" className="img-preview" />}
                </div>
                <div className="form-group">
                  <label>Accent Color</label>
                  <div className="color-row">
                    {COLORS.map(c => (
                      <div key={c} className={`color-dot ${form.color === c ? 'sel' : ''}`}
                        style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
                    ))}
                  </div>
                  <label className="check-label">
                    <input type="checkbox" checked={form.published}
                      onChange={e => setForm({ ...form, published: e.target.checked })} />
                    Publicly published
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="modal-bg" onClick={() => setShowCatModal(false)}>
          <div className="admin-modal cat-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{catEditId !== null ? '✏️ Edit Category' : '+ Add New Category'}</h2>
              <button className="modal-close" onClick={() => setShowCatModal(false)}>✕</button>
            </div>
            <div className="cat-modal-body">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  className="admin-input"
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. TIER LIST, TOP DECKS..."
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSubmitCat()}
                />
                <span className="cat-input-hint">Name will be automatically capitalized</span>
              </div>
              <div className="form-group">
                <label>Color</label>
                <div className="color-row">
                  {COLORS.map(c => (
                    <div key={c} className={`color-dot ${catForm.color === c ? 'sel' : ''}`}
                      style={{ background: c }} onClick={() => setCatForm({ ...catForm, color: c })} />
                  ))}
                </div>
                <div className="cat-color-preview">
                  <span className="cat-badge-preview" style={{ background: catForm.color + '22', color: catForm.color, border: `1px solid ${catForm.color}44` }}>
                    {catForm.name.trim().toUpperCase() || 'PREVIEW'}
                  </span>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-ghost" onClick={() => setShowCatModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleSubmitCat} disabled={!catForm.name.trim()}>
                  {catEditId !== null ? 'Update' : 'Add Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-bg" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>⚠️ Confirm Delete</h3>
            <p>
              {deleteConfirm === 'all'
                ? 'Delete all articles? This cannot be undone.'
                : deleteConfirm === 'bulk'
                ? `Delete ${selected.size} selected article(s)? This cannot be undone.`
                : 'Delete this article? This cannot be undone.'}
            </p>
            <div className="confirm-actions">
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => {
                if (deleteConfirm === 'all') {
                  articles.forEach(a => fetch(`${API_ARTICLES}/${a._id}`, { method: 'DELETE' }))
                  setArticles([]); setDeleteConfirm(null); showToast('🗑️ All articles deleted')
                } else if (deleteConfirm === 'bulk') {
                  handleBulkDelete()
                } else {
                  handleDelete(deleteConfirm)
                }
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
