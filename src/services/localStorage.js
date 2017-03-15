// @flow

const storageKey = 'interactiveBroadcast';

export const loadState = (): LocalStorageState | void => {
  try {
    const serializedState = localStorage.getItem(storageKey);
    if (!serializedState) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    return undefined;
  }
};

export const saveState = (state: LocalStorageState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(storageKey, serializedState);
  } catch (error) {
    // Nothing to do, nowhere to go
  }
};
