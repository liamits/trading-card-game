import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

const FALLBACK_ARTICLES = [
  { _id: '1', category: 'TIER LIST', title: 'Tier List Tháng 3/2026', desc: 'Bảng xếp hạng các deck mạnh nhất hiện tại trong meta', createdAt: new Date(), image: '/image/yamiyugi_pfp.webp', color: '#8ab4f8' },
  { _id: '2', category: 'TOP DECKS', title: 'Top Decks: Dark Magician', desc: 'Hướng dẫn xây dựng và chơi deck Dark Magician hiệu quả nhất', createdAt: new Date(), image: '/image/yugimuto_pfp.webp', color: '#c58af9' },
  { _id: '3', category: 'TOP DECKS', title: 'Top Decks: Blue-Eyes White Dragon', desc: 'Chiến lược và combo mạnh nhất với Blue-Eyes White Dragon', createdAt: new Date(), image: '/image/setokaiba_pfp.webp', color: '#8ab4f8' },
  { _id: '4', category: 'FARMING & EVENTS', title: 'Farming Guide: Yami Yugi', desc: 'Cách farm hiệu quả nhất để lấy các lá bài hiếm từ Yami Yugi', createdAt: new Date(), image: '/image/yamiyugi_pfp.webp', color: '#ff77c6' },
  { _id: '5', category: 'LEAKS & UPDATES', title: 'Cập nhật mới nhất: Banlist tháng 3', desc: 'Danh sách các lá bài bị cấm và hạn chế trong tháng 3/2026', createdAt: new Date(), image: '/image/marik_pfp.webp', color: '#c58af9' },
  { _id: '6', category: 'GUIDES', title: 'Hướng dẫn cho người mới bắt đầu', desc: 'Tất cả những gì bạn cần biết để bắt đầu chơi Yu-Gi-Oh!', createdAt: new Date(), image: '/image/joey_pfp.webp', color: '#8ab4f8' },
]

const navItems = ['TIER LIST', 'TOP DECKS', 'FARMING & EVENTS', 'LEAKS & UPDATES', 'GUIDES']

function Home() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    fetch('http://localhost:5000/api/articles')
      .then(r => r.json())
      .then(data => setArticles(Array.isArray(data) && data.length > 0 ? data : FALLBACK_ARTICLES))
      .catch(() => setArticles(FALLBACK_ARTICLES))
      .finally(() => setLoading(false))
  }, [])

  const filtered = articles.filter(a => {
    const matchCat = activeCategory === 'all' || a.category === activeCategory
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-yu">YU</span>
          <span className="logo-gi">GI</span>
          <span className="logo-oh">OH</span>
          <span className="logo-meta">META</span>
        </div>

        <div className="navbar-links">
          {navItems.map(item => (
            <a key={item} className="nav-link" href="#">{item}</a>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="nav-search-btn" onClick={() => navigate('/cards')}>
            🔍 TÌM BÀI
          </button>
          <button className="nav-play-btn" onClick={() => navigate('/game')}>
            ⚔️ CHƠI NGAY
          </button>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h1>Yu-Gi-Oh! Duel Arena</h1>
          <p>Tra cứu bài, đọc hướng dẫn, và thách đấu ngay!</p>

        </div>
      </div>

      {/* Articles Section */}
      <div className="home-content">
        <div className="articles-header">
          <h2>📰 Bài viết & Hướng dẫn</h2>
          <div className="home-search">
            <span className="home-search-icon">🔍</span>
            <input
              className="home-search-input"
              placeholder="Tìm kiếm bài viết..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="home-search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
        </div>

        {/* Category tabs */}
        <div className="home-cat-tabs">
          <button className={`home-cat-tab ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>
            Tất cả
          </button>
          {navItems.map(cat => (
            <button key={cat} className={`home-cat-tab ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="articles-grid">
          {loading ? (
            <div className="home-loading">Đang tải bài viết...</div>
          ) : filtered.length === 0 ? (
            <div className="home-no-results">Không tìm thấy bài viết nào 🃏</div>
          ) : filtered.map(article => (
            <div key={article._id} className="article-card" style={{ '--accent': article.color || '#8ab4f8' }}>
              <div className="article-image">
                <img src={article.image} alt={article.title} />
                <div className="article-overlay" />
                <span className="article-category">{article.category}</span>
              </div>
              <div className="article-body">
                <h3>{article.title}</h3>
                <p>{article.desc}</p>
                <div className="article-footer">
                  <span className="article-updated">🕐 {new Date(article.createdAt).toLocaleDateString('vi-VN')}</span>
                  <button className="article-read-btn" onClick={() => navigate(`/article/${article._id}`)}>
                    Đọc thêm →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Play Section */}
        <div className="play-section">
          <div className="play-card" onClick={() => navigate('/game')}>
            <div className="play-card-bg" />
            <div className="play-card-content">
              <h2>⚔️ Chơi ngay</h2>
              <p>Chọn nhân vật và bắt đầu đấu bài</p>
              <button className="play-big-btn">Bắt đầu</button>
            </div>
          </div>
          <div className="play-card" onClick={() => navigate('/cards')}>
            <div className="play-card-bg search-bg" />
            <div className="play-card-content">
              <h2>🔍 Tìm kiếm bài</h2>
              <p>Tra cứu hơn 10,000 lá bài Yu-Gi-Oh!</p>
              <button className="play-big-btn">Tìm kiếm</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2026 Yu-Gi-Oh! Duel Arena · Fan-made project</p>
      </footer>
    </div>
  )
}

export default Home
