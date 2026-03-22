import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

const FALLBACK_ARTICLES = [
  { _id: '1', category: 'TIER LIST', title: 'Tier List March 2026', desc: 'The most powerful decks in the current meta', createdAt: new Date(), image: '/image/yamiyugi_pfp.webp', color: '#8ab4f8' },
  { _id: '2', category: 'TOP DECKS', title: 'Top Decks: Dark Magician', desc: 'Guide to building and playing the most effective Dark Magician deck', createdAt: new Date(), image: '/image/yugimuto_pfp.webp', color: '#c58af9' },
  { _id: '3', category: 'TOP DECKS', title: 'Top Decks: Blue-Eyes White Dragon', desc: 'Strongest strategies and combos with Blue-Eyes White Dragon', createdAt: new Date(), image: '/image/setokaiba_pfp.webp', color: '#8ab4f8' },
  { _id: '4', category: 'FARMING & EVENTS', title: 'Farming Guide: Yami Yugi', desc: 'The most effective way to farm rare cards from Yami Yugi', createdAt: new Date(), image: '/image/yamiyugi_pfp.webp', color: '#ff77c6' },
  { _id: '5', category: 'LEAKS & UPDATES', title: 'Latest Update: March Banlist', desc: 'List of banned and restricted cards for March 2026', createdAt: new Date(), image: '/image/marik_pfp.webp', color: '#c58af9' },
  { _id: '6', category: 'GUIDES', title: 'Beginner\'s Guide', desc: 'Everything you need to know to start playing Yu-Gi-Oh!', createdAt: new Date(), image: '/image/joey_pfp.webp', color: '#8ab4f8' },
]

const navItems = ['TIER LIST', 'TOP DECKS', 'FARMING & EVENTS', 'LEAKS & UPDATES', 'GUIDES']

function Home() {
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [userProfile, setUserProfile] = useState(null)
  const articlesSectionRef = useRef(null)

  const selectCategory = (cat) => {
    setActiveCategory(cat)
    setSearch('')
    setTimeout(() => {
      articlesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  useEffect(() => {
    fetch('http://localhost:5000/api/articles')
      .then(r => r.json())
      .then(data => setArticles(Array.isArray(data) && data.length > 0 ? data : FALLBACK_ARTICLES))
      .catch(() => setArticles(FALLBACK_ARTICLES))
      .finally(() => setLoading(false))

    // Fetch user profile
    const token = localStorage.getItem('token')
    if (token) {
      fetch('http://localhost:5000/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => setUserProfile(data))
        .catch(err => console.error('Failed to fetch profile:', err))
    }
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
            <a
              key={item}
              className={`nav-link ${activeCategory === item ? 'active' : ''}`}
              href="#"
              onClick={e => { e.preventDefault(); selectCategory(item) }}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="navbar-actions">
          {userProfile && (
            <div className="user-stats-nav">
              <div className="nav-stat-item level">LV.{userProfile.level}</div>
              <div className="nav-stat-item gold">💰 {userProfile.gold}</div>
            </div>
          )}
          <button className="nav-search-btn" onClick={() => navigate('/cards')}>
            🔍 SEARCH CARDS
          </button>
          <button className="nav-play-btn" onClick={() => navigate('/game')}>
            ⚔️ PLAY NOW
          </button>
          <button className="nav-online-btn" onClick={() => navigate('/lobby')}>
            🌐 ONLINE DUEL
          </button>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h1>Yu-Gi-Oh! Duel Arena</h1>
          <p>Search cards, read guides, and start dueling now!</p>

        </div>
      </div>

      {/* Articles Section */}
      <div className="home-content" ref={articlesSectionRef}>
        <div className="articles-header">
          <h2>📰 Articles & Guides</h2>
          <div className="home-search">
            <span className="home-search-icon">🔍</span>
            <input
              className="home-search-input"
              placeholder="Search articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="home-search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
        </div>

        {/* Category tabs */}
        <div className="home-cat-tabs">
          <button className={`home-cat-tab ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => selectCategory('all')}>
            All
          </button>
          {navItems.map(cat => (
            <button key={cat} className={`home-cat-tab ${activeCategory === cat ? 'active' : ''}`} onClick={() => selectCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="articles-grid">
          {loading ? (
            <div className="home-loading">Loading articles...</div>
          ) : filtered.length === 0 ? (
            <div className="home-no-results">No articles found 🃏</div>
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
                  <span className="article-updated">🕐 {new Date(article.createdAt).toLocaleDateString('en-US')}</span>
                  <button className="article-read-btn" onClick={() => navigate(`/article/${article.slug || article._id}`)}>
                    Read more →
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
              <h2>⚔️ Play Now</h2>
              <p>Select your character and start dueling</p>
              <button className="play-big-btn">Start</button>
            </div>
          </div>
          <div className="play-card" onClick={() => navigate('/cards')}>
            <div className="play-card-bg search-bg" />
            <div className="play-card-content">
              <h2>🔍 Card Search</h2>
              <p>Search over 10,000 Yu-Gi-Oh! cards</p>
              <button className="play-big-btn">Search</button>
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
