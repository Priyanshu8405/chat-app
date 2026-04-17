import { useState } from 'react';
import { ChatProvider } from '../context/ChatContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const Chat = () => {
  const [mobileSidebarHidden, setMobileSidebarHidden] = useState(false);

  return (
    <ChatProvider>
      <div className="chat-layout">
        <div className={`sidebar ${mobileSidebarHidden ? 'hidden-mobile' : ''}`}>
          <Sidebar onSelectUser={() => setMobileSidebarHidden(true)} />
        </div>
        <ChatWindow onBack={() => setMobileSidebarHidden(false)} />
      </div>
    </ChatProvider>
  );
};

export default Chat;
