// @flow
import R from 'ramda';

const initialState = { error: false };
const auth = (state: AuthState = initialState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_ERROR':
      return R.assoc('error', action.error, state);
    default:
      return state;
  }
};

export default auth;





