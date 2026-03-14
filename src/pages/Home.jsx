import { useNavigate } from 'react-router-dom'
import './Home.css'

const articles = [
  {
    id: 1,
    category: 'TIER LIST',
    title: 'Tier List Tháng 3/2026',
    desc: 'Bảng xếp hạng các deck mạnh nhất hiện tại trong meta',
    updated: '2 ngày trước',
    image: '/image/yamiyugi_pfp.webp',
    color: '#8ab4f8'
  },
  {
    id: 2,
    category: 'TOP DECKS',
    title: 'Top Decks: Dark Magician',
    desc: 'Hướng dẫn xây dựng và chơi deck Dark Magician hiệu quả nhất',
    updated: '5 giờ trước',
    image: '/image/yugimuto_pfp.webp',
    color: '#c58af9'
  },
  {
    id: 3,
    category: 'TOP DECKS',
    title: 'Top Decks: Blue-Eyes White Dragon',
    desc: 'Chiến lược và combo mạnh nhất với Blue-Eyes White Dragon',
    updated: '5 giờ trước',
    image: '/image/setokaiba_pfp.webp',
    color: '#8ab4f8'
  },
  {
    id: 4,
    category: 'FARMING & EVENTS',
    title: 'Farming Guide: Yami Yugi',
    desc: 'Cách farm hiệu quả nhất để lấy các lá bài hiếm từ Yami Yugi',
    updated: '2 sự kiện đang diễn ra',
    image: '/image/yamiyugi_pfp.webp',
    color: '#ff77c6'
  },
  {
    id: 5,
    category: 'LEAKS & UPDATES',
    title: 'Cập nhật mới nhất: Banlist tháng 3',
    desc: 'Danh sách các lá bài bị cấm và hạn chế trong tháng 3/2026',
    updated: '16 ngày trước',
    image: '/image/marik_pfp.webp',
    color: '#c58af9'
  },
  {
    id: 6,
    category: 'GUIDES',
    title: 'Hướng dẫn cho người mới bắt đầu',
    desc: 'Tất cả những gì bạn cần biết để bắt đầu chơi Yu-Gi-Oh!',
    updated: '1 tháng trước',
    image: '/image/joey_pfp.webp',
    color: '#8ab4f8'
  },
  {
    id: 7,
    category: 'TOP DECKS',
    title: 'Top Decks: Exodia',
    desc: 'Xây dựng deck Exodia và chiến lược rút bài nhanh nhất',
    updated: '3 ngày trước',
    image: '/image/pegasus_pfp.webp',
    color: '#ff77c6'
  },
  {
    id: 8,
    category: 'GUIDES',
    title: 'Hướng dẫn Fusion Summon',
    desc: 'Tất cả về Fusion Summon: cách thực hiện, các combo mạnh nhất',
    updated: '1 tuần trước',
    image: '/image/bakura_pfp.webp',
    color: '#c58af9'
  },
  {
    id: 9,
    category: 'LEAKS & UPDATES',
    title: 'Các lá bài mới sắp ra mắt',
    desc: 'Danh sách các lá bài mới được xác nhận sẽ ra mắt trong thời gian tới',
    updated: '3 ngày trước',
    image: '/image/ishuzu_pfp.webp',
    color: '#8ab4f8'
  }
]

const navItems = ['TIER LIST', 'TOP DECKS', 'FARMING & EVENTS', 'LEAKS & UPDATES', 'GUIDES']

function Home() {
  const navigate = useNavigate()

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
          <div className="hero-buttons">
            <button className="hero-btn primary" onClick={() => navigate('/game')}>
              ⚔️ Bắt đầu đấu
            </button>
            <button className="hero-btn secondary" onClick={() => navigate('/cards')}>
              🔍 Tìm kiếm bài
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="home-content">
        <div className="section-title">
          <h2>📰 Bài viết & Hướng dẫn</h2>
        </div>

        {/* Articles Grid */}
        <div className="articles-grid">
          {articles.map(article => (
            <div key={article.id} className="article-card" style={{ '--accent': article.color }}>
              <div className="article-image">
                <img src={article.image} alt={article.title} />
                <div className="article-overlay" />
                <span className="article-category">{article.category}</span>
              </div>
              <div className="article-body">
                <h3>{article.title}</h3>
                <p>{article.desc}</p>
                <span className="article-updated">🕐 {article.updated}</span>
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
