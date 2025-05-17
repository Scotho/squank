// src/components/Home.js
import React, { useState } from 'react';
import {
  Typography,
  Button,
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';

import {
  fetchUserReports,
  fetchDeathwishCasters,
  fetchGuildReports,
} from '../services/warcraftLogsReports';
import { fetchPrivateUserData } from '../services/warcraftLogsUser';

export default function Home() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Evaluate Log
  const [logUrl, setLogUrl] = useState('');
  const [logLoading, setLogLoading] = useState(false);
  const [logError, setLogError] = useState('');
  const [dwCasts, setDwCasts] = useState([]);

  // Guild Reports (SQUAWK)
  const [guildReports, setGuildReports] = useState([]);
  const [guildLoading, setGuildLoading] = useState(false);
  const [guildError, setGuildError] = useState(null);

  const handleLoadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const { id: userId } = await fetchPrivateUserData();
      let page = 1;
      const all = [];

      while (true) {
        const { data: pageData, has_more_pages } = await fetchUserReports(userId, {
          limit: 20,
          page,
        });
        all.push(...pageData);
        if (!has_more_pages) break;
        page++;
      }

      setReports(all);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const extractReportId = url => {
    try {
      const parts = new URL(url.trim()).pathname.split('/');
      const idx = parts.indexOf('reports');
      return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : null;
    } catch {
      return null;
    }
  };

  const handleEvaluateLog = async e => {
    e.preventDefault();

    const id = extractReportId(logUrl);
    if (!id) {
      setLogError('Invalid Warcraft Logs URL');
      return;
    }

    setLogError('');
    setLogLoading(true);
    setDwCasts([]);

    try {
      const events = await fetchDeathwishCasters(id);
      setDwCasts(events);
    } catch (err) {
      console.error(err);
      setLogError(err.message || 'Failed to fetch Death Wish events');
    } finally {
      setLogLoading(false);
    }
  };

  const handleLoadGuildReports = async () => {
    setGuildLoading(true);
    setGuildError(null);
    try {
      const guildID = 772198; // numeric SQUAWK guild ID
      let page = 1;
      const all = [];

      while (true) {
        const { data: pageData, has_more_pages } = await fetchGuildReports({
          guildID,
          limit: 20,
          page,
        });
        all.push(...pageData);
        if (!has_more_pages) break;
        page++;
      }

      setGuildReports(all);
    } catch (e) {
      console.error(e);
      setGuildError(e.message || 'Failed to load guild reports');
    } finally {
      setGuildLoading(false);
    }
  };

  return (
    <Box textAlign="center" mt={5} px={2}>
      <Typography variant="h4" gutterBottom>Sup Crankers</Typography>
      <Typography variant="p" gutterBottom>This uses the WCL v2 API <b>which requires you to be logged in</b>, but there doesn't seem to be an API limits.</Typography>

      {/* Evaluate Log */}
      <Box mt={5} textAlign="left">
        <Typography variant="h5" gutterBottom>Evaluate Log</Typography>
        <Box
          component="form"
          onSubmit={handleEvaluateLog}
          sx={{ display: 'flex', gap: 2, mb: 2 }}
        >
          <TextField
            fullWidth
            label="Warcraft Logs Report URL"
            placeholder="https://www.warcraftlogs.com/reports/aYcVPHdNt8qFjKCw?…"
            value={logUrl}
            onChange={e => setLogUrl(e.target.value)}
            error={!!logError}
            helperText={logError || 'Paste your full report URL here'}
          />
          <Button type="submit" variant="contained" disabled={logLoading}>
            {logLoading ? <CircularProgress size={24} /> : 'Evaluate'}
          </Button>
        </Box>
        <List>
          {dwCasts.map((ev, i) => (
            <ListItem key={i} divider>
              <ListItemText
                primary={`${ev.source.name} cast Death Wish`}
                secondary={new Date(ev.timestamp).toLocaleString()}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Guild Reports (SQUAWK) */}
      <Box mt={5} mb={3}>
        <Button
          variant="contained"
          onClick={handleLoadGuildReports}
          disabled={guildLoading}
        >
          {guildLoading ? <CircularProgress size={24} /> : 'Load SQUAWK Guild Reports'}
        </Button>
      </Box>
      {guildError && <Typography color="error">{guildError}</Typography>}
      {guildReports.length > 0 && <Typography variant="h6">SQUAWK Guild Reports:</Typography>}
      <List>
        {guildReports.map(r => (
          <ListItem key={r.code} divider>
            <ListItemText
              primary={r.title}
              secondary={`${r.zone?.name || 'Unknown zone'} — ${new Date(r.startTime).toLocaleString()}`}
            />
          </ListItem>
        ))}
      </List>

       {/* My Reports */}
      <Box mb={3}>
        <Button
          variant="contained"
          size="large"
          onClick={handleLoadReports}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Load My Reports'}
        </Button>
      </Box>
      {error && <Typography color="error">{error}</Typography>}
      {reports.length > 0 && <Typography variant="h6">My Reports:</Typography>}
      <List>
        {reports.map(r => (
          <ListItem key={r.code} divider>
            <ListItemText
              primary={r.title}
              secondary={`${r.zone?.name || 'Unknown zone'} — ${new Date(r.startTime).toLocaleString()}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
