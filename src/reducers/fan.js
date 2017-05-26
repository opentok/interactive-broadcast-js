// @flow
import R from 'ramda';

const initialState = (): FanState => ({
  ableToJoin: false,
  setFanName: 'Anonymous',
  status: 'disconnected',
  inPrivateCall: false,
});

const fan = (state: FanState = initialState(), action: FanAction): FanState => {
  switch (action.type) {
    case 'SET_FAN_STATUS':
      return R.assoc('status', action.status, state);
    case 'SET_FAN_NAME':
      return R.assoc('fanName', action.fanName, state);
    case 'SET_ABLE_TO_JOIN':
      return R.assoc('ableToJoin', action.ableToJoin, state);
    default:
      return state;
  }
};


export default fan;
