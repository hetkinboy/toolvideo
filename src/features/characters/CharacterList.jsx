import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../core/store';
import { api } from '../../core/api';
import CharacterCreateModal from './CharacterCreateModal';

export default function CharacterList() {
  const currentProject = useStore((s) => s.currentProject);
  const characters = useStore((s) => s.characters);
  const loadCharacters = useStore((s) => s.loadCharacters);
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (currentProject) loadCharacters();
  }, [currentProject]);

  const filtered = filter === 'all'
    ? characters
    : characters.filter((c) => c.role === filter);

  const roleColors = {
    main: 'var(--role-main)',
    supporting: 'var(--role-supporting)',
    enemy: 'var(--role-enemy)',
    npc: 'var(--role-npc)',
  };

  const roleLabels = {
    main: 'Nhân vật chính',
    supporting: 'Nhân vật phụ',
    enemy: 'Phản diện',
    npc: 'NPC',
  };

  const getInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header__left">
          <h1 className="page-header__title">👤 Characters</h1>
          <p className="page-header__subtitle">{characters.length} nhân vật trong project</p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
            + Tạo nhân vật
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="tabs mb-6">
        {['all', 'main', 'supporting', 'enemy', 'npc'].map((r) => (
          <button
            key={r}
            className={`tab ${filter === r ? 'tab--active' : ''}`}
            onClick={() => setFilter(r)}
          >
            {r === 'all' ? 'Tất cả' : roleLabels[r]}
            <span style={{
              marginLeft: 'var(--space-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              opacity: 0.6,
            }}>
              {r === 'all' ? characters.length : characters.filter(c => c.role === r).length}
            </span>
          </button>
        ))}
      </div>

      {/* Character Grid */}
      <div className="grid grid--auto">
        {filtered.map((char) => (
          <div
            key={char.id}
            className="character-card"
            onClick={() => navigate(`/characters/${char.id}`)}
          >
            <div className="character-card__avatar" style={{
              background: `linear-gradient(135deg, ${roleColors[char.role]}22, ${roleColors[char.role]}44)`,
              color: roleColors[char.role],
            }}>
              {getInitials(char.name)}
            </div>
            <div className="character-card__info">
              <div className="character-card__name">{char.name}</div>
              {char.alias && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                  "{char.alias}"
                </div>
              )}
              <div className={`character-card__role character-card__role--${char.role}`}>
                {roleLabels[char.role]}
              </div>
              <div className="character-card__meta">
                <span>Tuổi thật: {char.age}</span>
                {char.apparent_age && <><span>·</span><span>Ngoại hình: {char.apparent_age}</span></>}
                <span>·</span>
                <span>{char.gender}</span>
                <span>·</span>
                <span className={`canon-badge canon-badge--${char.status}`} style={{ fontSize: '0.6rem' }}>
                  {char.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">👤</div>
          <div className="empty-state__title">Chưa có nhân vật nào</div>
          <div className="empty-state__desc">Tạo nhân vật đầu tiên để bắt đầu xây dựng câu chuyện</div>
          <button className="btn btn--primary mt-4" onClick={() => setShowCreateModal(true)}>
            + Tạo nhân vật
          </button>
        </div>
      )}

      {showCreateModal && (
        <CharacterCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newChar) => navigate(`/characters/${newChar.id}`)}
        />
      )}
    </div>
  );
}
