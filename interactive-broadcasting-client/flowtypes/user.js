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
declare type UserAction = { type: 'LOG_IN', user: User } | { type: 'LOG_OUT' };
