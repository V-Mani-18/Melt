import {
  Button,
  TextField,
  Link,
  Grid,
  Box,
  Typography,
  Container,
  Paper,
  IconButton,
  InputAdornment,
} from "@mui/material";
import React, { useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useNavigate } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import AnimatedTitle from "./AnimatedTitle";
import "@fontsource/pacifico";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Slide from "@mui/material/Slide";
import DialogTitle from "@mui/material/DialogTitle";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const welcomeAnimation = {
  '@keyframes roseFade': {
    '0%': { color: '#f8bbd0' },
    '50%': { color: '#ec407a' },
    '100%': { color: '#f8bbd0' },
  },
  animation: 'roseFade 2s infinite',
  fontFamily: '"Pacifico", cursive',
  fontWeight: 'bold',
  letterSpacing: 2,
};

function SignInPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [popup, setPopup] = useState({
    open: false,
    success: false,
    message: "",
  });

  // Forgot password dialog states
  const [forgotDialog, setForgotDialog] = useState(false);
  const [forgotStep, setForgotStep] = useState(0); // 0: phone, 1: otp, 2: new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handlePasswordChange = (e) => {
    const inputValue = e.target.value;
    const previousMasked = "❤️".repeat(password.length);
    const newMasked = inputValue;

    if (newMasked.length < previousMasked.length) {
      setPassword(password.slice(0, -1));
    } else {
      const addedChar = inputValue.replaceAll("❤️", "")[0] || "";
      setPassword(password + addedChar);
    }
  };

  const showPopup = (success, message) => {
    setPopup({ open: true, success, message });
    setTimeout(() => setPopup((p) => ({ ...p, open: false })), 2000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email");

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('userId', result.user._id);
        showPopup(true, result.message || "Login successful!");
        setTimeout(() => navigate("/chat"), 2000);
      } else {
        showPopup(false, result.message || "Invalid credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      showPopup(false, "Server error. Try again.");
    }
  };

  // Open forgot password dialog
  const handleForgotOpen = () => {
    setForgotEmail(document.getElementById("email")?.value || "");
    setForgotStep(0);
    setForgotDialog(true);
    setForgotPhone("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
  };

  // Handle forgot password steps
  const handleForgotNext = async () => {
    setForgotLoading(true);
    if (forgotStep === 0) {
      // Step 1: Send OTP
      const res = await fetch("http://localhost:5000/api/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, phone: forgotPhone }),
      });
      const result = await res.json();
      setForgotLoading(false);
      if (res.ok) {
        showPopup(true, "OTP sent to mobile");
        setForgotStep(1);
      } else {
        showPopup(false, result.message || "Failed to send OTP");
      }
    } else if (forgotStep === 1) {
      // Step 2: Verify OTP
      const res = await fetch("http://localhost:5000/api/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, phone: forgotPhone, otp: forgotOtp }),
      });
      const result = await res.json();
      setForgotLoading(false);
      if (res.ok) {
        showPopup(true, "OTP verified");
        setForgotStep(2);
      } else {
        showPopup(false, result.message || "Invalid OTP");
      }
    } else if (forgotStep === 2) {
      // Step 3: Reset password
      if (forgotNewPassword !== forgotConfirmPassword) {
        setForgotLoading(false);
        showPopup(false, "Passwords do not match");
        return;
      }
      const res = await fetch("http://localhost:5000/api/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, phone: forgotPhone, newPassword: forgotNewPassword }),
      });
      const result = await res.json();
      setForgotLoading(false);
      if (res.ok) {
        showPopup(true, "Password changed!");
        setForgotDialog(false);
      } else {
        showPopup(false, result.message || "Failed to change password");
      }
    }
  };

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#fef6f7",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Container component="main" maxWidth="xs">
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              borderRadius: 3,
              bgcolor: "#fff",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <AnimatedTitle sx={{ mb: 1 }} />
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  mt: 2,
                  ...welcomeAnimation,
                }}
              >
                Welcome
              </Typography>

              <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  name="email"
                  label="Username or Email"
                  autoComplete="email"
                  autoFocus
                  sx={{
                    backgroundColor: "#f4dddd",
                    borderRadius: 1,
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="text"
                  value={showPassword ? password : "❤️".repeat(password.length)}
                  onChange={handlePasswordChange}
                  sx={{
                    backgroundColor: "#f4dddd",
                    borderRadius: 1,
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Grid item xs={12}>
                  <Link href="#" variant="body2" sx={{ color: "#a94442" }} onClick={handleForgotOpen}>
                    Forgot password?
                  </Link>
                </Grid>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    bgcolor: "#ef1c1c",
                    "&:hover": { bgcolor: "#cc1818" },
                    borderRadius: 5,
                    textTransform: "none",
                    fontWeight: "bold",
                  }}
                >
                  Sign In
                </Button>
              </Box>

              <Grid container justifyContent="center">
                <Grid item>
                  <Typography variant="body2">
                    Don't have an account?{" "}
                    <Link component={RouterLink} to="/signup" variant="body2">
                      Sign Up
                    </Link>
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Container>
      </Box>
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
      <Dialog open={forgotDialog} onClose={() => setForgotDialog(false)} TransitionComponent={Transition}>
        <DialogTitle>
          {forgotStep === 0 && "Forgot Password: Enter Phone"}
          {forgotStep === 1 && "Enter OTP"}
          {forgotStep === 2 && "Set New Password"}
        </DialogTitle>
        <DialogContent>
          {forgotStep === 0 && (
            <>
              <TextField
                label="Registered Phone"
                fullWidth
                value={forgotPhone}
                onChange={e => setForgotPhone(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleForgotNext}
                disabled={forgotLoading || !forgotPhone}
              >
                {forgotLoading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </>
          )}
          {forgotStep === 1 && (
            <>
              <TextField
                label="OTP"
                fullWidth
                value={forgotOtp}
                onChange={e => setForgotOtp(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleForgotNext}
                disabled={forgotLoading || !forgotOtp}
              >
                {forgotLoading ? "Verifying..." : "Verify OTP"}
              </Button>
            </>
          )}
          {forgotStep === 2 && (
            <>
              <TextField
                label="New Password"
                type="password"
                fullWidth
                value={forgotNewPassword}
                onChange={e => setForgotNewPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Confirm Password"
                type="password"
                fullWidth
                value={forgotConfirmPassword}
                onChange={e => setForgotConfirmPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleForgotNext}
                disabled={forgotLoading || !forgotNewPassword || !forgotConfirmPassword}
              >
                {forgotLoading ? "Changing..." : "Change Password"}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SignInPage;