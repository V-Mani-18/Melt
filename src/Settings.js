import React from 'react';
import {
  Box,
  Typography,
  Switch,
  IconButton,
  Divider,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';



const settingsSections = [
  {
    title: 'Notifications',
    items: [
      {
        label: 'Message Notifications',
        desc: 'Receive notifications for new messages, group chats, and mentions.',
        type: 'switch',
        key: 'messageNotifications'
      },
      {
        label: 'Reaction Notifications',
        desc: 'Get notified when someone reacts to your messages or posts.',
        type: 'switch',
        key: 'reactionNotifications'
      },
      {
        label: 'Friend Request Notifications',
        desc: 'Receive alerts for new friend requests and invitations.',
        type: 'switch',
        key: 'friendRequestNotifications'
      }
    ]
  },
  {
    title: 'Privacy',
    items: [
      {
        label: 'Profile Visibility',
        desc: 'Control who can see your profile information and activity status.',
        type: 'link'
      },
      {
        label: 'Blocked Users',
        desc: 'Manage blocked users and prevent unwanted interactions.',
        type: 'link'
      },
      {
        label: 'Message Encryption',
        desc: 'Enable end-to-end encryption for your messages.',
        type: 'switch',
        key: 'messageEncryption'
      }
    ]
  },
  {
    title: 'Account',
    items: [
      {
        label: 'Edit Profile',
        desc: 'Update your profile picture, name, and bio.',
        type: 'link'
      },
      {
        label: 'Security Settings',
        desc: 'Change your password or enable two-factor authentication.',
        type: 'link'
      },
      {
        label: 'Subscription',
        desc: 'Manage your subscription plan and payment methods.',
        type: 'link'
      }
    ]
  }
];

const initialSwitchState = {
  messageNotifications: false,
  reactionNotifications: false,
  friendRequestNotifications: false,
  messageEncryption: false
};

const Settings = ({ onBack }) => {
  const [switchState, setSwitchState] = React.useState(initialSwitchState);
  const [blockedUsers, setBlockedUsers] = React.useState([]);
  const [showBlocked, setShowBlocked] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const handleSwitch = (key) => {
    setSwitchState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchBlockedUsers = async () => {
    const res = await fetch(`http://localhost:5000/api/user/${userId}/blocked`);
    const data = await res.json();
    setBlockedUsers(data);
  };

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        bgcolor: '#fff6f8',
        fontFamily: `'Poppins', sans-serif`,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flex: 1,
          width: '100%',
          height: 'calc(100vh - 64px)', // Adjust if AppBar is different height
          bgcolor: '#fff',
          borderRadius: 0,
          boxShadow: 'none',
          overflowY: 'auto',
          p: { xs: 2, sm: 4 },
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={onBack} sx={{ color: '#f06292', mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 600, color: '#222' }}>
            Settings
          </Typography>
        </Box>

        {/* Sections */}
        {settingsSections.map((section) => (
          <Box key={section.title} sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#f06292',
                fontWeight: 600,
                mb: 1,
                fontSize: '1rem',
                letterSpacing: 0.5
              }}
            >
              {section.title}
            </Typography>
            <Box>
              {section.items.map((item, i) => (
                <Box key={item.label}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      py: 1.2
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 500, color: '#222', fontSize: '1rem' }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ color: '#888', fontSize: '0.92rem', mt: 0.2 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                    {item.type === 'switch' ? (
                      <Switch
                        checked={switchState[item.key]}
                        onChange={() => handleSwitch(item.key)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#f06292'
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            bgcolor: '#f8bbd0'
                          }
                        }}
                      />
                    ) : (
                      <IconButton
  sx={{ color: '#f06292', mt: 0.5 }}
  onClick={() => {
    if (item.label === 'Edit Profile') {
      navigate('/profile');
    } else if (item.label === 'Blocked Users') {
      navigate('/blocked-users');
    }
  }}
>
  <ArrowForwardIosIcon fontSize="small" />
</IconButton>

                    )}
                  </Box>
                  {i < section.items.length - 1 && (
                    <Divider sx={{ bgcolor: '#f8bbd0', opacity: 0.3 }} />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Blocked Users Dialog */}
      {showBlocked && (
        <Dialog open={showBlocked} onClose={() => setShowBlocked(false)}>
          <DialogTitle>Blocked Users</DialogTitle>
          <DialogContent>
            {blockedUsers.length === 0 ? (
              <Typography>No blocked users.</Typography>
            ) : (
              blockedUsers.map(u => (
                <Box key={u.userId} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar src={u.profilePic} sx={{ mr: 1 }} />
                  <Typography>{u.username}</Typography>
                  {/* Optionally add Unblock button here */}
                </Box>
              ))
            )}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default Settings;
