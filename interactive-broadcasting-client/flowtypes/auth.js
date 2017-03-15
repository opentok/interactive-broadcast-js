// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */

declare type AuthState = {
  error: boolean
 };

declare type AuthCredentials = { email: string, password: string };
declare type AuthAction =
  { type: 'AUTHENTICATE_USER', credentials: AuthCredentials } |
  { type: 'AUTH_ERROR', error: null | Error };
