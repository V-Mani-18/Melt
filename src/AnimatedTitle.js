import React from 'react';
import { Typography, Box } from '@mui/material';
import { keyframes } from '@emotion/react';
import '@fontsource/pacifico';

// Color fade for text
const colorFade = keyframes`
  0%, 100% { color: #ff0066; }
  50% { color: #ff66b2; }
`;

// Heart-beat animation
const heartBeat = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(0.95);
  }
  75% {
    transform: scale(1.1);
  }
`;

const AnimatedTitle = ({ sx = {} }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 1,
      mb: 2,
      ...sx,
    }}
  >
    {/* Title Text */}
    <Typography
      variant="h3"
      component="h1"
      aria-label="Juicee"
      sx={{
        fontFamily: 'Pacifico, cursive',
        animation: `${colorFade} 3s infinite`,
        fontWeight: 400,
        fontSize: { xs: '2rem', sm: '3rem' },
        textAlign: 'center',
        textShadow: '1px 2px 8px #fff2, 0 1px 0 #fff',
      }}
    >
      Juicee
    </Typography>

    {/* Heart Symbol */}
    <Box
      component="span"
      role="img"
      aria-label="heart"
      sx={{
        fontSize: { xs: '2rem', sm: '2.5rem' },
        animation: `${heartBeat} 1.5s infinite`,
        display: 'inline-block',
        color: '#ff0066',
      }}
    >
      ❤️
    </Box>
  </Box>
);

export default AnimatedTitle;
