import R from 'ramda';
import { loadAuthToken as jwt } from './localStorage';

/** Constants */
const url = 'http://localhost:3001/api';
const defaultHeaders = { 'Content-Type': 'application/json' };
type Headers = { 'Content-Type': 'application/json', jwt?: string };
const headers = (requiresAuth: boolean): Headers => R.merge(defaultHeaders, requiresAuth ? { Authorization: `Bearer ${jwt()}` } : null);

/** Helper methods */

// Check for external route containing http/https
// eslint-disable-next-line no-confusing-arrow
const getURL = (route: string): string => route.includes('http') ? route : `${url}/${route}`;

// Parse response based on type
const parseResponse = (response: Response): * => {
  const contentType = R.head(R.split(';')(response.headers.get('content-type')));
  if (contentType === 'application/json') {
    return response.json();
  } else if (contentType === 'text/html') {
    return response.text();
  }
};

const request = (method: string, route: string, data: * = null, requiresAuth: boolean = true): Promise => {
  const body = data && JSON.stringify(data);
  return new Request(getURL(route), {
    method: method.toUpperCase(),
    mode: 'cors',
    headers: new Headers(headers(requiresAuth)),
    body,
  });
};

/** Exports */
const get = (route: string, requiresAuth: boolean = true): Promise =>
  new Promise((resolve: PromiseLike, reject: PromiseLike) => {
    fetch(request('get', route, null, requiresAuth))
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });

const post = (route: string, body: * = null, requiresAuth: boolean = true): Promise =>
  new Promise((resolve: PromiseLike, reject: PromiseLike) => {
    fetch(request('post', route, body, requiresAuth))
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });


const del = (route: string, requiresAuth: boolean = true): Promise =>
  new Promise((resolve: PromiseLike, reject: PromiseLike) => {
    fetch(request('delete', route, null, requiresAuth))
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });


const getAuthToken = (uid: string): Promise => post('auth/token', { uid }, false);
const getUser = (uid: string): Promise => get(`admin/${uid}`);
const getEvents = (): Promise => get('events');
const deleteEvent = (id: string): Promise => del(`events/${id}`);

module.exports = {
  get,
  post,
  url,
  getAuthToken,
  getUser,
  getEvents,
  deleteEvent,
};
