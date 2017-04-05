import R from 'ramda';
import { loadAuthToken as jwt } from './localStorage';

/** Constants */
const origin = window.location.origin;
const url = R.contains('localhost', origin) ? 'http://localhost:3001' : 'https://ibs-dev-server.herokuapp.com';
const apiUrl = `${url}/api`;
const defaultHeaders = { 'Content-Type': 'application/json' };
/** ********* */

/** Generator headers for a request */
const headers = (requiresAuth: boolean): Headers => R.merge(defaultHeaders, requiresAuth ? { Authorization: `Bearer ${jwt()}` } : null);

/** Check for external route containing http/https */
const getURL = (route: string): string => route.includes('http') ? route : `${apiUrl}/${route}`;

/** Parse a response based on the type */
const parseResponse = (response: Response): * => {
  const contentType = R.head(R.split(';')(R.defaultTo('')(response.headers.get('content-type'))));
  if (contentType === 'application/json') {
    return response.json();
  } else if (contentType === 'text/html') {
    return response.text();
  }
};

/** Check for API-level errors */
const checkStatus = (response: Response): PromiseLike =>
  new Promise((resolve: PromiseLike, reject: PromiseLike): Promise => {
    if (response.status >= 200 && response.status < 300) {
      return resolve(response);
    }
    parseResponse(response)
      .then(({ message }: { message: string }): PromiseLike => reject(new Error(message)))
      .catch(reject);
  });

/** Create a new Request object */
const request = (method: HttpMethod, route: string, data: * = null, requiresAuth: boolean = true): Request => {
  const body = data && JSON.stringify(data);
  return new Request(getURL(route), {
    method: method.toUpperCase(),
    mode: 'cors',
    headers: new Headers(headers(requiresAuth)),
    body,
  });
};

/** Execute a request using fetch */
const execute = (method: HttpMethod, route: string, body: * = null, requiresAuth: boolean = true): Promise =>
  new Promise((resolve: PromiseLike, reject: PromiseLike) => {
    fetch(request(method, route, body, requiresAuth))
      .then(checkStatus)
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });

/** HTTP Methods */
const get = (route: string, requiresAuth: boolean = true): Promise => execute('get', route, null, requiresAuth);
const post = (route: string, body: * = null, requiresAuth: boolean = true): Promise => execute('post', route, body, requiresAuth);
const put = (route: string, body: * = null, requiresAuth: boolean = true): Promise => execute('put', route, body, requiresAuth);
const patch = (route: string, body: * = null, requiresAuth: boolean = true): Promise => execute('patch', route, body, requiresAuth);
const del = (route: string, requiresAuth: boolean = true): Promise => execute('delete', route, null, requiresAuth);

/** Exports */

/** Auth */
const getAuthTokenFan = (userId: string): Promise => post('auth/token-fan', { uid: userId }, false);
const getAuthTokenCelebrity = (userId: string): Promise => post('auth/token-celebrity', { uid: userId }, false);
const getAuthTokenHost = (userId: string): Promise => post('auth/token-host', { uid: userId }, false);
const getAuthToken = (idToken: string): Promise => post('auth/token', { idToken }, false);

/** User */
const getUser = (userId: string): Promise => get(`admin/${userId}`);
const createUser = (userData: UserFormData): Promise => post('admin', userData);
const updateUser = (userData: UserFormData): Promise => patch(`admin/${userData.id}`, userData);
const getAllUsers = (): Users[] => get('admin');
const deleteUserRecord = (userId: string): Promise => del(`admin/${userId}`);

/** Events */
const getEvents = (adminId: string): Promise => get(`event?adminId=${adminId}`);
const getEvent = (id: string): Promise => get(`event/${id}`);
const createEvent = (data: object): Promise => post('event', data);
const updateEvent = (data: object): Promise => patch(`event/${data.id}`, data);
const updateEventStatus = (id: string, status: EventStatus): Promise => put(`event/change-status/${id}`, { status });
const deleteEvent = (id: string): Promise => del(`event/${id}`);
const getMostRecentEvent = (id: string): Promise => get(`event/get-current-admin-event?adminId=${id}`);
const getAdminCredentials = (eventId: eventId): Promise => post(`event/create-token-producer/${eventId}`);

/** Exports */

module.exports = {
  getAuthToken,
  getAuthTokenFan,
  getAuthTokenCelebrity,
  getAuthTokenHost,
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
};
