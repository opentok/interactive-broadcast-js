import R from 'ramda';

/** Constants */
const url = 'http://localhost:3001/api';
const defaultHeaders = { 'Content-Type': 'application/json' };

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

type RequestOptions = {
  noJSON: boolean,
  headers: object
};

const request = (method: string, route: string, data: * = null, options: RequestOptions = {}): Promise => {
  const headers = options.headers || defaultHeaders;
  const body = data && !options.noJSON ? JSON.stringify(data) : data;
  return new Request(getURL(route), {
    method: method.toUpperCase(),
    mode: 'cors',
    headers: new Headers(headers),
    body,
  });
};

/** Exports */
const get = (route: string): Promise =>
  new Promise((resolve: PromiseLike, reject: PromiseLike) => {
    fetch(request('get', route))
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });

const post = (route: string, body: *, headers: object): Promise =>
  new Promise((resolve: PromiseLike, reject: PromiseLike) => {
    fetch(request('post', route, body, headers))
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });


const del = (route: string): Promise =>
  new Promise((resolve: PromiseLike, reject: PromiseLike) => {
    fetch(request('delete', route))
      .then(parseResponse)
      .then(resolve)
      .catch(reject);
  });


const getAdmin = (adminId: string): Promise => get(`admin/${adminId}`);
const getEvents = (): Promise => get('events');
const deleteEvent = (id: string): Promise => del(`events/${id}`);

module.exports = {
  get,
  post,
  url,
  getAdmin,
  getEvents,
  deleteEvent,
};
