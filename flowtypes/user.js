// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */

declare type UserId = string;
declare type User = {
  id: UserId,
  displayName: string,
  email: string,
  otApiKey: string,
  otSecret: string,
  superAdmin: boolean,
  broadcastEnabled: boolean,
  httpSupport: boolean
 };

declare type HostCelebCredentials = {
  apiKey: string,
  stageToken: string,
  httpSupport: boolean
};

declare type HostCelebEventData = BroadcastEvent & HostCelebCredentials;

declare type UserCredentials = {
  apiKey: string,
  backstageToken: string,
  stageToken: string,
  stageSessionId: string,
  sessionId: string
};

declare type HostCeleb = 'host' | 'celebrity';
declare type Fan = 'fan' | 'backstageFan';
declare type UserRole = 'producer' | HostCeleb | Fan;

declare type UserMap = {[id: UserId]: User};
declare type CurrentUserState = null | User;
declare type UserAction =
  { type: 'SET_CURRENT_USER', user: User } |
  { type: 'LOGIN', userId: UserId } |
  { type: 'LOGOUT' };


declare type ManageUsersAction =
  { type: 'SET_USERS', users: UserMap } |
  { type: 'UPDATE_USER', user: User } |
  { type: 'REMOVE_USER', userId: UserId };


declare type UserFormData = {
  displayName: string,
  email: string,
  otApiKey: string,
  otSecret: string,
  broadcastEnabled: boolean,
  httpSupport: boolean
};

declare type UserUpdateFormData = {id: UserId } & UserFormData;




