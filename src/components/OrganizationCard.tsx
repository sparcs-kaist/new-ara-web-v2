// OrganizationCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './OrganizationCard.css';

interface OrganizationCardProps {
  name: string;
  id: string;
  backgroundColor?: string;
  color?: string;
  icon?: string;
  slug?: string;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({
  name,
  id,
  backgroundColor = '#fdf0f0',
  color,
  icon,
  slug,
}) => {
  const generateHref = () => {
    switch (id) {
      case 'KAIST':
        return '/board/portal-notice';
      case 'all':
        return '/board';
      case 'top':
        return '/board/top';
      default:
        return generateOrganizationHref();
    }
  };

  const generateOrganizationHref = () => {
    if (slug) {
      return `/board/students-group?topic=${slug}`;
    }
    return '';
  };

  return (
    <div className="organization-card-wrap">
      <Link
        to={generateHref()}
        style={{ backgroundColor }}
        className="organization-card"
      >
        {icon ? (
          <i style={{ color }} className="logo logo--icon material-icons">
            {icon}
          </i>
        ) : (
          <img
            src={require(`../assets/Logo${id}.png`)}
            alt={name}
            className="logo"
          />
        )}
      </Link>
      <span className="name">{name}</span>
    </div>
  );
};

export default OrganizationCard;
