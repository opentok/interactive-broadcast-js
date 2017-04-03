// @flow
import R from 'ramda';
import firebase from '../services/firebase';
import { getAuthToken } from '../services/api';
import { saveAuthToken } from '../services/localStorage';
import { logIn, logOut } from './currentUser';
import { setAlert, resetAlert, setInfo } from './alert';

const authError: ActionCreator = (error: null | Error): AuthAction => ({
  type: 'AUTH_ERROR',
  error,
});

const userForgotPassword: ThunkActionCreator = (forgot: boolean): Thunk =>
  (dispatch: Dispatch) => {
    dispatch(authError(null));
    dispatch({ type: 'AUTH_FORGOT_PASSWORD', forgot });
  };

const validate: ThunkActionCreator = (uid: string, idToken: string): Thunk =>
  async (dispatch: Dispatch): Promise<void> => {
    try {
      const { token } = await getAuthToken(idToken);
      saveAuthToken(token);
      dispatch(logIn(uid));
    } catch (error) {
      await dispatch(authError(error));
    }
  };

const signIn: ThunkActionCreator = ({ email, password }: AuthCredentials): Thunk =>
  async (dispatch: Dispatch): Promise<void> => {
    try {
      const user = await firebase.auth().signInWithEmailAndPassword(email, password);
      const idToken = await user.getToken(true);
      await dispatch(validate(R.prop('uid', user), idToken));
    } catch (error) {
      await dispatch(authError(error));
    }
  };

const signOut: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    dispatch(logOut());
    firebase.auth().signOut();
  };

const resetPassword: ThunkActionCreator = ({ email }: AuthCredentials): Thunk =>
  async (dispatch: Dispatch): Promise<void> => {
    const onReset = () => {
      const onConfirm: Unit = () => {
        dispatch(resetAlert());
        dispatch(userForgotPassword(false));
      };
      const options: AlertOptions = {
        show: true,
        type: 'success',
        title: 'Password Reset',
        text: 'Please check your inbox for password reset instructions',
        onConfirm,
      };
      dispatch(setAlert(options));
    };

    try {
      await firebase.auth().sendPasswordResetEmail(email);
      onReset();
    } catch (error) {
      dispatch(setInfo('Password Reset', 'We couldn\'t find an account for that email address.'));
    }
  };

module.exports = {
  signIn,
  signOut,
  userForgotPassword,
  resetPassword,
};
