// @flow
import R from 'ramda';

const initialState = { error: false, forgotPassword: false };
const auth = (state: AuthState = initialState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_ERROR':
      return R.assoc('error', action.error, state);
    case 'AUTH_FORGOT_PASSWORD':
      return R.assoc('forgotPassword', action.forgot, state);
    default:
      return state;
  }
};

export default auth;
