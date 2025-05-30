import React, { useState } from 'react';
import { NFLPlayer, getPlayerImage } from '../services/nflService';

export interface PlayerAvatarProps {
  player: NFLPlayer;
  size?: 'sm' | 'md' | 'lg';
}

// Get initials from a player's full name (first letter of first and last name)
const getInitials = (fullName: string) => {
  const names = fullName.split(' ');
  const firstName = names[0] || '';
  const lastName = names[names.length - 1] || '';
  return (firstName[0] + lastName[0]).toUpperCase();
};

// Generate a consistent color based on the player's name
const getPlayerColor = (name: string) => {
  const colors = [
    '#F87171', // red
    '#60A5FA', // blue
    '#34D399', // green
    '#FBBF24', // yellow
    '#A78BFA', // purple
    '#F472B6', // pink
    '#2DD4BF', // teal
    '#FB923C', // orange
  ];
  
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, size = 'sm' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const imageUrl = getPlayerImage(player);
  const initials = getInitials(player.fullName);
  const backgroundColor = getPlayerColor(player.fullName);

  if (!imageUrl || imageError) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center`}
        style={{ backgroundColor }}
      >
        <span className="font-medium text-white">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100`}>
      <img
        src={imageUrl}
        alt={player.fullName}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

export default PlayerAvatar; 