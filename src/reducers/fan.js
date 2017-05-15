// @flow
import R from 'ramda';

const initialState = (): FanState => ({
  ableToJoin: false,
  setFanName: 'Anonymous',
  newFanSignalAckd: false,
});

const fan = (state: FanState = initialState(), action: FanAction): FanState => {
  switch (action.type) {
    case 'SET_NEW_FAN_ACKD':
      return R.assoc('newFanSignalAckd', action.newFanSignalAckd, state);
    case 'SET_FAN_NAME':
      return R.assoc('fanName', action.fanName, state);
    case 'SET_ABLE_TO_JOIN':
      return R.assoc('ableToJoin', action.ableToJoin, state);
    default:
      return state;
  }
};


export default fan;
