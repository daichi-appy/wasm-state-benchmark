import type { Item } from '../types';

type Props = {
  item: Item;
};

export function ItemCard({ item }: Props) {
  return (
    <div className="item-card">
      <div className="item-header">
        <h3 className="item-title">{item.title}</h3>
        <span className={`playable-badge ${item.isPlayable ? 'playable' : 'not-playable'}`}>
          {item.isPlayable ? 'Playable' : 'Not Playable'}
        </span>
      </div>
      <div className="item-rating">
        {'★'.repeat(Math.round(item.rating))}
        {'☆'.repeat(5 - Math.round(item.rating))}
        <span className="rating-value">({item.rating.toFixed(1)})</span>
      </div>
      <div className="item-tags">
        {item.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
