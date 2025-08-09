import React, { useState } from 'react';
import { Box, Typography, Avatar, Button, IconButton, Card, CardContent, Dialog, DialogActions, DialogContent, DialogContentText } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const BlockedUsersPage = () => {
  const [blockedUsers, setBlockedUsers] = React.useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  React.useEffect(() => {
    fetch(`http://localhost:5000/api/user/${userId}/blocked`)
      .then(res => res.json())
      .then(data => setBlockedUsers(data));
  }, [userId]);

  const handleUnblockClick = (user) => {
    setSelectedUser(user);
    setConfirmOpen(true);
  };

  const handleUnblockConfirm = async () => {
    if (!selectedUser) return;
    await fetch(`http://localhost:5000/api/user/${userId}/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unblockUserId: selectedUser.userId }),
    });
    setBlockedUsers(prev => prev.filter(u => u.userId !== selectedUser.userId));
    setConfirmOpen(false);
    setSelectedUser(null);
  };

  const handleUnblockCancel = () => {
    setConfirmOpen(false);
    setSelectedUser(null);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: '#f06292', mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Blocked Users</Typography>
      </Box>
      {blockedUsers.length === 0 ? (
        <Typography>No blocked users.</Typography>
      ) : (
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {blockedUsers.map(u => (
                <Box key={u.userId} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar src={u.profilePic} sx={{ mr: 2, width: 48, height: 48 }} />
                  <Typography sx={{ flex: 1, fontWeight: 500 }}>{u.username}</Typography>
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ borderRadius: 5, textTransform: 'none', fontWeight: 600 }}
                    onClick={() => handleUnblockClick(u)}
                  >
                    Unblock
                  </Button>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onClose={handleUnblockCancel}>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unblock <b>{selectedUser?.username}</b>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUnblockCancel} color="inherit" sx={{ borderRadius: 5 }}>No</Button>
          <Button onClick={handleUnblockConfirm} color="success" variant="contained" sx={{ borderRadius: 5 }}>Yes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlockedUsersPage;