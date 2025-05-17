import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

export default function Home() {
  return (
    <Box textAlign="center" mt={5}>
      <Typography variant="h4" gutterBottom>
        Welcome to your React + MUI app!
      </Typography>
      <Button variant="contained" size="large">
        Get Started
      </Button>
    </Box>
  );
}