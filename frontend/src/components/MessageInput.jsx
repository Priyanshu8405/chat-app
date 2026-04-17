import { useState, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';

const MessageInput = () => {
  const { sendMessage, uploadFile, emitTyping, activeChat } = useChat();
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!activeChat) return null;

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || uploading) return;

    try {
      if (selectedFile) {
        setUploading(true);
        const uploadRes = await uploadFile(selectedFile);
        await sendMessage(
          text.trim(),
          uploadRes.messageType,
          uploadRes.fileUrl,
          uploadRes.fileName
        );
        setSelectedFile(null);
        setUploading(false);
      } else {
        await sendMessage(text.trim());
      }
      setText('');
      setShowEmoji(false);
    } catch (error) {
      console.error('Error sending:', error);
      setUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    emitTyping();
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Max size is 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* File preview */}
      {selectedFile && (
        <div className="file-preview">
          <span>📎</span>
          <span className="file-preview-info">
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </span>
          <button className="file-preview-remove" onClick={removeFile}>
            ✕
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="message-input-container">
        {/* Emoji picker */}
        {showEmoji && (
          <div className="emoji-picker-wrapper">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={theme === 'dark' ? 'dark' : 'light'}
              width={320}
              height={400}
              searchDisabled={false}
              skinTonesDisabled
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}

        <button
          className="emoji-btn"
          onClick={() => setShowEmoji(!showEmoji)}
          title="Emoji"
          id="emoji-toggle-btn"
        >
          😀
        </button>

        <button
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          id="attach-file-btn"
        >
          📎
        </button>

        <input
          type="file"
          ref={fileInputRef}
          className="file-input-hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        />

        <textarea
          className="message-text-input"
          placeholder="Type a message"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyPress}
          rows={1}
          id="message-input"
        />

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={(!text.trim() && !selectedFile) || uploading}
          title="Send"
          id="send-message-btn"
        >
          {uploading ? '⏳' : '➤'}
        </button>
      </div>
    </>
  );
};

export default MessageInput;
