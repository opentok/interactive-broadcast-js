// @flow
import R from 'ramda';
import firebase from '../services/firebase';
import { getAuthToken } from '../services/api';
import { saveAuthToken } from '../services/localStorage';
import { logIn, logOut } from './user';

const authError: ActionCreator = (error: null | Error): AuthAction => ({
  type: 'AUTH_ERROR',
  error,
});

const validate: ThunkActionCreator = (uid: string): Thunk =>
  (dispatch: Dispatch) => {
    getAuthToken(uid)
      .then(({ token }: {token: string}) => {
        saveAuthToken(token);
        dispatch(logIn(uid));
      });
  };

const signIn: ThunkActionCreator = ({ email, password }: AuthCredentials): Thunk =>
  (dispatch: Dispatch) => {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((data: Response): void => dispatch(validate(R.prop('uid', data))))
      .catch((error: Error): void => dispatch(authError(error)));
  };

const signOut: ThunkActionCreator = (): Thunk =>
    (dispatch: Dispatch) => {
      dispatch(logOut());
      firebase.auth().signOut();
    };

module.exports = {
  signIn,
  signOut,
};
