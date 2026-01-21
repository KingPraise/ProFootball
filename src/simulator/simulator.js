const redis = require('../services/redis');
const supabase = require('../services/supabase');
const { MatchStatus, EventType } = require('../types');
const { v4: uuidv4 } = require('uuid');

const MATCH_COUNT = 4;
const MATCH_DURATION = 90;
const SIM_SPEED = 1000; // 1s = 1 min

let matches = [];

function randomTeam() {
  const teams = ['Lions', 'Tigers', 'Bears', 'Wolves', 'Eagles', 'Sharks', 'Dragons', 'Falcons'];
  return teams[Math.floor(Math.random() * teams.length)];
}

function createMatch(id) {
  return {
    id,
    home: randomTeam(),
    away: randomTeam(),
    score: { home: 0, away: 0 },
    minute: 0,
    status: MatchStatus.NOT_STARTED,
    events: [],
    stats: { shots: 0, fouls: 0, yellow_cards: 0, red_cards: 0, substitutions: 0 },
  };
}

function startSimulator(io) {
  // Initialize matches
  matches = Array.from({ length: MATCH_COUNT }, (_, i) => createMatch(uuidv4()));
  redis.set('matches:list', JSON.stringify(matches));

  matches.forEach((match) => simulateMatch(io, match));
}

function simulateMatch(io, match) {
  let interval = setInterval(async () => {
    if (match.status === MatchStatus.FULL_TIME) return clearInterval(interval);
    match.minute++;
    // Status progression
    if (match.minute === 1) match.status = MatchStatus.FIRST_HALF;
    if (match.minute === 45) match.status = MatchStatus.HALF_TIME;
    if (match.minute === 46) match.status = MatchStatus.SECOND_HALF;
    if (match.minute === 90) match.status = MatchStatus.FULL_TIME;

    // Event generation
    let event = maybeGenerateEvent(match);
    if (event) {
      match.events.push(event);
      await redis.rpush(`match:${match.id}:events`, JSON.stringify(event));
      await supabase.from('events').insert([{ ...event, match_id: match.id }]);
      io.to(`match:${match.id}`).emit('event', event);
      redis.publish(`match:${match.id}:events:stream`, JSON.stringify(event));
    }

    // Update stats
    await redis.set(`match:${match.id}`, JSON.stringify(match));
    await supabase.from('matches').upsert([match]);
    io.to(`match:${match.id}`).emit('score_update', {
      score: match.score,
      minute: match.minute,
      status: match.status,
      stats: match.stats,
    });
    redis.set('matches:list', JSON.stringify(matches));
  }, SIM_SPEED);
}

function maybeGenerateEvent(match) {
  // Realistic event distribution
  const min = match.minute;
  if (match.status !== MatchStatus.FIRST_HALF && match.status !== MatchStatus.SECOND_HALF) return null;
  // Goals: ~2.5 per match
  if (Math.random() < 2.5 / MATCH_DURATION) {
    const team = Math.random() < 0.5 ? 'home' : 'away';
    match.score[team]++;
    return { type: EventType.GOAL, team, minute: min };
  }
  // Yellow cards: ~3-4 per match
  if (Math.random() < 4 / MATCH_DURATION) {
    return { type: EventType.YELLOW_CARD, team: Math.random() < 0.5 ? 'home' : 'away', minute: min };
  }
  // Red cards: rare
  if (Math.random() < 0.1 / MATCH_DURATION) {
    return { type: EventType.RED_CARD, team: Math.random() < 0.5 ? 'home' : 'away', minute: min };
  }
  // Substitutions: after 60'
  if (min > 60 && Math.random() < 6 / (MATCH_DURATION - 60)) {
    return { type: EventType.SUBSTITUTION, team: Math.random() < 0.5 ? 'home' : 'away', minute: min };
  }
  // Fouls: every 2-3 min
  if (Math.random() < 1 / 2.5) {
    return { type: EventType.FOUL, team: Math.random() < 0.5 ? 'home' : 'away', minute: min };
  }
  // Shots: every 3-5 min
  if (Math.random() < 1 / 4) {
    return { type: EventType.SHOT, team: Math.random() < 0.5 ? 'home' : 'away', minute: min };
  }
  return null;
}

module.exports = { startSimulator };
