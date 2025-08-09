import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignInPage from './SignInPage';
import SignUpPage from './SignUp';
import ChatPage from './ChatPage';
import Profile from './Profile';
import StartPage from './start';
import { SocketProvider } from './context/socketContext';
import BlockedUsersPage from './BlockedUserPage';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/blocked-users" element={<BlockedUsersPage />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;


