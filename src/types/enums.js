// Match status and event type enums

const MatchStatus = {
  NOT_STARTED: 'NOT_STARTED',
  FIRST_HALF: 'FIRST_HALF',
  HALF_TIME: 'HALF_TIME',
  SECOND_HALF: 'SECOND_HALF',
  FULL_TIME: 'FULL_TIME',
};

const EventType = {
  GOAL: 'goal',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card',
  SUBSTITUTION: 'substitution',
  FOUL: 'foul',
  SHOT: 'shot',
};

module.exports = { MatchStatus, EventType };
