import R from 'ramda';
import { loadAuthToken as jwt } from './localStorage';

/** Constants */
const url = 'http://localhost:3001/api';
const defaultHeaders = { 'Content-Type': 'application/json' };
type Headers = { 'Content-Type': 'application/json', jwt?: string };
const headers = (requiresAuth: boolean): Headers => R.merge(defaultHeaders, requiresAuth ? { Authorization: `Bearer ${jwt()}` } : null);

/** Helper methods */

// Check for external route containing http/https
const getURL = (route: string): string => route.includes('http') ? route : `${url}/${route}`;

// Parse response based on type
const parseResponse = (response: Response): * => {
  const contentType = R.head(R.split(';')(R.defaultTo('')(response.headers.get('content-type'))));
  if (contentType === 'application/json') {
    return response.json();
  } else if (contentType === 'text/html') {
    return response.text();
  }
};

const checkStatus = (response: Response): PromiseLike =>
  new Promise((resolve: PromiseLike, reject: PromiseLike): Promise => {
    if (response.status >= 200 && response.status < 300) {
      return resolve(response);
    }
    parseResponse(response)
      .then(({ message }: { message: string }): PromiseLike => reject(new Error(message)))
      .catch(reject);
  });

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
      .then(checkStatus)
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });

const post = (route: string, body: * = null, requiresAuth: boolean = true): Promise =>
  new Promise((resolve: PromiseLike, reject: PromiseLike) => {
    fetch(request('post', route, body, requiresAuth))
      .then(checkStatus)
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });

const patch = (route: string, body: * = null, requiresAuth: boolean = true): Promise =>
  new Promise((resolve: PromiseLike, reject: PromiseLike) => {
    fetch(request('patch', route, body, requiresAuth))
      .then(checkStatus)
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });

const del = (route: string, requiresAuth: boolean = true): Promise =>
  new Promise((resolve: PromiseLike, reject: PromiseLike) => {
    fetch(request('delete', route, null, requiresAuth))
      .then(checkStatus)
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });

/** Auth */
const getAuthToken = (userId: string): Promise => post('auth/token', { uid: userId }, false);

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
const deleteEvent = (id: string): Promise => del(`events/${id}`);

/** Exports */

module.exports = {
  getAuthToken,
  getUser,
  createUser,
  updateUser,
  getAllUsers,
  getEvent,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  deleteUserRecord,
};
