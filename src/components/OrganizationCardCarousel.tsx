import React, { useState } from 'react';
import OrganizationCard from './OrganizationCard';
import '../styles/OrganizationCardCarousel.css';

interface OrganizationCardCarouselProps {
  cards: {
    name: string;
    id: string;
    backgroundColor?: string;
    color?: string;
    slug?: string;
  }[];
}

const OrganizationCardCarousel: React.FC<OrganizationCardCarouselProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalCards = cards.length;

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalCards);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalCards) % totalCards);
  };

  const getVisibleCards = () => {
    const visibleCards = [];
    for (let i = 0; i < 8; i++) {
      visibleCards.push(cards[(currentIndex + i) % totalCards]);
    }
    return visibleCards;
  };

  return (
    <div className="carousel-container">
      <button className="arrow-button" onClick={handlePrev}>
        &lt;
      </button>
      <div className="carousel-grid">
        {getVisibleCards().map((card, index) => (
          <OrganizationCard
            key={card.id + index}
            name={card.name}
            id={card.id}
            backgroundColor={card.backgroundColor}
            color={card.color}
            slug={card.slug}
          />
        ))}
      </div>
      <button className="arrow-button" onClick={handleNext}>
        &gt;
      </button>
    </div>
  );
};

export default OrganizationCardCarousel;
