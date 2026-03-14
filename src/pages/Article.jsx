import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './Article.css'

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
              <div className="art-content">
                {article.content.split('\n').map((para, i) =>
                  para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                )}
              </div>
            ) : (
              <div className="art-no-content">
                <p>Nội dung chi tiết đang được cập nhật...</p>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="art-sidebar">
            <div className="art-sidebar-card">
              <h3>📰 Bài viết liên quan</h3>
              <div className="art-related">
                {related.length === 0 ? (
                  <p className="no-related">Chưa có bài viết liên quan</p>
                ) : related.map(a => (
                  <div key={a._id} className="related-item" onClick={() => navigate(`/article/${a._id}`)}>
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
