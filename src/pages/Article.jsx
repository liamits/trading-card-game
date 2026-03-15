import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import 'react-quill/dist/quill.snow.css'
import './Article.css'

function ShareBar({ title }) {
  const [copied, setCopied] = useState(false)
  const url = window.location.href

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const shareButtons = [
    {
      label: 'Facebook',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      ),
      color: '#1877f2',
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400'),
    },
    {
      label: 'Twitter/X',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: '#e8eaed',
      onClick: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400'),
    },
  ]

  return (
    <div className="share-bar">
      <span className="share-label">Chia sẻ:</span>
      {shareButtons.map(btn => (
        <button key={btn.label} className="share-btn" style={{ '--share-color': btn.color }} onClick={btn.onClick} title={btn.label}>
          {btn.icon}
          <span>{btn.label}</span>
        </button>
      ))}
      <button className={`share-btn copy-btn ${copied ? 'copied' : ''}`} onClick={copyLink} title="Copy link">
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
        <span>{copied ? 'Đã copy!' : 'Copy link'}</span>
      </button>
    </div>
  )
}

export default function Article() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [related, setRelated] = useState([])

  useEffect(() => {
    fetch(`http://localhost:5000/api/articles/${id}`)
      .then(r => r.json())
      .then(data => {
        setArticle(data)
        // Fetch related articles same category
        return fetch(`http://localhost:5000/api/articles`)
      })
      .then(r => r.json())
      .then(all => {
        if (Array.isArray(all)) {
          setRelated(all.filter(a => a._id !== id).slice(0, 3))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="article-page">
      <nav className="art-nav">
        <div className="art-logo" onClick={() => navigate('/')}>
          <span style={{ color: '#8ab4f8' }}>YU</span>
          <span style={{ color: '#c58af9' }}>GI</span>
          <span style={{ color: '#ff77c6' }}>OH</span>
          <span className="art-logo-meta">META</span>
        </div>
      </nav>
      <div className="art-loading">
        <div className="art-spinner" />
        <p>Đang tải bài viết...</p>
      </div>
    </div>
  )

  if (!article || article.error) return (
    <div className="article-page">
      <nav className="art-nav">
        <div className="art-logo" onClick={() => navigate('/')}>
          <span style={{ color: '#8ab4f8' }}>YU</span><span style={{ color: '#c58af9' }}>GI</span><span style={{ color: '#ff77c6' }}>OH</span>
          <span className="art-logo-meta">META</span>
        </div>
      </nav>
      <div className="art-loading">
        <p>Không tìm thấy bài viết.</p>
        <button className="art-back-btn" onClick={() => navigate('/')}>← Về trang chủ</button>
      </div>
    </div>
  )

  return (
    <div className="article-page">
      {/* Navbar */}
      <nav className="art-nav">
        <div className="art-logo" onClick={() => navigate('/')}>
          <span style={{ color: '#8ab4f8' }}>YU</span>
          <span style={{ color: '#c58af9' }}>GI</span>
          <span style={{ color: '#ff77c6' }}>OH</span>
          <span className="art-logo-meta">META</span>
        </div>
        <div className="art-nav-links">
          <button className="art-nav-link" onClick={() => navigate('/')}>🏠 Trang chủ</button>
          <button className="art-nav-link" onClick={() => navigate('/cards')}>🔍 Tìm bài</button>
          <button className="art-nav-link" onClick={() => navigate('/game')}>⚔️ Chơi ngay</button>
        </div>
      </nav>

      <div className="art-container">
        {/* Breadcrumb */}
        <div className="art-breadcrumb">
          <span onClick={() => navigate('/')}>Trang chủ</span>
          <span className="sep">›</span>
          <span onClick={() => navigate('/')}>{article.category}</span>
          <span className="sep">›</span>
          <span className="current">{article.title}</span>
        </div>

        <div className="art-layout">
          {/* Main content */}
          <article className="art-main">
            {/* Header */}
            <div className="art-header">
              <span className="art-cat-badge" style={{ background: (article.color || '#8ab4f8') + '22', color: article.color || '#8ab4f8', border: `1px solid ${(article.color || '#8ab4f8')}44` }}>
                {article.category}
              </span>
              <h1>{article.title}</h1>
              <div className="art-meta">
                <span>✍️ {article.author || 'Admin'}</span>
                <span>🕐 {new Date(article.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Cover image */}
            {article.image && (
              <div className="art-cover">
                <img src={article.image} alt={article.title} />
              </div>
            )}

            {/* Description */}
            <p className="art-desc">{article.desc}</p>

            {/* Content */}
            {article.content ? (
              <div
                className="art-content ql-editor"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <div className="art-no-content">
                <p>Nội dung chi tiết đang được cập nhật...</p>
              </div>
            )}

            {/* Share */}
            <ShareBar title={article.title} />
          </article>

          {/* Sidebar */}
          <aside className="art-sidebar">
            <div className="art-sidebar-card">
              <h3>📰 Bài viết liên quan</h3>
              <div className="art-related">
                {related.length === 0 ? (
                  <p className="no-related">Chưa có bài viết liên quan</p>
                ) : related.map(a => (
                  <div key={a._id} className="related-item" onClick={() => navigate(`/article/${a.slug || a._id}`)}>
                    <img src={a.image} alt={a.title} />
                    <div>
                      <span className="related-cat" style={{ color: a.color || '#8ab4f8' }}>{a.category}</span>
                      <p>{a.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="art-sidebar-card">
              <h3>⚔️ Chơi ngay</h3>
              <p style={{ color: '#8b949e', fontSize: '13px', marginBottom: '12px' }}>Thử sức với các nhân vật trong game!</p>
              <button className="art-play-btn" onClick={() => navigate('/game')}>Bắt đầu đấu</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
