import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tabs,
  Tab,
  Badge,
  IconButton,
  useMediaQuery,
  useTheme,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import getCroppedImg from './utils/cropImage'; // We'll create this utility below



const UserProfile = ({ friendRequestsList = [], onAcceptFriend }) => {
  const [about, setAbout] = useState('');
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  const isMobile = useMediaQuery('(max-width:768px)');
  const [friends, setFriends] = useState([]);
  const [user, setUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [editingImg, setEditingImg] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    action: null, // 'remove' or 'block'
    friend: null,
  });

 useEffect(() => {
  const userId = localStorage.getItem('userId');
  if (userId) {
    // Fetch user info
    fetch(`http://localhost:5000/api/user/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data));
    // Fetch friends
    fetch(`http://localhost:5000/api/user/${userId}/friends`)
      .then(res => res.json())
      .then(data => setFriends(data));
    // Fetch friend requests from backend
    fetch(`http://localhost:5000/api/user/${userId}/friendRequests`)
      .then(res => res.json())
      .then(data => setPendingRequests(data)); // <-- This sets friendRequests from backend
  }
}, []);

useEffect(() => {
  async function fetchAvatars() {
    const filtered = friendRequestsList.filter(req => req.receiverId === (user && user._id));
    const requestsWithImages = await Promise.all(filtered.map(async req => {
      // Fetch sender's profile to get profileImage and username
      const res = await fetch(`http://localhost:5000/api/user/${req.senderId}`);
      const sender = await res.json();
      return {
        name: sender.name, // Use sender's name from DB
        username: sender.username, // Add sender's username from DB
        avatar: sender.profileImage || `https://i.pravatar.cc/150?u=${req.senderId}`,
        status: 'pending',
        online: false,
        _id: req.senderId,
        requestId: req.requestId || req._id
      };
    }));
    setPendingRequests(requestsWithImages);
  }
  if (user) fetchAvatars();
}, [friendRequestsList, user]);


  // Show only requests where receiverId matches current user
  const filteredPendingRequests = friendRequestsList
  .filter(req => req.receiverId === (user && user._id))
  .map(req => ({
    name: req.senderUsername,
    avatar: req.profileImage || `https://i.pravatar.cc/150?u=${req.senderId}`,
    status: 'pending',
    online: false,
    _id: req.senderId,
    requestId: req.requestId || req._id // support both local and db
  }));

  // Accept/reject friend request (DB and UI)
 const handleRequestAction = async (req, action) => {
  const userId = user && user._id;
  if (!userId) return;
  if (action === 'accept') {
    await fetch(`http://localhost:5000/api/friendRequests/${req.senderId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: userId }),
    });
  } else if (action === 'reject') {
    await fetch(`http://localhost:5000/api/friendRequests/${req.senderId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: userId }),
    });
  }
  // Re-fetch lists
  fetch(`http://localhost:5000/api/user/${userId}/friends`)
    .then(res => res.json())
    .then(data => setFriends(data));
  fetch(`http://localhost:5000/api/user/${userId}/friendRequests`)
    .then(res => res.json())
    .then(data => setPendingRequests(data));
};
  // Remove friend from friends list and DB
  const handleRemoveFriend = async (friendId) => {
    setFriends(prev => prev.filter(f => f._id !== friendId));
    try {
      const userId = user && user._id;
      if (userId && friendId) {
        await fetch(`http://localhost:5000/api/user/${userId}/remove-friend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ friendId }),
        });
      }
    } catch (err) {
      // handle error
    }
  };

  const handleRemoveProfileImage = async () => {
    const userId = localStorage.getItem('userId');
    await fetch(`http://localhost:5000/api/user/${userId}/profile-image`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileImage: '' }),
    });
    setUser(prev => ({ ...prev, profileImage: '' }));
    setEditingImg(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const userId = localStorage.getItem('userId');
    try {
      const res = await fetch(`http://localhost:5000/api/user/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        localStorage.removeItem('userId');
        window.location.href = '/'; // Redirect to home or login
      } else {
        alert('Failed to delete account');
      }
    } catch (err) {
      alert('Server error');
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeleteInput('');
  };

  useEffect(() => {
    if (user && user.about) {
      setAbout(user.about);
    }
  }, [user]);

  // Fetch blocked users on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    fetch(`http://localhost:5000/api/user/${userId}/blocked`)
      .then(res => res.json())
      .then(data => setBlockedUsers(data.map(u => u.userId)));
  }, []);

  const visibleFriends = friends.filter(f => !blockedUsers.includes(f._id));

  if (!user) return <Typography>Loading...</Typography>;

  return (
    <Box
      sx={{
        width: '100%',
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
        bgcolor: '#fff6f8',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Poppins, sans-serif',
        padding: isMobile ? '1rem' : '2rem'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '2rem',
          width: '100%',
          height: '100%',
          bgcolor: '#ffffff',
          borderRadius: 3,
        }}
      >
        {/* Profile Card */}
        <Box
          sx={{
            flex: 1,
            bgcolor: '#fff',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            border: '1px solid #f8bbd0',
            position: 'relative'
          }}
        >
          <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: '#f8bbd0',
                fontSize: 32,
                border: '2px solid #ec407a',
                cursor: 'pointer', // Make it look clickable
                transition: 'box-shadow 0.2s',
                boxShadow: '0 2px 8px rgba(236,64,122,0.15)',
                '&:hover': { boxShadow: '0 4px 16px rgba(236,64,122,0.25)' }
              }}
              src={
                user.profileImage
                  ? user.profileImage.startsWith('data:')
                    ? user.profileImage
                    : `data:image/jpeg;base64,${user.profileImage}`
                  : undefined
              }
              onClick={() => setPreviewOpen(true)}
            >
              {!user.profileImage && user.name[0]}
            </Avatar>
            {/* Pen icon absolutely positioned on avatar border */}
            <IconButton
              size="small"
              onClick={() => setEditingImg(prev => !prev)}
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                bgcolor: '#fff',
                border: '2px solid #ec407a',
                color: '#ec407a',
                zIndex: 2,
                boxShadow: 1,
                '&:hover': { bgcolor: '#ffe4ec' }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
          {/* Show upload/remove buttons below avatar, not inside avatar box */}
          {editingImg && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 1,
                mt: 2,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={handleRemoveProfileImage}
              >
                Remove
              </Button>
              <Button
                size="small"
                variant="contained"
                component="label"
                sx={{ bgcolor: '#ec407a', color: '#fff', '&:hover': { bgcolor: '#d81b60' } }}
              >
                Upload
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedImage(URL.createObjectURL(e.target.files[0]));
                      setCropModalOpen(true);
                    }
                  }}
                />
              </Button>
            </Box>
          )}
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={600}>{user.name}</Typography>
            <Typography variant="body2" color="text.secondary">@{user.username}</Typography>
          </Box>

          {/* About Section */}
          <Box width="100%">
            <Typography variant="subtitle1" fontWeight={600} mb={1}>About</Typography>
            {editing ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  value={about}
                  onChange={e => setAbout(e.target.value)}
                  size="small"
                  multiline
                  rows={3}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: '#fff6f6',
                      fontFamily: 'Poppins'
                    }
                  }}
                />
                <Button
                  onClick={async () => {
                    // Limit to 60 words
                    if (about.split(/\s+/).length > 60) {
                      alert('About section must be 60 words or less.');
                      return;
                    }
                    const userId = user && user._id;
                    await fetch(`http://localhost:5000/api/user/${userId}/about`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ about }),
                    });
                    setUser(prev => ({ ...prev, about }));
                    setEditing(false);
                  }}
                  sx={{
                    alignSelf: 'flex-end',
                    backgroundColor: '#ec407a',
                    color: 'white',
                    borderRadius: 2,
                    px: 3,
                    '&:hover': { backgroundColor: '#d81b60' }
                  }}
                >
                  Save
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  backgroundColor: '#fff0f4',
                  padding: '1rem',
                  borderRadius: 2,
                  position: 'relative'
                }}
              >
                <Typography fontSize={14}>{about}</Typography>
                <IconButton
                  size="small"
                  onClick={() => setEditing(true)}
                  sx={{ position: 'absolute', top: 4, right: 4, color: '#888' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>

          {/* Details */}
          <Box width="100%">
            <Typography variant="subtitle1" fontWeight={600} mb={1}>Details</Typography>
            <Box sx={{ backgroundColor: '#fff0f4', borderRadius: 2, padding: '1rem' }}>
              <Typography fontSize={14}><strong>Email:</strong> {user.email}</Typography>
              <Typography fontSize={14}><strong>Phone:</strong> {user.phone}</Typography>
              <Typography fontSize={14}><strong>Gender:</strong> {user.gender}</Typography>
            </Box>
          </Box>

          {/* Delete Account Button */}
          <Button
            variant="outlined"
            color="error"
            sx={{
              mt: 2,
              borderColor: '#ec407a',
              color: '#ec407a',
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#fce4ec',
                borderColor: '#d81b60',
                color: '#d81b60'
              }
            }}
            onClick={() => setDeleteDialogOpen(true)}
            fullWidth
          >
            Delete Account
          </Button>
        </Box>

        {/* Friends / Requests */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #f8bbd0',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newVal) => setActiveTab(newVal)}
            variant="fullWidth"
            sx={{
              mb: 2,
              '& .MuiTabs-indicator': {
                backgroundColor: '#ec407a'
              }
            }}
          >
            <Tab label="FRIENDS" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab label="REQUEST" sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>

          <List sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
            {(activeTab === 0
              ? friends.filter(friend => friend.username && friend.username !== 'Unknown')
              : pendingRequests // <-- This is correct!
            ).map((friend, index) => (
              <ListItem key={friend.senderId || friend._id || index} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    variant="dot"
                    color={'default'}
                  >
                    <Avatar
                      src={
                        activeTab === 0
                          ? friend.profilePic || `https://i.pravatar.cc/150?u=${friend._id}`
                          : friend.senderProfilePic || `https://i.pravatar.cc/150?u=${friend.senderId}`
                      }
                    />
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    activeTab === 0
                      ? friend.username || 'Unknown'
                      : friend.senderUsername || 'Unknown'
                  }
                  secondary={
                    activeTab === 0
                      ? `@${friend.username || ''}`
                      : `@${friend.senderUsername || ''} - Friend request`
                  }
                  primaryTypographyProps={{ fontWeight: 500 }}
                  secondaryTypographyProps={{ fontSize: 12, color: '#888' }}
                />
                {activeTab === 1 && (
                  <Box>
                    <IconButton
                      onClick={() => handleRequestAction(friend, 'accept')}
                      sx={{ color: 'green' }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleRequestAction(friend, 'reject')}
                      sx={{ color: 'red' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                {activeTab === 0 && (
                  <Box>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      sx={{
                        ml: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: '#ff1744',
                        '&:hover': { bgcolor: '#d50000' }
                      }}
                      onClick={() => setConfirmDialog({ open: true, action: 'remove', friend })}
                    >
                      Remove
                    </Button>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      sx={{
                        ml: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: '#ff9100',
                        color: '#fff',
                        '&:hover': { bgcolor: '#ff6d00' }
                      }}
                      onClick={() => setConfirmDialog({ open: true, action: 'block', friend })}
                    >
                      Block
                    </Button>
                  </Box>
                )}
              </ListItem>
            ))}
            {(activeTab === 0
              ? friends
                  .filter(f => f.status === 'accepted')
                  .filter(f => f.name && f.name !== 'Unknown' && f.username && f.username !== 'Unknown')
              : pendingRequests
            ).length === 0 && (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body2" color="#888">
                  {activeTab === 0 ? 'No friends yet' : 'No pending requests'}
                </Typography>
                {activeTab === 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    sx={{
                      mt: 2,
                      color: '#ec407a',
                      borderColor: '#ec407a',
                      '&:hover': {
                        backgroundColor: '#fce4ec',
                        borderColor: '#d81b60'
                      }
                    }}
                  >
                    Add Friends
                  </Button>
                )}
              </Box>
            )}
          </List>
        </Box>
      </Paper>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: '#ec407a', fontWeight: 700 }}>
          Confirm Account Deletion
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Type <b>Delete My Account</b> to confirm. This action cannot be undone.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            value={deleteInput}
            onChange={e => setDeleteInput(e.target.value)}
            placeholder="Delete My Account"
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#fff6f6',
                fontFamily: 'Poppins'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              color: '#888',
              borderRadius: 2,
              textTransform: 'none'
            }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            sx={{
              bgcolor: '#ec407a',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: '#d81b60' }
            }}
            disabled={deleteInput !== 'Delete My Account' || deleting}
          >
            {deleting ? 'Deleting...' : 'OK'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cropper Dialog */}
      <Dialog open={cropModalOpen} onClose={() => setCropModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#ec407a' }}>Crop Profile Photo</DialogTitle>
        <DialogContent sx={{ position: 'relative', height: 300, bgcolor: '#222' }}>
          {selectedImage && (
            <Cropper
              image={selectedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
            />
          )}
        </DialogContent>
        <Box sx={{ px: 3, py: 1 }}>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(_, value) => setZoom(value)}
            sx={{ color: '#ec407a' }}
          />
        </Box>
        <DialogActions>
          <Button onClick={() => setCropModalOpen(false)} sx={{ color: '#888' }}>Cancel</Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#ec407a', color: '#fff', '&:hover': { bgcolor: '#d81b60' } }}
            onClick={async () => {
              const croppedImage = await getCroppedImg(selectedImage, croppedAreaPixels);
              // Now upload croppedImage (as base64)
              const userId = localStorage.getItem('userId');
              await fetch(`http://localhost:5000/api/user/${userId}/profile-image`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileImage: croppedImage }),
              });
              setUser(prev => ({ ...prev, profileImage: croppedImage }));
              setCropModalOpen(false);
              setEditingImg(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="xs"
        PaperProps={{
          sx: {
            background: 'transparent',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 0,
            m: 0
          }}
        >
          <Avatar
            src={
              user.profileImage
                ? user.profileImage.startsWith('data:')
                  ? user.profileImage
                  : `data:image/jpeg;base64,${user.profileImage}`
                : undefined
            }
            sx={{
              width: 220,
              height: 220,
              bgcolor: '#f8bbd0',
              border: '4px solid #ec407a',
              boxShadow: '0 8px 32px rgba(236,64,122,0.25)',
              fontSize: 80
            }}
          >
            {!user.profileImage && user.name[0]}
          </Avatar>
          <Button
            onClick={() => setPreviewOpen(false)}
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
          >
            Close
          </Button>
        </Box>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}>
        <DialogTitle sx={{ fontWeight: 700, color: '#ec407a' }}>
          {confirmDialog.action === 'remove' ? 'Remove Friend' : 'Block Friend'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {confirmDialog.action} <b>{confirmDialog.friend?.username}</b>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            sx={{ borderRadius: 2, textTransform: 'none', color: '#888' }}
          >
            No
          </Button>
          <Button
            onClick={async () => {
              if (confirmDialog.action === 'remove') {
                await handleRemoveFriend(confirmDialog.friend._id);
              } else if (confirmDialog.action === 'block') {
                const userId = user && user._id;
                if (userId && confirmDialog.friend._id) {
                  await fetch(`http://localhost:5000/api/user/${userId}/block`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blockUserId: confirmDialog.friend._id }),
                  });
                  setFriends(prev => prev.filter(f => f._id !== confirmDialog.friend._id));
                }
              }
              setConfirmDialog({ open: false, action: null, friend: null });
            }}
            color={confirmDialog.action === 'remove' ? 'error' : 'warning'}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: confirmDialog.action === 'remove' ? '#ff1744' : '#ff9100',
              color: '#fff',
              '&:hover': {
                bgcolor: confirmDialog.action === 'remove' ? '#d50000' : '#ff6d00'
              }
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;
