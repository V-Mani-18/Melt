import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
 
  useEffect(() => {
    // Connect to socket server
    const newSocket = io('http://localhost:5000', {
      withCredentials: true,
      autoConnect: false
    });
    
    setSocket(newSocket);

    // Connect when user is authenticated
    const userId = localStorage.getItem('userId');
    if (userId) {
      newSocket.auth = { userId };
      newSocket.connect();
    }

    return () => newSocket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
