const express = require('express');
const router = express.Router();
const redis = require('../services/redis');
const supabase = require('../services/supabase');
const { MatchStatus } = require('../types');

// Helper: consistent response
function apiResponse(success, data = null, error = null) {
  return { success, data, error };
}

// GET /api/matches
router.get('/', async (req, res) => {
  try {
    // Get all live/upcoming matches from Redis (fast) or Supabase (fallback)
    let matches = await redis.get('matches:list');
    if (matches) matches = JSON.parse(matches);
    else {
      const { data, error } = await supabase.from('matches').select('*');
      if (error) return res.status(500).json(apiResponse(false, null, error.message));
      matches = data;
    }
    res.json(apiResponse(true, matches, null));
  } catch (err) {
    res.status(500).json(apiResponse(false, null, err.message));
  }
});

// GET /api/matches/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Try Redis first
    let match = await redis.get(`match:${id}`);
    if (match) match = JSON.parse(match);
    else {
      const { data, error } = await supabase.from('matches').select('*').eq('id', id).single();
      if (error || !data) return res.status(404).json(apiResponse(false, null, 'Match not found'));
      match = data;
    }
    // Get events (from Redis or Supabase)
    let events = await redis.lrange(`match:${id}:events`, 0, -1);
    if (events && events.length) events = events.map(JSON.parse);
    else {
      const { data, error } = await supabase.from('events').select('*').eq('match_id', id).order('minute');
      if (error) events = [];
      else events = data;
    }
    match.events = events;
    res.json(apiResponse(true, match, null));
  } catch (err) {
    res.status(500).json(apiResponse(false, null, err.message));
  }
});

// GET /api/matches/:id/events/stream
router.get('/:id/events/stream', async (req, res) => {
  const { id } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Subscribe to Redis pub/sub for this match's events
  const sub = redis.duplicate();
  await sub.connect();
  await sub.subscribe(`match:${id}:events:stream`, (message) => {
    res.write(`data: ${message}\n\n`);
  });

  req.on('close', async () => {
    await sub.unsubscribe(`match:${id}:events:stream`);
    await sub.quit();
    res.end();
  });
});

module.exports = router;
