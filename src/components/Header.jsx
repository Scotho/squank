import React, { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { startOAuth } from '../oauth-handler.js';
import { fetchPrivateUserData } from '../services/warcraftLogsUser.js';

export default function Header() {
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      fetchPrivateUserData()
        .then(setUser)
        .catch((err) => console.error('Failed to fetch user info:', err));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    setUser(null);
    window.location.reload();
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1a1a1a' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Left side: Logo + Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={`${import.meta.env.BASE_URL}img/squank.jpg`}
              alt="Squank Logo"
              sx={{ width: 40, height: 40 }}
              variant="rounded"
            />
            <Typography
              variant="h6"
              noWrap
              sx={{ fontWeight: 600, letterSpacing: '.05rem' }}
            >
              Squank
            </Typography>
          </Box>

          {/* Right side: Auth status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user ? (
              <>                
                <Button
                  color="inherit"
                  onClick={handleMenuOpen}
                  endIcon={<ArrowDropDownIcon />}
                >
                  {user.name}
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      handleLogout();
                    }}
                  >
                    Log out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button color="inherit" onClick={startOAuth}>
                Log in
              </Button>
            )}
          </Box>

        </Toolbar>
      </Container>
    </AppBar>
  );
}