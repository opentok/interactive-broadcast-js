// @flow
import R from 'ramda';

const properCase = (input: string): string => `${R.toUpper(R.head(input))}${R.tail(input)}`;

// Get the fan type based on their status
const fanTypeByStatus = (status: FanStatus): FanType => {
  switch (status) {
    case 'inLine':
      return 'activeFan';
    case 'backstage':
      return 'backstageFan';
    case 'stage':
      return 'fan';
    default:
      return 'activeFan';
  }
};

// Get the fan type based on their active fan record
const fanTypeForActiveFan = (fan: ActiveFan): FanType => {
  if (fan.isBackstage) {
    return 'backstageFan';
  } else if (fan.isOnStage) {
    return 'fan';
  }
  return 'activeFan';
};


const isFan = (type: UserRole | 'activeFan'): boolean => R.contains(type, ['fan', 'backstageFan', 'activeFan']);

const isUserOnStage = (user: ParticipantType | 'activeFan'): boolean => R.contains(user, ['fan', 'host', 'celebrity']);

module.exports = {
  fanTypeForActiveFan,
  fanTypeByStatus,
  isFan,
  isUserOnStage,
  properCase,
};
