// @flow
import R from 'ramda';
import { loadAuthToken as jwt } from './localStorage';

/** Constants */
const origin = window.location.origin;
const url = R.contains('localhost', origin) ? 'http://localhost:3001' : 'https://ibs-dev-server.herokuapp.com';
const apiUrl = `${url}/api`;
const defaultHeaders = { 'Content-Type': 'application/json' };
/** ********* */

/** Generator headers for a request */
const headers = (requiresAuth: boolean, authToken?: string): Headers =>
  R.merge(defaultHeaders, requiresAuth ? { Authorization: `Bearer ${authToken || jwt()}` } : null);

/** Check for external route containing http/https */
const getURL = (route: string): string => route.includes('http') ? route : `${apiUrl}/${route}`;

/** Parse a response based on the type */
const parseResponse = (response: Response): Promise<*> => {
  const contentType = R.head(R.split(';')(R.defaultTo('')(response.headers.get('content-type'))));
  if (contentType === 'application/json') {
    return response.json();
  }
  return response.text();  // contentType === 'text/html'
};

/** Check for API-level errors */
const checkStatus = (response: Response): Promise<*> =>
  new Promise((resolve: Promise.resolve<Response>, reject: Promise.reject<Error>): void => {
    if (response.status >= 200 && response.status < 300) {
      return resolve(response);
    }
    parseResponse(response)
      .then(({ message }: { message: string }): void => reject(new Error(message)))
      .catch(reject);
  });

/** Create a new Request object */
const request = (method: HttpMethod, route: string, data: * = null, requiresAuth: boolean = true, authToken?: string): Request => {
  const body: string | void = data && JSON.stringify(data);
  return new Request(getURL(route), {
    method: method.toUpperCase(),
    mode: 'cors',
    headers: new Headers(headers(requiresAuth, authToken)),
    body,
  });
};

/** Execute a request using fetch */
const execute = (method: HttpMethod, route: string, body: * = null, requiresAuth: boolean = true, authToken?: string): Promise<*> =>
  new Promise((resolve: Promise.resolve<*>, reject: Promise.reject<Error>) => {
    fetch(request(method, route, body, requiresAuth, authToken))
      .then(checkStatus)
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });

/** HTTP Methods */
const get = (route: string, requiresAuth: boolean = true, authToken?: string): Promise<*> =>
  execute('get', route, null, requiresAuth, authToken);
const post = (route: string, body: * = null, requiresAuth: boolean = true, authToken?: string): Promise<*> =>
  execute('post', route, body, requiresAuth, authToken);
const put = (route: string, body: * = null, requiresAuth: boolean = true): Promise<*> => execute('put', route, body, requiresAuth);
const patch = (route: string, body: * = null, requiresAuth: boolean = true): Promise<*> => execute('patch', route, body, requiresAuth);
const del = (route: string, requiresAuth: boolean = true): Promise<*> => execute('delete', route, null, requiresAuth);

/** Exports */

/** Auth */
const getAuthTokenUser = (adminId: string, userType: string, userUrl: string): Promise<AuthToken> =>
  post(`auth/token-${userType}`, R.assoc(`${userType}Url`, userUrl, { adminId }), false);
const getAuthToken = (idToken: string): Promise<AuthToken> => post('auth/token', { idToken }, false);

/** User */
const getUser = (userId: string): Promise<User> => get(`admin/${userId}`);
const createUser = (userData: UserFormData): Promise<User> => post('admin', userData);
const updateUser = (userData: UserUpdateFormData): Promise<User> => patch(`admin/${userData.id}`, userData);
const getAllUsers = (): Promise<[User]> => get('admin');
const deleteUserRecord = (userId: string): Promise<boolean> => del(`admin/${userId}`);

/** Events */
const getEvents = (adminId: string): Promise<BroadcastEventMap> => get(`event?adminId=${adminId}`);
const getEvent = (id: string): Promise<BroadcastEvent> => get(`event/${id}`);
const createEvent = (data: BroadcastEventFormData): Promise<BroadcastEvent> => post('event', data);
const updateEvent = (data: BroadcastEventUpdateFormData): Promise<BroadcastEvent> => patch(`event/${data.id}`, data);
const updateEventStatus = (id: string, status: EventStatus): Promise<BroadcastEvent> => put(`event/change-status/${id}`, { status });
const deleteEvent = (id: string): Promise<boolean> => del(`event/${id}`);
const getMostRecentEvent = (id: string): Promise<BroadcastEvent> => get(`event/get-current-admin-event?adminId=${id}`);
const getAdminCredentials = (eventId: EventId): Promise<UserCredentials> => post(`event/create-token-producer/${eventId}`);
const getEventWithCredentials = (data: { adminId: UserId, userType: UserRole, slug: string }, authToken: AuthToken): Promise<HostCelebEventData> =>
  post(`event/create-token-${data.userType}`, data, true, authToken);
/** Exports */

module.exports = {
  getAuthToken,
  getAuthTokenUser,
  getUser,
  createUser,
  updateUser,
  getAllUsers,
  getEvent,
  getEvents,
  getMostRecentEvent,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  getAdminCredentials,
  deleteUserRecord,
  url,
  getEventWithCredentials,
};
