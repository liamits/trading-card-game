import { useState, useEffect } from 'react'
import './Admin.css'

const API_ARTICLES = 'http://localhost:5000/api/articles'
const CATEGORIES_DEFAULT = ['TIER LIST', 'TOP DECKS', 'FARMING & EVENTS', 'LEAKS & UPDATES', 'GUIDES']
const COLORS = ['#8ab4f8', '#c58af9', '#ff77c6', '#51cf66', '#ffd43b']
const IMAGES = [
  '/image/yamiyugi_pfp.webp', '/image/yugimuto_pfp.webp', '/image/setokaiba_pfp.webp',
  '/image/joey_pfp.webp', '/image/mai_pfp.webp', '/image/pegasus_pfp.webp',
  '/image/bakura_pfp.webp', '/image/marik_pfp.webp', '/image/ishuzu_pfp.webp',
]

const emptyArticle = {
  title: '', category: 'TIER LIST', desc: '', content: '',
  image: IMAGES[0], author: 'Admin', published: true, color: '#8ab4f8'
}

export default function Admin() {
  const [page, setPage] = useState('articles') // 'articles' | 'categories' | 'settings'
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // Article form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyArticle)
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Categories
  const [categories, setCategories] = useState(
    JSON.parse(localStorage.getItem('admin_categories') || 'null') || CATEGORIES_DEFAULT
  )
  const [newCat, setNewCat] = useState('')
  const [editCatIdx, setEditCatIdx] = useState(null)
  const [editCatVal, setEditCatVal] = useState('')

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

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // ── Articles ──────────────────────────────────────────
  const fetchArticles = async () => {
    try {
      setLoading(true)
      const res = await fetch(API_ARTICLES)
      const data = await res.json()
      setArticles(Array.isArray(data) ? data : [])
    } catch {
      setError('Không thể kết nối server.')
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error()
      await fetchArticles()
      setShowForm(false)
      setEditingId(null)
      setForm(emptyArticle)
      showToast(editingId ? '✅ Đã cập nhật bài viết' : '✅ Đã thêm bài viết mới')
    } catch {
      setError('Lưu thất bại!')
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
      await fetch(`${API_ARTICLES}/${id}`, { method: 'DELETE' })
      setArticles(articles.filter(a => a._id !== id))
      setDeleteConfirm(null)
      showToast('🗑️ Đã xóa bài viết')
    } catch { setError('Xóa thất bại!') }
  }

  const handleTogglePublish = async (a) => {
    try {
      const res = await fetch(`${API_ARTICLES}/${a._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...a, published: !a.published })
      })
      const updated = await res.json()
      setArticles(articles.map(x => x._id === updated._id ? updated : x))
      showToast(updated.published ? '✅ Đã đăng' : '🔒 Đã ẩn')
    } catch { setError('Cập nhật thất bại!') }
  }

  // ── Categories ────────────────────────────────────────
  const saveCategories = (cats) => {
    setCategories(cats)
    localStorage.setItem('admin_categories', JSON.stringify(cats))
    showToast('✅ Đã lưu danh mục')
  }

  const handleAddCat = () => {
    const val = newCat.trim().toUpperCase()
    if (!val || categories.includes(val)) return
    saveCategories([...categories, val])
    setNewCat('')
  }

  const handleDeleteCat = (idx) => {
    saveCategories(categories.filter((_, i) => i !== idx))
  }

  const handleSaveCat = (idx) => {
    const val = editCatVal.trim().toUpperCase()
    if (!val) return
    const updated = [...categories]
    updated[idx] = val
    saveCategories(updated)
    setEditCatIdx(null)
  }

  // ── Settings ──────────────────────────────────────────
  const handleSaveSettings = () => {
    localStorage.setItem('admin_settings', JSON.stringify(settings))
    showToast('✅ Đã lưu cài đặt')
  }

  const filtered = filterCat === 'all' ? articles : articles.filter(a => a.category === filterCat)

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
            { key: 'articles', icon: '📰', label: 'Bài viết' },
            { key: 'categories', icon: '🏷️', label: 'Danh mục' },
            { key: 'settings', icon: '⚙️', label: 'Cài đặt' },
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
            <span className="stat-label">Tổng bài</span>
            <span className="stat-num">{articles.length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Đã đăng</span>
            <span className="stat-num published">{articles.filter(a => a.published).length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Đang ẩn</span>
            <span className="stat-num hidden">{articles.filter(a => !a.published).length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Danh mục</span>
            <span className="stat-num">{categories.length}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {error && <div className="admin-error" onClick={() => setError('')}>{error} ✕</div>}
        {toast && <div className="admin-toast">{toast}</div>}

        {/* ── ARTICLES PAGE ── */}
        {page === 'articles' && (
          <>
            <div className="admin-header">
              <div>
                <h1>📰 Bài viết</h1>
                <p>{filtered.length} / {articles.length} bài viết</p>
              </div>
              <button className="btn-primary" onClick={() => { setForm(emptyArticle); setEditingId(null); setShowForm(true) }}>
                + Thêm bài viết
              </button>
            </div>

            <div className="admin-filters">
              <button className={`filter-btn ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>
                Tất cả ({articles.length})
              </button>
              {categories.map(cat => (
                <button key={cat} className={`filter-btn ${filterCat === cat ? 'active' : ''}`} onClick={() => setFilterCat(cat)}>
                  {cat} ({articles.filter(a => a.category === cat).length})
                </button>
              ))}
            </div>

            {loading ? (
              <div className="admin-loading"><div className="spinner" /><p>Đang tải...</p></div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ảnh</th><th>Tiêu đề & Mô tả</th><th>Danh mục</th>
                      <th>Tác giả</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0
                      ? <tr><td colSpan={7} className="empty-row">Chưa có bài viết nào</td></tr>
                      : filtered.map(a => (
                        <tr key={a._id}>
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
                              {a.published ? '✅ Đã đăng' : '🔒 Ẩn'}
                            </button>
                          </td>
                          <td className="table-meta">{new Date(a.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td>
                            <div className="action-btns">
                              <button className="btn-icon edit" onClick={() => handleEdit(a)} title="Sửa">✏️</button>
                              <button className="btn-icon del" onClick={() => setDeleteConfirm(a._id)} title="Xóa">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── CATEGORIES PAGE ── */}
        {page === 'categories' && (
          <>
            <div className="admin-header">
              <div>
                <h1>🏷️ Danh mục</h1>
                <p>{categories.length} danh mục</p>
              </div>
            </div>

            <div className="cat-add-row">
              <input
                className="admin-input"
                placeholder="Tên danh mục mới..."
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCat()}
              />
              <button className="btn-primary" onClick={handleAddCat}>+ Thêm</button>
            </div>

            <div className="cat-list">
              {categories.map((cat, idx) => (
                <div key={idx} className="cat-item">
                  {editCatIdx === idx ? (
                    <>
                      <input
                        className="admin-input cat-edit-input"
                        value={editCatVal}
                        onChange={e => setEditCatVal(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveCat(idx)}
                        autoFocus
                      />
                      <button className="btn-primary small" onClick={() => handleSaveCat(idx)}>Lưu</button>
                      <button className="btn-ghost small" onClick={() => setEditCatIdx(null)}>Hủy</button>
                    </>
                  ) : (
                    <>
                      <span className="cat-name">{cat}</span>
                      <span className="cat-count">{articles.filter(a => a.category === cat).length} bài</span>
                      <div className="action-btns">
                        <button className="btn-icon edit" onClick={() => { setEditCatIdx(idx); setEditCatVal(cat) }}>✏️</button>
                        <button className="btn-icon del" onClick={() => handleDeleteCat(idx)}>🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── SETTINGS PAGE ── */}
        {page === 'settings' && (
          <>
            <div className="admin-header">
              <div>
                <h1>⚙️ Cài đặt</h1>
                <p>Cấu hình chung của website</p>
              </div>
              <button className="btn-primary" onClick={handleSaveSettings}>💾 Lưu cài đặt</button>
            </div>

            <div className="settings-sections">
              <div className="settings-card">
                <h3>🌐 Thông tin website</h3>
                <div className="settings-group">
                  <label>Tên website</label>
                  <input className="admin-input" value={settings.siteName}
                    onChange={e => setSettings({ ...settings, siteName: e.target.value })} />
                </div>
                <div className="settings-group">
                  <label>Mô tả website</label>
                  <textarea className="admin-textarea" value={settings.siteDesc}
                    onChange={e => setSettings({ ...settings, siteDesc: e.target.value })} rows={3} />
                </div>
                <div className="settings-group">
                  <label>Số bài viết mỗi trang</label>
                  <input className="admin-input small-input" type="number" min={1} max={50}
                    value={settings.articlesPerPage}
                    onChange={e => setSettings({ ...settings, articlesPerPage: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="settings-card">
                <h3>🔧 Tính năng</h3>
                <div className="settings-toggle-row">
                  <div>
                    <div className="toggle-title">Chế độ bảo trì</div>
                    <div className="toggle-desc">Ẩn website với người dùng thông thường</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={settings.maintenanceMode}
                      onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })} />
                    <span className="toggle-track" />
                  </label>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <div className="toggle-title">Cho phép bình luận</div>
                    <div className="toggle-desc">Hiển thị phần bình luận dưới bài viết</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={settings.allowComments}
                      onChange={e => setSettings({ ...settings, allowComments: e.target.checked })} />
                    <span className="toggle-track" />
                  </label>
                </div>
              </div>

              <div className="settings-card danger-card">
                <h3>⚠️ Vùng nguy hiểm</h3>
                <div className="danger-row">
                  <div>
                    <div className="toggle-title">Xóa tất cả bài viết</div>
                    <div className="toggle-desc">Hành động này không thể hoàn tác</div>
                  </div>
                  <button className="btn-danger" onClick={() => setDeleteConfirm('all')}>Xóa tất cả</button>
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
                <label>Tiêu đề *</label>
                <input className="admin-input" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Nhập tiêu đề..." required />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Danh mục *</label>
                  <select className="admin-input" value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tác giả</label>
                  <input className="admin-input" value={form.author}
                    onChange={e => setForm({ ...form, author: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả ngắn *</label>
                <input className="admin-input" value={form.desc}
                  onChange={e => setForm({ ...form, desc: e.target.value })}
                  placeholder="Hiển thị trên trang chủ..." required />
              </div>

              <div className="form-group">
                <label>Nội dung</label>
                <textarea className="admin-textarea" value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Nội dung chi tiết..." rows={5} />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Ảnh đại diện</label>
                  <select className="admin-input" value={form.image}
                    onChange={e => setForm({ ...form, image: e.target.value })}>
                    {IMAGES.map(img => <option key={img} value={img}>{img.split('/').pop()}</option>)}
                  </select>
                  {form.image && <img src={form.image} alt="" className="img-preview" />}
                </div>
                <div className="form-group">
                  <label>Màu accent</label>
                  <div className="color-row">
                    {COLORS.map(c => (
                      <div key={c} className={`color-dot ${form.color === c ? 'sel' : ''}`}
                        style={{ background: c }} onClick={() => setForm({ ...form, color: c })} />
                    ))}
                  </div>
                  <label className="check-label">
                    <input type="checkbox" checked={form.published}
                      onChange={e => setForm({ ...form, published: e.target.checked })} />
                    Đăng công khai
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm bài viết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-bg" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>⚠️ Xác nhận xóa</h3>
            <p>{deleteConfirm === 'all' ? 'Xóa toàn bộ bài viết? Không thể hoàn tác.' : 'Xóa bài viết này? Không thể hoàn tác.'}</p>
            <div className="confirm-actions">
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Hủy</button>
              <button className="btn-danger" onClick={() => deleteConfirm === 'all'
                ? (articles.forEach(a => fetch(`${API_ARTICLES}/${a._id}`, { method: 'DELETE' })), setArticles([]), setDeleteConfirm(null), showToast('🗑️ Đã xóa tất cả'))
                : handleDelete(deleteConfirm)
              }>Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
