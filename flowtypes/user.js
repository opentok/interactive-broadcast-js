// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */

declare type User = {
  id: string,
  name: string,
  email: string,
  name: string,
  otApiKey: string,
  otSecret: string,
  superAdmin: boolean,
  httpSupport: boolean
 };

declare type UserState = null | User;
declare type UserAction = { type: 'LOGIN', user: User } | { type: 'LOGOUT' };
