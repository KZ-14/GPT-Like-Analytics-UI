import { faBorderStyle } from '@fortawesome/free-solid-svg-icons';
import React from 'react';

const styles = {
  avatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontWeight: '600',
    borderRadius: '50%',
    faBorderStyle: "Bold"
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  small: {
    width: '32px',
    height: '32px',
    fontSize: '14px'
  },
  medium: {
    width: '48px',
    height: '48px',
    fontSize: '18px'
  },
  large: {
    width: '64px',
    height: '64px',
    fontSize: '20px'
  },
  title: {
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '1rem'
  }
};

const InitialAvatar = ({ name, size = 'md', style = {} }) => {
  // Get initials from the name
  const getInitials = (name) => {
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Combine styles based on size
  const combinedStyles = {
    ...styles.avatar,
    ...styles[size],
    ...style
  };

  return (
    <div style={combinedStyles}>
      {getInitials(name)}
    </div>
  );
};

export default InitialAvatar;