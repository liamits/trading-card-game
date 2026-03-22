import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './CardSearch.css'

// Custom dropdown để tránh flash trắng của native select
function Dropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(o => o.value === value) || options[0]

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="cs-dropdown" ref={ref}>
      <button className="cs-dropdown-btn" onClick={() => setOpen(o => !o)}>
        {selected.label}
        <span className={`cs-dropdown-arrow ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="cs-dropdown-menu">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`cs-dropdown-item ${opt.value === value ? 'active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CardSearch() {
  const navigate = useNavigate()
  const [cards, setCards] = useState([])
  const [filteredCards, setFilteredCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)
  const [filters, setFilters] = useState({
    cardType: 'all', monsterType: 'all', spellType: 'all', trapType: 'all', level: 'all'
  })

  useEffect(() => { fetchCards() }, [])

  const fetchCards = async () => {
    try {
      const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php')
      const data = await response.json()
      setCards(data.data)
      setFilteredCards(data.data)
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (searchValue = searchTerm, filterValues = filters) => {
    let filtered = cards
    if (searchValue) {
      const term = searchValue.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.type.toLowerCase().includes(term) ||
        (c.desc && c.desc.toLowerCase().includes(term))
      )
    }
    if (filterValues.cardType !== 'all') {
      if (filterValues.cardType === 'monster') filtered = filtered.filter(c => c.type.includes('Monster'))
      else if (filterValues.cardType === 'spell') filtered = filtered.filter(c => c.type === 'Spell Card')
      else if (filterValues.cardType === 'trap') filtered = filtered.filter(c => c.type === 'Trap Card')
    }
    if (filterValues.monsterType !== 'all' && filterValues.cardType === 'monster')
      filtered = filtered.filter(c => c.type.toLowerCase().includes(filterValues.monsterType))
    if (filterValues.spellType !== 'all' && filterValues.cardType === 'spell')
      filtered = filtered.filter(c => c.race.toLowerCase().includes(filterValues.spellType))
    if (filterValues.trapType !== 'all' && filterValues.cardType === 'trap')
      filtered = filtered.filter(c => c.race.toLowerCase().includes(filterValues.trapType))
    if (filterValues.level !== 'all')
      filtered = filtered.filter(c => c.level === parseInt(filterValues.level))
    setFilteredCards(filtered)
  }

  const handleSearch = (e) => {
    const term = e.target.value
    setSearchTerm(term)
    applyFilters(term, filters)
  }

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value }
    if (filterType === 'cardType') {
      newFilters.monsterType = 'all'
      newFilters.spellType = 'all'
      newFilters.trapType = 'all'
      newFilters.level = 'all'
    }
    setFilters(newFilters)
    applyFilters(searchTerm, newFilters)
  }

  return (
    <div className="card-search-page">
      {/* Navbar */}
      <nav className="cs-navbar">
        <div className="cs-logo" onClick={() => navigate('/')}>
          <span style={{ color: '#8ab4f8' }}>YU</span>
          <span style={{ color: '#c58af9' }}>GI</span>
          <span style={{ color: '#ff77c6' }}>OH</span>
          <span className="cs-logo-meta">META</span>
        </div>
        <div className="cs-nav-links">
          <a href="#" className="cs-nav-link" onClick={() => navigate('/')}>🏠 Home</a>
          <a href="#" className="cs-nav-link active">🔍 Card Search</a>
          <a href="#" className="cs-nav-link" onClick={() => navigate('/game')}>⚔️ Play Now</a>
        </div>
      </nav>

      <div className="cs-content">
        <div className="cs-header">
          <h1>🔍 Yu-Gi-Oh! Card Search</h1>
          <p>Search over {cards.length.toLocaleString()} cards</p>
        </div>

        {/* Search & Filters */}
        <div className="cs-search-bar">
          <input
            type="text"
            placeholder="Search by name, type, or description..."
            value={searchTerm}
            onChange={handleSearch}
            className="cs-input"
          />
          <div className="cs-filters">
            <Dropdown
              value={filters.cardType}
              onChange={v => handleFilterChange('cardType', v)}
              options={[
                { value: 'all', label: 'All' },
                { value: 'monster', label: 'Monster' },
                { value: 'spell', label: 'Spell' },
                { value: 'trap', label: 'Trap' },
              ]}
            />
            {filters.cardType === 'monster' && (
              <>
                <Dropdown
                  value={filters.monsterType}
                  onChange={v => handleFilterChange('monsterType', v)}
                  options={[
                    { value: 'all', label: 'All Monsters' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'effect', label: 'Effect' },
                    { value: 'fusion', label: 'Fusion' },
                    { value: 'synchro', label: 'Synchro' },
                    { value: 'xyz', label: 'XYZ' },
                    { value: 'link', label: 'Link' },
                    { value: 'ritual', label: 'Ritual' },
                    { value: 'pendulum', label: 'Pendulum' },
                  ]}
                />
                <Dropdown
                  value={filters.level}
                  onChange={v => handleFilterChange('level', v)}
                  options={[
                    { value: 'all', label: 'All Levels' },
                    ...[...Array(13)].map((_, i) => ({ value: String(i + 1), label: `Level ${i + 1}` }))
                  ]}
                />
              </>
            )}
            {filters.cardType === 'spell' && (
              <Dropdown
                value={filters.spellType}
                onChange={v => handleFilterChange('spellType', v)}
                options={[
                  { value: 'all', label: 'All Spells' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'continuous', label: 'Continuous' },
                  { value: 'quick-play', label: 'Quick-Play' },
                  { value: 'equip', label: 'Equip' },
                  { value: 'field', label: 'Field' },
                  { value: 'ritual', label: 'Ritual' },
                ]}
              />
            )}
            {filters.cardType === 'trap' && (
              <Dropdown
                value={filters.trapType}
                onChange={v => handleFilterChange('trapType', v)}
                options={[
                  { value: 'all', label: 'All Traps' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'continuous', label: 'Continuous' },
                  { value: 'counter', label: 'Counter' },
                ]}
              />
            )}
          </div>
          <span className="cs-count">Found: {filteredCards.length} cards</span>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="cs-loading">
            <div className="cs-spinner" />
            <p>Loading card database...</p>
          </div>
        ) : (
          <div className="cs-grid">
            {filteredCards.map(card => (
              <div key={card.id} className="cs-card" onClick={() => setSelectedCard(card)}>
                <img src={card.card_images[0].image_url_small} alt={card.name} loading="lazy" />
                <div className="cs-card-info">
                  <p className="cs-card-name">{card.name}</p>
                  <p className="cs-card-type">{card.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="cs-modal" onClick={() => setSelectedCard(null)}>
          <div className="cs-modal-content" onClick={e => e.stopPropagation()}>
            <button className="cs-close" onClick={() => setSelectedCard(null)}>×</button>
            <img src={selectedCard.card_images[0].image_url} alt={selectedCard.name} />
            <div className="cs-modal-info">
              <h2>{selectedCard.name}</h2>
              <p><strong>Type:</strong> {selectedCard.type}</p>
              {selectedCard.atk !== undefined && <p><strong>ATK:</strong> {selectedCard.atk}</p>}
              {selectedCard.def !== undefined && <p><strong>DEF:</strong> {selectedCard.def}</p>}
              {selectedCard.level && <p><strong>Level:</strong> {selectedCard.level}</p>}
              {selectedCard.attribute && <p><strong>Attribute:</strong> {selectedCard.attribute}</p>}
              {selectedCard.race && <p><strong>Race:</strong> {selectedCard.race}</p>}
              <p className="cs-desc">{selectedCard.desc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CardSearch
