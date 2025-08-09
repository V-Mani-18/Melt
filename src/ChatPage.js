import React, { useState, useRef, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import {
  AppBar, Toolbar, Typography, IconButton, Avatar, List,
  ListItem, ListItemAvatar, ListItemText, Box, Paper, useMediaQuery,
  Button, BottomNavigation, BottomNavigationAction, Tooltip, TextField,
  InputAdornment, Dialog, DialogTitle, DialogActions, Card
} from '@mui/material';
import {
  Search as SearchIcon, ArrowBack as ArrowBackIcon, Settings as SettingsIcon,
  Phone as PhoneIcon, Chat as ChatIcon, AccountCircle as AccountCircleIcon,
  Mic as MicIcon, Send as SendIcon, Add as AddIcon,
  Image as ImageIcon, Description as DocumentIcon, Contacts as ContactIcon,
  Notifications as NotificationsIcon, VolumeUp as VolumeUpIcon, PauseCircleFilled as PauseCircleFilledIcon, MicOff as MicOffIcon
} from '@mui/icons-material';
import Call from './call'; // <-- Correct import
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Profile from './Profile';
import AnimatedTitle from './AnimatedTitle';
import Settings from './Settings';
import SearchPage from './SearchPage';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import UserProfile from './UserProfile';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Peer from 'simple-peer';
import callerAudioFile from './assets/caller.mp3';
import receiverAudioFile from './assets/reciver.mp3';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
// ...existing imports...c

const ChatPage = () => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [selectedUser, setSelectedUser] = useState(null);
  const [bottomNav, setBottomNav] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState({});
  const [unread, setUnread] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [hasNotification, setHasNotification] = useState(false);
  const [friendRequestsList, setFriendRequestsList] = useState([]);
  const [friends, setFriends] = useState([]);
  const [dbFriends, setDbFriends] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileDialogUser, setProfileDialogUser] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState(null);
  const [call, setCall] = useState({});
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState(null);
  const [callerId, setCallerId] = useState(null);
  const [calling, setCalling] = useState(false);
  const [callRejected, setCallRejected] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState('00:00');
  const myVideo = useRef();
  const userVideo = useRef();
  const callerAudioRef = useRef(null);
  const receiverAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [callLogs, setCallLogs] = useState([]);
  const [usersInChat, setUsersInChat] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetch(`http://localhost:5000/api/user/${userId}`)
        .then(res => res.json())
        .then(data => setUser(data));
    }
  }, []);

  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId) {
      fetch(`http://localhost:5000/api/user/${currentUserId}/friends`)
        .then(res => res.json())
        .then(data => setDbFriends(data));
    }
  }, [friendRequestsList, selectedUser]);

  useEffect(() => {
    const timer = setTimeout(() => setHasNotification(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetch(`http://localhost:5000/api/user/${userId}/friendRequests`)
        .then(res => res.json())
        .then(data => setFriendRequestsList(data));
    }
  }, []);

  const handleAcceptFriend = async (req) => {
    const userId = localStorage.getItem('userId');
    await fetch(`http://localhost:5000/api/friendRequests/${req.senderId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: userId }),
    });
    fetch(`http://localhost:5000/api/user/${userId}/friendRequests`)
      .then(res => res.json())
      .then(data => setFriendRequestsList(data));
    fetch(`http://localhost:5000/api/user/${userId}/friends`)
      .then(res => res.json())
      .then(data => setDbFriends(data));
  };

  const handleNotificationClick = () => {
    setBottomNav(4);
    setHasNotification(false);
  };

  const showChatList = isMobile ? !selectedUser : true;
  const showChatPane = isMobile ? !!selectedUser : true;

  const allChatMembers = dbFriends.map(f => ({
    name: f.username,
    image: f.profilePic || '',
    online: true,
    _id: f._id
  }));
  const filteredMembers = allChatMembers.filter((member) =>
    typeof member.name === 'string' && member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedUser || !socket || !user || !user._id) return;

    const roomId = [user._id, selectedUser._id].sort().join('-');
    const newMessage = {
      text: message.trim(),
      senderId: user._id,
      senderUsername: user.username,
      receiverId: selectedUser._id,
      receiverUsername: selectedUser.name,
      roomId: [user._id, selectedUser._id].sort().join('-'),
    };

    socket.emit('send_message', newMessage);

    setMessages(prev => {
      const updated = { ...prev };
      if (!updated[selectedUser._id]) updated[selectedUser._id] = [];
      updated[selectedUser._id].push({
        sender: 'You',
        text: message.trim(),
        timestamp: formatTime(new Date()),
        date: formatDate(new Date()),
      });
      return updated;
    });
    setMessage('');
  };

  const handleMicClick = async () => {
    if (!isRecording) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorderRef.current = new window.MediaRecorder(stream);
          audioChunksRef.current = [];
          mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };
          mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setAudioBlob(blob);
          };
          mediaRecorderRef.current.start();
          setIsRecording(true);
        } catch (err) {
          alert('Microphone permission denied. Please allow access in your browser settings.');
        }
      }
    } else {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendAudio = () => {
    if (audioBlob && selectedUser && socket && user) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = reader.result;
        const newMessage = {
          senderId: user._id,
          senderUsername: user.username,
          receiverId: selectedUser._id,
          receiverUsername: selectedUser.username,
          roomId: [user._id, selectedUser._id].sort().join('-'), // <-- FIXED HERE
          audio: base64Audio,
          timestamp: formatTime(new Date()),
          date: formatDate(new Date()),
        };
        socket.emit('send_message', newMessage);

        setMessages(prev => {
          const updated = { ...prev };
          if (!updated[selectedUser._id]) updated[selectedUser._id] = [];
          updated[selectedUser._id].push({
            sender: 'You',
            audio: base64Audio,
            timestamp: formatTime(new Date()),
            date: formatDate(new Date()),
          });
          return updated;
        });
        setAudioBlob(null);
      };
      reader.readAsDataURL(audioBlob);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!socket || !selectedUser || !user) return;

    if (e.target.value && !isTyping) {
      socket.emit('typing', {
        roomId: [user._id, selectedUser._id].sort().join('-'),
        senderId: user._id
      });
      setIsTyping(true);
    } else if (!e.target.value && isTyping) {
      socket.emit('stop_typing', {
        roomId: [user._id, selectedUser._id].sort().join('-'),
        senderId: user._id
      });
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!socket || !user) return;

    const handleTypingEvent = ({ senderId }) => {
      if (senderId !== user._id) {
        setOtherTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId !== user._id) {
        setOtherTyping(false);
      }
    };

    socket.on('typing', handleTypingEvent);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('typing', handleTypingEvent);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, user]);

  const handleReceiveMessage = (message) => {
    const otherUserId = message.senderId === user?._id ? message.receiverId : message.senderId;
    setMessages(prev => {
      const updated = { ...prev };
      if (!updated[otherUserId]) updated[otherUserId] = [];
      updated[otherUserId].push({
        sender: message.senderId === user?._id ? 'You' : message.senderUsername,
        text: message.text,
        // ...other fields...
      });
      return updated;
    });
    // Mark as unread if chat is not open
    if (!selectedUser || selectedUser._id !== otherUserId) {
      setUnread(prev => ({
        ...prev,
        [otherUserId]: true
      }));
    }
  };

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    newSocket.on('receive_message', handleReceiveMessage);

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('receive_message', handleReceiveMessage);
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !selectedUser || !user || !user._id || !selectedUser._id) return;
    const roomId = [user._id, selectedUser._id].sort().join('-');
    socket.emit('join_room', roomId, user.username);
    return () => {
      socket.emit('leave_room', roomId);
    };
  }, [socket, selectedUser, user]);

  useEffect(() => {
    if (!socket || !user || !user._id) return;
    socket.emit('join_room', user._id, user.username);
  }, [socket, user]);

  useEffect(() => {
    if (!selectedUser) {
      setMessages(prev => {
        const updated = { ...prev };
        return updated;
      });
    }
  }, [selectedUser]);

  useEffect(() => {
    if (user && user._id) {
      console.log('Logged-in user ID:', user._id);
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handleOnlineUsers = (ids) => setOnlineUserIds(ids);
    socket.on('online_users', handleOnlineUsers);
    return () => socket.off('online_users', handleOnlineUsers);
  }, [socket]);

  const sortedMembers = [...dbFriends]
    .map(f => ({
      ...f,
      online: onlineUserIds.includes(f._id.toString())
    }))
    .sort((a, b) => b.online - a.online);

  useEffect(() => {
    if (!selectedUser) {
      setMessages({});
      setUnread({});
    }
  }, [selectedUser]);

  const handleSendImage = (file) => {
    if (!selectedUser || !socket || !user) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newMessage = {
        senderId: user._id,
        senderUsername: user.username,
        receiverId: selectedUser._id,
        receiverUsername: selectedUser.username,
        roomId: [user._id, selectedUser._id].sort().join('-'),
        image: reader.result,
        timestamp: formatTime(new Date()),
        date: formatDate(new Date()),
      };
      socket.emit('send_message', newMessage);
      setMessages(prev => {
        const updated = { ...prev };
        if (!updated[selectedUser._id]) updated[selectedUser._id] = [];
        updated[selectedUser._id].push({
          sender: 'You',
          image: reader.result,
          timestamp: formatTime(new Date()),
          date: formatDate(new Date()),
        });
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendDocument = (file) => {
    if (!selectedUser || !socket || !user) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newMessage = {
        senderId: user._id,
        senderUsername: user.username,
        receiverId: selectedUser._id,
        receiverUsername: selectedUser.username,
        roomId: [user._id, selectedUser._id].sort().join('-'),
        document: file.name,
        documentData: reader.result,
        timestamp: formatTime(new Date()),
        date: formatDate(new Date()),
      };
      socket.emit('send_message', newMessage);
      setMessages(prev => {
        const updated = { ...prev };
        if (!updated[selectedUser._id]) updated[selectedUser._id] = [];
        updated[selectedUser._id].push({
          sender: 'You',
          document: file.name,
          documentData: reader.result,
          timestamp: formatTime(new Date()),
          date: formatDate(new Date()),
        });
        return updated;
      });
    };
    reader.readAsDataURL(file);
  };

  const addCallLog = (log) => {
    setCallLogs(prev => [
      {
        ...log,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id: Date.now() + Math.random()
      },
      ...prev
    ]);
  };

  const initiateCall = async (friendId) => {
    if (!socket || !user) return;
    setCalling(true);
    setCallRejected(false);

    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(currentStream);

      if (callerAudioRef.current) {
        callerAudioRef.current.currentTime = 0;
        callerAudioRef.current.play();
      }

      const peer = new Peer({ initiator: true, trickle: false, stream: currentStream });

      peer.on('signal', data => {
        socket.emit('callUser', {
          to: friendId,
          from: user._id,
          callerName: user.name,
          signal: data
        });
      });

      peer.on('stream', remoteStream => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.onloadedmetadata = () => {
            remoteAudioRef.current.play().catch(err => {
              console.warn("Autoplay failed:", err.message);
            });
          };
        }
      });
      socket.on('callAccepted', signal => {
        setCallAccepted(true);
        setCalling(false);
        setCallStarted(true);
        setCallStartTime(Date.now());
        peer.signal(signal);
        if (callerAudioRef.current) callerAudioRef.current.pause();
      });

      socket.on('callRejected', () => {
        setCalling(false);
        setCallRejected(true);
        setTimeout(() => setCallRejected(false), 2000);
        if (callerAudioRef.current) callerAudioRef.current.pause();
        currentStream.getTracks().forEach(track => track.stop());
        setStream(null);
      });

      setCall(peer);

      addCallLog({
        name: selectedUser?.username || selectedUser?.name || 'Unknown',
        type: 'outgoing',
        image: selectedUser?.profilePic || selectedUser?.image || '',
        status: 'calling'
      });
    } catch (err) {
      alert('Microphone permission denied. Please allow access in your browser settings.');
      setCalling(false);
    }
  };

  const answerCall = async () => {
    setCallAccepted(true);
    setCallStarted(true);
    setCallStartTime(Date.now());
    if (receiverAudioRef.current) receiverAudioRef.current.pause();

    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(currentStream);

      const peer = new Peer({ initiator: false, trickle: false, stream: currentStream });

      peer.on('signal', data => {
        socket.emit('answerCall', { to: call.from, signal: data });
      });

      peer.signal(callerSignal);
      setCall(peer);

      addCallLog({
        name: call?.callerName || 'Unknown',
        type: 'incoming',
        image: selectedUser?.profilePic || selectedUser?.image || '',
        status: 'answered'
      });
    } catch (err) {
      alert('Microphone permission denied. Please allow access in your browser settings.');
      setCallAccepted(false);
      setCallStarted(false);
    }
  };

  const rejectCall = () => {
    socket.emit('rejectCall', { to: call.from });
    setReceivingCall(false);
    setCall({});
    setCallerSignal(null);
    setCallerId(null);
    if (receiverAudioRef.current) receiverAudioRef.current.pause();

    addCallLog({
      name: call?.callerName || 'Unknown',
      type: 'missed',
      image: selectedUser?.profilePic || selectedUser?.image || '',
      status: 'missed'
    });
  };

  const endCall = () => {
    if (socket && call && (call.from || selectedUser?._id)) {
      const to = call.from || selectedUser?._id;
      socket.emit('endCall', { to });
    }

    setCallStarted(false);
    setCallAccepted(false);
    setCalling(false);
    setReceivingCall(false);
    setCall({});
    setCallStartTime(null);
    setCallDuration('00:00');

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (callerAudioRef.current) callerAudioRef.current.pause();
    if (receiverAudioRef.current) receiverAudioRef.current.pause();

    addCallLog({
      name: selectedUser?.username || call?.callerName || 'Unknown',
      type: callAccepted ? (callStarted ? 'ended' : 'missed') : 'missed',
      image: selectedUser?.profilePic || selectedUser?.image || '',
      status: callAccepted ? 'ended' : 'missed'
    });
  };

  useEffect(() => {
    if (!socket) return;
    const handleIncomingCall = ({ from, signal, callerName }) => {
      setReceivingCall(true);
      setCall({ from, callerName });
      setCallerSignal(signal);
      setCallerId(from);
      if (receiverAudioRef.current) {
        receiverAudioRef.current.currentTime = 0;
        receiverAudioRef.current.play();
      }
    };
    socket.on('incomingCall', handleIncomingCall);
    return () => socket.off('incomingCall', handleIncomingCall);
  }, [socket]);

  useEffect(() => {
    let timer;
    if (callStarted && callStartTime) {
      timer = setInterval(() => {
        const diff = Math.floor((Date.now() - callStartTime) / 1000);
        const min = String(Math.floor(diff / 60)).padStart(2, '0');
        const sec = String(diff % 60).padStart(2, '0');
        setCallDuration(`${min}:${sec}`);
      }, 1000);
    } else {
      setCallDuration('00:00');
    }
    return () => clearInterval(timer);
  }, [callStarted, callStartTime]);

  useEffect(() => {
    if (!socket) return;
    const handleEndCall = () => {
      setCallStarted(false);
      setCallAccepted(false);
      setCalling(false);
      setReceivingCall(false);
      setCall({});
      setCallStartTime(null);
      setCallDuration('00:00');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (callerAudioRef.current) callerAudioRef.current.pause();
      if (receiverAudioRef.current) receiverAudioRef.current.pause(); // <-- Add this line
    };
    socket.on('endCall', handleEndCall);
    return () => socket.off('endCall', handleEndCall);
  }, [socket, stream]);

  useEffect(() => {
    if (!socket) return;
    const handleUsersInChat = (data) => setUsersInChat(data);
    socket.on('users_in_chat', handleUsersInChat);
    return () => socket.off('users_in_chat', handleUsersInChat);
  }, [socket]);

  useEffect(() => {
    if (!socket || !user || !selectedUser) return;
    socket.emit('in_chat', { userId: user._id, chatWith: selectedUser._id });
    return () => {
      socket.emit('left_chat', { userId: user._id });
    };
  }, [socket, user, selectedUser]);

  const handleCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setCapturedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: 100,
        right: 20,
        padding: '10px',
        background: connectionStatus === 'connected' ? 'green' : 'red',
        color: 'white',
        borderRadius: '5px',
        zIndex: 2000
      }}>
        Socket: {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
      </div>
      <Box sx={{
        height: '100vh',
        bgcolor: '#fdf4f4',
        position: 'relative',
        fontFamily: `'Poppins', sans-serif`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <AppBar
          position="fixed"
          sx={{
            bgcolor: '#fff',
            boxShadow: 'none',
            borderBottom: '1px solid #f1dcdc',
            zIndex: 1201
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <AnimatedTitle />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={handleNotificationClick}
                sx={{ p: 0.5 }}
              >
                <NotificationsIcon sx={{ color: hasNotification ? '#f06292' : '#000', width: 32, height: 32 }} />
              </IconButton>
              <IconButton
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ p: 0.5 }}
              >
                {user && user.profileImage ? (
                  <Avatar
                    src={user.profileImage.startsWith('data:') ? user.profileImage : `data:image/jpeg;base64,${user.profileImage}`}
                    sx={{ width: 36, height: 36 }}
                  />
                ) : (
                  <AccountCircleIcon sx={{ color: '#000', width: 36, height: 36 }} />
                )}
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    setBottomNav(4);
                  }}
                >
                  Account
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    localStorage.removeItem("user");
                    window.location.href = "/";
                  }}
                >
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            height: isMobile ? 'calc(100vh - 64px - 56px)' : 'calc(100vh - 64px)',
            display: 'flex',
            mt: '64px',
            overflow: 'auto'
          }}
        >
          {!isMobile && (
            <Box sx={{
              width: 80,
              bgcolor: '#fff',
              borderRight: '1px solid #f1dcdc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 2,
              gap: 2,
              boxShadow: '0px 2px 10px rgba(0,0,0,0.03)',
            }}>
              <IconButton
                color={bottomNav === 0 ? 'primary' : 'default'}
                onClick={() => { setBottomNav(0); setSelectedUser(null); }}
              >
                <ChatIcon />
              </IconButton>
              <IconButton
                color={bottomNav === 1 ? 'primary' : 'default'}
                onClick={() => { setBottomNav(1); setSelectedUser(null); }}
              >
                <PhoneIcon />
              </IconButton>
              <IconButton
                color={bottomNav === 2 ? 'primary' : 'default'}
                onClick={() => setBottomNav(2)}
              >
                <SearchIcon />
              </IconButton>
              <IconButton
                color={bottomNav === 3 ? 'primary' : 'default'}
                onClick={() => setBottomNav(3)}
              >
                <SettingsIcon />
              </IconButton>
            </Box>
          )}
          {bottomNav === 2 ? (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', mt: 2 }}>
              <SearchPage />
            </Box>
          ) : bottomNav === 3 ? (
            <Settings onBack={() => setBottomNav(0)} />
          ) : bottomNav === 4 ? (
            <UserProfile
              friendRequestsList={friendRequestsList}
              onAcceptFriend={handleAcceptFriend}
            />
          ) : bottomNav === 1 ? (
            // CALL LOGS TAB
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 3.5 }}>
              <Call callLogs={callLogs} />
            </Box>
          ) : (
            <>
              {showChatList && (
                <Box sx={{
                  width: { xs: '100%', md: '30%' },
                  bgcolor: '#fff',
                  p: 2,
                  overflowY: 'auto',
                  boxShadow: '0px 2px 10px rgba(0,0,0,0.03)',
                  borderRight: '1px solid #f1dcdc'
                }}>
                  <TextField
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search chats"
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      sx: {
                        borderRadius: 8,
                        bgcolor: '#fcecec',
                      }
                    }}
                  />
                  <List>
                    {sortedMembers.map((member, index) => (
                      <ListItem
                        button
                        key={index}
                        onClick={() => setSelectedUser(member)}
                        sx={{
                          borderRadius: 3,
                          mb: 1.5,
                          px: 2,
                          '&:hover': { bgcolor: '#ffecec' },
                          position: 'relative'
                        }}
                      >
                        <ListItemAvatar>
                          <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Avatar src={member.profilePic} sx={{ width: 48, height: 48 }} />
                            {/* New message indicator at bottom of profile avatar */}
                            {unread[member._id] && (!selectedUser || selectedUser._id !== member._id) && (
                              <Box sx={{
                                position: 'absolute',
                                bottom: 2,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                bgcolor: '#1976d2',
                                color: '#fff',
                                borderRadius: '10px',
                                px: 1,
                                py: 0.2,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                boxShadow: 1,
                                zIndex: 2,
                              }}>
                                New
                              </Box>
                            )}
                          </Box>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontWeight: 600 }}>{member.username}</Typography>
                              <Typography sx={{ fontSize: '0.85rem', color: member.online ? 'green' : 'red', ml: 2 }}>
                                {member.online ? 'Online' : 'Offline'}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
                              <Box>
                                {/* Remove old "New message" text from here */}
                              </Box>
                              <Box>
                                {messages[member._id] && messages[member._id].length > 0 && (
                                  <Typography sx={{ fontSize: '0.75rem', color: '#888', textAlign: 'right' }}>
                                    {messages[member._id][messages[member._id].length - 1].timestamp}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              {showChatPane && selectedUser && (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Paper elevation={0} sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: '#fff', mb: 1, justifyContent: 'space-between', borderBottom: '1px solid #f1dcdc' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        {/* Back Arrow Button */}
                        <IconButton
                          onClick={() => setSelectedUser(null)}
                          sx={{ mr: 1 }}
                        >
                          <ArrowBackIcon />
                        </IconButton>
                        <Avatar src={selectedUser.profilePic || selectedUser.image} sx={{ mr: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                          {selectedUser.username || selectedUser.name}
                        </Typography>
                      </Box>
                      {/* Show "In Chat" text if both users are inside the chatbox */}
                      {selectedUser &&
                        usersInChat[user?._id] === selectedUser._id &&
                        usersInChat[selectedUser._id] === user?._id && (
                          <Typography variant="caption" sx={{ color: '#1976d2', mt: 0.5 }}>
                            In Chat
                          </Typography>
                      )}
                    </Box>
                    <Box>
                      <Tooltip title="Call">
                        <IconButton onClick={() => initiateCall(selectedUser._id)}>
                          <PhoneIcon sx={{ color: '#000' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>

                  <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
                    {(messages[selectedUser._id] || []).map((msg, idx) => (
                      <Box key={idx} sx={{ mb: 2, textAlign: msg.sender === 'You' ? 'right' : 'left' }}>
                        <Paper sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 1,
                          borderRadius: 3,
                          bgcolor: msg.sender === 'You' ? '#ffdfdf' : '#f5f5f5',
                          maxWidth: '70%',
                        }}>
                          {msg.text && (
                            <Typography variant="body2">{msg.text}</Typography>
                          )}
                          {msg.image && (
                            <img src={msg.image} alt="sent-img" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: 5 }} />
                          )}
                          {msg.document && msg.documentData && (
                            <a
                              href={msg.documentData}
                              download={msg.document}
                              style={{ textDecoration: 'none' }}
                            >
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                📄 <strong>{msg.document}</strong>
                              </Typography>
                            </a>
                          )}
                          {msg.document && !msg.documentData && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              📄 <strong>{msg.document}</strong>
                            </Typography>
                          )}
                          {msg.contact && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2">📱 <strong>{msg.contact.name}</strong></Typography>
                              <Typography variant="caption">{msg.contact.phone}</Typography>
                            </Box>
                          )}
                          {msg.audio && (
                            <audio controls src={msg.audio} style={{ marginTop: 5, width: '100%' }} />
                          )}

                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#aaa' }}>{msg.timestamp}</Typography>
                        </Paper>
                      </Box>
                    ))}
                    {otherTyping && (
                      <Typography variant="caption" sx={{ color: '#888', ml: 2 }}>
                        {selectedUser.name} is typing...
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{
                    p: 1.5,
                    borderTop: '1px solid #f1dcdc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    bgcolor: '#fff',
                    position: isMobile ? 'fixed' : 'relative',
                    bottom: 0,
                    left: 0,
                    width: isMobile ? '100%' : 'auto',
                    zIndex: 1200,
                    boxShadow: '0px -2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <Box sx={{ position: 'relative' }}>
                      <IconButton onClick={() => setShowAttachments(!showAttachments)}>
                        <AddIcon />
                      </IconButton>
                      {showAttachments && (
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 0,
                            bottom: '60px',
                            zIndex: 1300,
                            width: 200,
                            bgcolor: '#fff',
                            boxShadow: 3,
                            borderRadius: 2,
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            alignItems: 'stretch',
                          }}
                        >
                          <Card
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#fcecec' }
                            }}
                          >
                            <IconButton component="label" sx={{ mr: 2 }}>
                              <ImageIcon sx={{ color: '#ff4d4d' }} />
                              <input
                                hidden
                                accept="image/*"
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleSendImage(file);
                                  setShowAttachments(false);
                                }}
                              />
                            </IconButton>
                            <Typography variant="body2">Image</Typography>
                          </Card>
                          <Card
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#fcecec' }
                            }}
                          >
                            <IconButton component="label" sx={{ mr: 2 }}>
                              <DocumentIcon sx={{ color: '#1976d2' }} />
                              <input
                                hidden
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleSendDocument(file);
                                  setShowAttachments(false);
                                }}
                              />
                            </IconButton>
                            <Typography variant="body2">Document</Typography>
                          </Card>
                          <Card
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              p: 1,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#fcecec' }
                            }}
                            onClick={() => {
                              if (selectedUser) {
                                const dummyContact = {
                                  name: 'John Doe',
                                  phone: '+91 9876543210',
                                  date: formatDate(new Date()),
                                };
                                setMessages(prev => {
                                  const updatedMessages = { ...prev };
                                  if (!updatedMessages[selectedUser._id]) updatedMessages[selectedUser._id] = [];
                                  updatedMessages[selectedUser._id].push({
                                    sender: 'You',
                                    contact: dummyContact,
                                    timestamp: formatTime(new Date()),
                                    date: formatDate(new Date()),
                                  });
                                  return updatedMessages;
                                });
                                setShowAttachments(false);
                              }
                            }}
                          >
                            <ContactIcon sx={{ color: '#4caf50', mr: 2 }} />
                            <Typography variant="body2">Contact</Typography>
                          </Card>
                         
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ position: 'relative', flex: 1 }}>
                      <TextField
                        value={message}
                        onChange={handleTyping}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message"
                        multiline
                        maxRows={4}
                        variant="outlined"
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <InsertEmoticonIcon
                                sx={{ cursor: 'pointer', color: '#888' }}
                                onClick={() => setShowEmojiPicker((prev) => !prev)}
                              />
                            </InputAdornment>
                          ),
                          sx: {
                            borderRadius: 8,
                            bgcolor: '#fcecec',
                            px: 2,
                            border: 'none',
                          },
                        }}
                      />

                      {showEmojiPicker && (
                        <Box sx={{ position: 'absolute', bottom: '60px', left: 0, zIndex: 1000 }}>
                          <Picker
                            data={data}
                            onEmojiSelect={(emoji) => {
                              setMessage((prev) => prev + emoji.native);
                              setShowEmojiPicker(false);
                            }}
                            theme="light"
                            maxFrequentRows={2}
                          />
                        </Box>
                      )}
                    </Box>

                    {message.trim() ? (
                      <IconButton onClick={handleSendMessage}>
                        <SendIcon sx={{ color: '#ff4d4d' }} />
                      </IconButton>
                    ) : isRecording ? (
                      <IconButton onClick={handleMicClick}>
                        <SendIcon sx={{ color: '#ff4d4d' }} />
                      </IconButton>
                    ) : (
                      <IconButton onClick={handleMicClick}>
                        <MicIcon sx={{ color: '#999' }} />
                      </IconButton>
                    )}
                    {audioBlob && !isRecording && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={handleSendAudio}
                      >
                        Send Audio
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>

        {isMobile && (
          <BottomNavigation
            showLabels
            value={bottomNav}
            onChange={(event, newValue) => {
              // If leaving chat pane, emit left_chat
              if (
                socket &&
                user &&
                selectedUser &&
                (newValue !== 0) // 0 is the chat tab
              ) {
                socket.emit('left_chat', { userId: user._id });
                setSelectedUser(null);
              }
              setBottomNav(newValue);
            }}
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              width: '100%',
              borderTop: '1px solid #eee',
              bgcolor: '#fff',
              boxShadow: '0px -2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <BottomNavigationAction label="Chats" icon={<ChatIcon />} />
            <BottomNavigationAction label="Call" icon={<PhoneIcon />} />
            <BottomNavigationAction label="Search" icon={<SearchIcon />} />
            <BottomNavigationAction
              label="Settings"
              icon={<SettingsIcon />}
              onClick={() => setBottomNav(3)}
            />
          </BottomNavigation>
        )}
      </Box>

      <Dialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
          <Avatar
            src={
              profileDialogUser?.profileImage
                ? (profileDialogUser.profileImage.startsWith('data:')
                  ? profileDialogUser.profileImage
                  : `data:image/jpeg;base64,${profileDialogUser.profileImage}`)
                : (profileDialogUser?.profilePic || profileDialogUser?.image)
            }
            sx={{ width: 100, height: 100, mb: 2, bgcolor: '#f8bbd0', border: '3px solid #ec407a', fontSize: 40 }}
          />
          {profileDialogUser?.about && (
            <Box sx={{ bgcolor: '#fff0f4', borderRadius: 2, p: 2, width: '100%', mb: 2 }}>
              <Typography fontWeight={500} sx={{ mb: 1 }}>About</Typography>
              <Typography fontSize={14}>{profileDialogUser.about}</Typography>
            </Box>
          )}
          <Button
            onClick={() => setProfileDialogOpen(false)}
            sx={{
              mt: 2,
              color: '#ec407a',
              background: '#fff',
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: 1,
              '&:hover': { background: '#ffe4ec' }
            }}
            fullWidth
          >
            Close
          </Button>
        </Box>
      </Dialog>

      {/* Incoming Call Dialog */}
      {receivingCall && !callAccepted && (
        <Dialog
          open
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              bgcolor: 'linear-gradient(135deg, #3a5ba0 0%, #4f8edc 100%)',
              position: 'relative',
              p: 0,
            }
          }}
        >
          <Box sx={{
            height: '100vh',
            width: { xs: '100vw', sm: 400, md: 500 }, // wider on desktop
            maxWidth: '90vw',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            pb: 10,
          }}>
            <Avatar sx={{ width: 100, height: 100, bgcolor: '#fff', color: '#3a5ba0', fontSize: 60, mb: 2 }}>
              {call?.callerName?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="h6" fontWeight={600} sx={{ color: '#fff', mb: 1 }}>
              {call.callerName}
            </Typography>
            <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
              Incoming Call...
            </Typography>
            <Typography variant="body2" sx={{ color: '#fff', mb: 3 }}>
              {callDuration}
            </Typography>
            {/* Bottom Buttons */}
            <Box sx={{
              position: 'absolute',
              bottom: 40,
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
            }}>
              <Button
                onClick={rejectCall}
                sx={{
                  minWidth: 0,
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: '#f44336',
                  color: '#fff',
                  fontSize: 28,
                  boxShadow: 3,
                  '&:hover': { bgcolor: '#d32f2f' }
                }}
              >
                <PhoneIcon sx={{ transform: 'rotate(135deg)' }} />
              </Button>
              <Button
                onClick={answerCall}
                sx={{
                  minWidth: 0,
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: '#4caf50',
                  color: '#fff',
                  fontSize: 28,
                  boxShadow: 3,
                  '&:hover': { bgcolor: '#388e3c' }
                }}
              >
                <PhoneIcon />
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}

      {/* Outgoing Call Dialog */}
      {calling && !callAccepted && (
        <Dialog
          open
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              bgcolor: 'linear-gradient(135deg, #3a5ba0 0%, #4f8edc 100%)',
              position: 'relative',
              p: 0,
            }
          }}
        >
          <Box sx={{
            height: '100vh',
            width: { xs: '100vw', sm: 400, md: 500 }, // wider on desktop
            maxWidth: '90vw',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            pb: 10,
          }}>
            <Avatar sx={{ width: 100, height: 100, bgcolor: '#fff', color: '#3a5ba0', fontSize: 60, mb: 2 }}>
              {selectedUser?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="h6" fontWeight={600} sx={{ color: '#fff', mb: 1 }}>
              {selectedUser?.username || selectedUser?.name}
            </Typography>
            <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
              Calling...
            </Typography>
            <Typography variant="body2" sx={{ color: '#fff', mb: 3 }}>
              {callDuration}
            </Typography>
            {/* Bottom End Call Button */}
            <Box sx={{
              position: 'absolute',
              bottom: 40,
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <Button
                onClick={endCall}
                sx={{
                  minWidth: 0,
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: '#f44336',
                  color: '#fff',
                  fontSize: 28,
                  boxShadow: 3,
                  '&:hover': { bgcolor: '#d32f2f' }
                }}
              >
                <PhoneIcon sx={{ transform: 'rotate(135deg)' }} />
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}

      {/* In-Call Dialog */}
      {callAccepted && callStarted && (
        <Dialog
          open
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              bgcolor: 'linear-gradient(135deg, #3a5ba0 0%, #4f8edc 100%)',
              position: 'relative',
              p: 0,
            }
          }}
        >
          <Box sx={{
            height: '100vh',
            width: '100vw',
            maxWidth: isMobile ? '100vw' : 500,
            margin: '0 auto',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            pb: 10,
            gap: isMobile ? 2 : 4,
          }}>
            {/* REMOVE THESE VIDEO TAGS */}
            {/* <video ref={myVideo} autoPlay muted ... /> */}
            {/* <video ref={userVideo} autoPlay ... /> */}
            {/* Instead, you can show an avatar or call status */}
            <Avatar sx={{ width: 100, height: 100, bgcolor: '#fff', color: '#3a5ba0', fontSize: 60, mb: 2 }}>
              {selectedUser?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="h6" fontWeight={600} sx={{ color: '#fff', mb: 1 }}>
              {selectedUser?.username || selectedUser?.name}
            </Typography>
            <Typography variant="body1" sx={{ color: '#fff', mb: 1 }}>
              {callDuration}
            </Typography>
            {/* Bottom End Call Button */}
            <Box sx={{
              position: 'absolute',
              bottom: 40,
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <Button
                onClick={endCall}
                sx={{
                  minWidth: 0,
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: '#f44336',
                  color: '#fff',
                  fontSize: 28,
                  boxShadow: 3,
                  '&:hover': { bgcolor: '#d32f2f' }
                }}
              >
                <PhoneIcon sx={{ transform: 'rotate(135deg)' }} />
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}

      

      <audio ref={callerAudioRef} src={callerAudioFile} loop />
      <audio ref={receiverAudioRef} src={receiverAudioFile} loop />
      <audio ref={remoteAudioRef} autoPlay />

      {selectedUser &&
        usersInChat[user?._id] === selectedUser._id &&
        Object.entries(usersInChat).some(([uid, chatWith]) =>
          uid !== user._id && chatWith === user._id
        ) && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              src={selectedUser.profilePic || selectedUser.image}
              sx={{ width: 32, height: 32, mr: 1 }}
            />
            <Typography variant="caption" sx={{ color: '#1976d2' }}>
              {selectedUser.username || selectedUser.name} is viewing this chat
            </Typography>
          </Box>
      )}
    </>
  );
};

function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

export default ChatPage;