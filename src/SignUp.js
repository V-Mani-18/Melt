import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  useMediaQuery,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AnimatedTitle from './AnimatedTitle';
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import Slide from "@mui/material/Slide";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function SignUpPage() {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: '',
    idProof: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [profilePreview, setProfilePreview] = useState('');
  const [popup, setPopup] = useState({
    open: false,
    success: false,
    message: "",
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, idProof: e.target.files[0] });
  };

  const handleSendOtp = async () => {
    if (!form.phone) {
      showPopup(false, 'Please enter a phone number');
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await fetch('http://localhost:5000/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowOtpModal(true);
        showPopup(true, 'OTP sent successfully!');
      } else {
        showPopup(false, data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      showPopup(false, 'Please enter the OTP');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsPhoneVerified(true);
        setShowOtpModal(false);
        showPopup(true, 'Phone number verified successfully!');
      } else {
        showPopup(false, data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  // Convert image to base64
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result); // base64 string
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isPhoneVerified) {
      showPopup(false, 'Please verify your phone number first');
      return;
    }

    if (form.password !== form.confirmPassword) {
      showPopup(false, 'Passwords do not match');
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'idProof') {
          if (form[key]) formData.append(key, form[key]);
        } else {
          formData.append(key, form[key]);
        }
      });
      // Add base64 image string
      formData.append('profileImage', profileImage);

      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showPopup(true, data.message || 'Registered successfully!');
        navigate('/');
      } else {
        showPopup(false, data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

  const showPopup = (success, message) => {
    setPopup({ open: true, success, message });
    setTimeout(() => setPopup((p) => ({ ...p, open: false })), 2000);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#fff8f8',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: `'Poppins', sans-serif`,
      }}
    >
      <Box
        sx={{
          width: isMobile ? '90%' : '80%',
          maxWidth: '1200px',
          bgcolor: '#fff',
          p: 4,
          borderRadius: 4,
          boxShadow: 3,
          textAlign: 'center',
        }}
      >
        <AnimatedTitle sx={{ mb: 1 }} />
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          Sign Up
        </Typography>

        {/* Add Profile Button */}
        <Button
          variant="outlined"
          sx={{
            mb: 2,
            borderColor: '#ec407a',
            color: '#ec407a',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#fce4ec',
              borderColor: '#d81b60',
              color: '#d81b60'
            }
          }}
          onClick={() => setProfileOpen(true)}
        >
          Add Profile
        </Button>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Name + Username */}
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            <TextField fullWidth label="Full Name" name="name" value={form.name} onChange={handleChange} required sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }} />
            <TextField fullWidth label="Username" name="username" value={form.username} onChange={handleChange} required sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }} />
          </Box>

          {/* Email + Phone */}
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            <TextField fullWidth label="Email" name="email" type="email" value={form.email} onChange={handleChange} required sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }} />
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      onClick={handleSendOtp}
                      disabled={isPhoneVerified || isSendingOtp}
                      sx={{
                        backgroundColor: isPhoneVerified ? '#4caf50' : '#ef1c1c',
                        color: '#fff',
                        borderRadius: 100,
                        fontSize: '0.75rem',
                        '&:hover': {
                          backgroundColor: isPhoneVerified ? '#388e3c' : '#d91414',
                        },
                      }}
                    >
                      {isSendingOtp ? 'Sending...' : isPhoneVerified ? 'Verified' : 'Verify'}
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Passwords */}
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowConfirmPassword} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Gender + ID Proof */}
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
            <FormControl fullWidth required sx={{ textAlign: 'left' }}>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                sx={{ backgroundColor: '#f8eaea', borderRadius: 2 }}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              sx={{
                height: '56px',
                backgroundColor: '#f8eaea',
                borderColor: '#f8eaea',
                color: '#666',
                '&:hover': {
                  backgroundColor: '#f0e0e0',
                  borderColor: '#f0e0e0',
                },
                textTransform: 'none',
                justifyContent: 'flex-start',
                pl: 2,
              }}
            >
              {form.idProof ? form.idProof.name : 'Upload Govt ID Proof (PDF/PNG/JPEG)'}
              <input type="file" hidden onChange={handleFileChange} accept=".pdf,.png,.jpeg,.jpg" />
            </Button>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={!isPhoneVerified}
            sx={{
              backgroundColor: '#ef1c1c',
              color: '#fff',
              borderRadius: 100,
              py: 1.2,
              fontWeight: 'bold',
              fontSize: '1rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#d91414',
              },
              '&:disabled': {
                backgroundColor: '#cccccc',
                color: '#666666',
              },
            }}
          >
            Register
          </Button>
        </form>

        <Typography sx={{ fontSize: '0.9rem', mt: 2 }}>
          Already have an account?{' '}
          <span
            style={{
              fontWeight: 'bold',
              color: '#000',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            onClick={() => navigate('/')}
          >
            Sign In
          </span>
        </Typography>

        {/* OTP Modal */}
        {showOtpModal && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
            }}
            onClick={() => setShowOtpModal(false)}
          >
            <Box
              sx={{
                backgroundColor: '#fff',
                p: 4,
                borderRadius: 2,
                width: isMobile ? '90%' : '400px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
                Enter OTP Sent to {form.phone}
              </Typography>
              <TextField
                fullWidth
                label="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                sx={{ mb: 2 }}
                inputProps={{ maxLength: 6 }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleVerifyOtp}
                sx={{
                  backgroundColor: '#ef1c1c',
                  color: '#fff',
                  '&:hover': {
                    backgroundColor: '#d91414',
                  },
                }}
              >
                Verify OTP
              </Button>
              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: '#666' }}>
                Didn't receive OTP?{' '}
                <span
                  style={{ color: '#ef1c1c', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={handleSendOtp}
                >
                  Resend
                </span>
              </Typography>
            </Box>
          </Box>
        )}

        {/* Profile Modal */}
        <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ color: '#ec407a', fontWeight: 700 }}>Add Profile</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <img
                src={profilePreview || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                alt="Profile"
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #f8bbd0',
                  marginBottom: 8,
                }}
              />
              <Button
                component="label"
                variant="outlined"
                sx={{
                  backgroundColor: '#f8eaea',
                  borderColor: '#f8eaea',
                  color: '#666',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: '#f0e0e0',
                    borderColor: '#f0e0e0',
                  },
                }}
              >
                Upload Profile Photo
                <input type="file" accept="image/*" hidden onChange={handleProfileImageChange} />
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setProfileOpen(false)} sx={{ color: '#ec407a', fontWeight: 600 }}>
              Done
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success/Error Popup */}
        <Dialog
          open={popup.open}
          TransitionComponent={Transition}
          keepMounted
          PaperProps={{
            sx: {
              position: "fixed",
              bottom: 32,
              left: "44%",
              transform: "translateX(-50%)",
              bgcolor: "#fff",
              borderRadius: 3,
              minWidth: 320,
              boxShadow: 6,
              display: "flex",
              alignItems: "center",
              px: 3,
              py: 2,
            },
          }}
          hideBackdrop
        >
          <DialogContent sx={{ display: "flex", alignItems: "center", gap: 2, p: 0 }}>
            {popup.success ? (
              <CheckCircleRoundedIcon sx={{ color: "#1ecb4f", fontSize: 40 }} />
            ) : (
              <CancelRoundedIcon sx={{ color: "#ef1c1c", fontSize: 40 }} />
            )}
            <Typography
              variant="subtitle1"
              sx={{
                color: popup.success ? "#1ecb4f" : "#ef1c1c",
                fontWeight: "bold",
                fontFamily: "Pacifico, cursive",
                letterSpacing: 1,
              }}
            >
              {popup.message}
            </Typography>
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
}
