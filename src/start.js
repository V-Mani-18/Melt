import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import AnimatedTitle from './AnimatedTitle';
import { keyframes } from '@emotion/react';

const sloganFade = keyframes`
  0%, 100% { color: #ff66b2; }
  50% { color: #ff0066; }
`;

const StartPage = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/signin');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
      onClick={handleClick}
    >
      {/* Centered Animated Title */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <AnimatedTitle sx={{ 
          '& h1': { fontSize: { xs: '3rem', sm: '5rem', md: '6rem' } }, // Increase only on start page
          '& span': { fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' } } // Bigger heart
        }} />
      </Box>

      {/* Slogan fixed at the bottom */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 32, sm: 40 },
          left: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none', // So click passes through
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontFamily: 'Pacifico, cursive',
            animation: `${sloganFade} 3s infinite`,
            fontWeight: 400,
            textAlign: 'center',
            textShadow: '1px 2px 8px #fff2, 0 1px 0 #fff',
            letterSpacing: 1,
            mb: 1,
            color: '#ff66b2',
            px: 2,
          }}
        >
          Dripping With Sweet Gossip In The Air
        </Typography>
      </Box>
    </Box>
  );
};

export default StartPage;