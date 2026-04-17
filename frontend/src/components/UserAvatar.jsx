const UserAvatar = ({ name, online, size = 'medium' }) => {
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const sizeClass = size === 'small' ? 'small' : size === 'large' ? 'large' : '';

  return (
    <div className="user-avatar">
      <div className={`avatar-circle ${sizeClass}`}>
        {getInitials(name)}
      </div>
      {online && <div className="online-dot"></div>}
    </div>
  );
};

export default UserAvatar;
