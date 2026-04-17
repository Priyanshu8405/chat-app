import { useState, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import UserAvatar from './UserAvatar';

const Sidebar = ({ onSelectUser }) => {
  const { users, activeChat, setActiveChat, isUserOnline, searchUsers } = useChat();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback(
    (e) => {
      const query = e.target.value;
      setSearchQuery(query);

      // Debounce search
      const timeout = setTimeout(() => {
        searchUsers(query);
      }, 300);

      return () => clearTimeout(timeout);
    },
    [searchUsers]
  );

  const handleSelectUser = (selectedUser) => {
    setActiveChat(selectedUser);
    if (onSelectUser) onSelectUser();
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <UserAvatar name={user?.name} online={true} size="small" />
          <h2>Chats</h2>
        </div>
        <div className="sidebar-header-actions">
          <button
            className="icon-btn theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn" onClick={logout} title="Logout">
            🚪
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={handleSearch}
            id="user-search-input"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="users-list">
        {users.length === 0 ? (
          <div className="no-users">
            <span className="no-users-icon">👥</span>
            <p>No users found</p>
          </div>
        ) : (
          users.map((u) => (
            <div
              key={u._id}
              className={`user-item ${activeChat?._id === u._id ? 'active' : ''}`}
              onClick={() => handleSelectUser(u)}
              id={`user-item-${u._id}`}
            >
              <UserAvatar name={u.name} online={isUserOnline(u._id)} />
              <div className="user-item-info">
                <div className="user-item-name">{u.name}</div>
                <div className="user-item-status">
                  {isUserOnline(u._id) ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
