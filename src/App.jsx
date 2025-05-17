import React from 'react';
import Container from '@mui/material/Container';
import Header from './components/Header';
import Home from './components/Home';

export default function App() {
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Header />
      <Home />
    </Container>
  );
}
