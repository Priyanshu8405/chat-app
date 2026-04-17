import { useAuth } from '../context/AuthContext';

const Message = ({ message }) => {
  const { user } = useAuth();
  const isSent = message.sender?._id === user?._id || message.sender === user?._id;

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = () => {
    if (message.messageType === 'image') {
      return (
        <>
          <img
            src={`http://localhost:5000${message.fileUrl}`}
            alt={message.fileName || 'Image'}
            className="message-image"
            loading="lazy"
          />
          {message.content && (
            <div className="message-content">{message.content}</div>
          )}
        </>
      );
    }

    if (message.messageType === 'file') {
      return (
        <>
          <a
            href={`http://localhost:5000${message.fileUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="message-file"
          >
            <span className="message-file-icon">📄</span>
            <span className="message-file-name">
              {message.fileName || 'Download file'}
            </span>
          </a>
          {message.content && (
            <div className="message-content">{message.content}</div>
          )}
        </>
      );
    }

    return <div className="message-content">{message.content}</div>;
  };

  return (
    <div className={`message-wrapper ${isSent ? 'sent' : 'received'}`}>
      <div className="message-bubble">
        {renderContent()}
        <div className="message-meta">
          <span className="message-time">
            {formatTime(message.createdAt || message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Message;
