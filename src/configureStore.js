// @flow
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import throttle from 'lodash.throttle';
import { loadState, saveState } from './services/localStorage';
import interactiveBroadcastApp from './reducers/root';

const configureStore = (): Store<State> => {
  const persistedState = loadState();
  const store = createStore(
    interactiveBroadcastApp,
    persistedState,
    applyMiddleware(thunk) // eslint-disable-line comma-dangle
    );

  // What do we want to persist to local storage?
  store.subscribe(throttle(() => {
    saveState({
      auth: store.getState().auth,
      user: store.getState().user,
    });
  }, 1000));

  return store;
};

export default configureStore;
