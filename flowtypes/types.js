// @flow
import React from 'react';
/* eslint no-undef: "off" */
/* beautify preserve:start */

// API
declare type Headers = { 'Content-Type': 'application/json', jwt?: string };
declare type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

// Redux state(s)
declare type State = {
  currentUser: CurrentUserState,
  users: UserMap,
  events: BroadcastEventMap
};

// What persists in local storage
declare type LocalStorageState = {
  currentUser?: CurrentUserState
}

// Redux Actions
declare type Action = AuthAction | UserAction | ManageUsersAction | EventsAction | BroadcastAction | AlertAction;

// Redux dispatch, action creators, etc.
declare type ActionCreator = (*) => Action;
declare type Dispatch = (action: Action | Thunk | Array<Action>) => any; // eslint-disable-line flowtype/no-weak-types
declare type GetState = () => State;
declare type Thunk = (dispatch: Dispatch, getState: GetState) => any; // eslint-disable-line flowtype/no-weak-types
declare type ThunkActionCreator = (...*) => Thunk;


// React Component
declare type ReactComponent = React$Element<*> | React.CElement | null;

// Functions
declare type Unit = () => void;
declare type AsyncVoid = Promise<void>

// Forms
declare type FormErrors = null | { fields: { [field: string]: string, message: string } };

/**
 * Boilerplate React & Redux Types
 */

// http://www.saltycrane.com/blog/2016/06/flow-type-cheat-sheet/#lib/react.js
// React
declare class SyntheticEvent {
  bubbles: boolean,
  cancelable: boolean,
  currentTarget: EventTarget,
  defaultPrevented: boolean,
  eventPhase: number,
  isDefaultPrevented(): boolean,
  isPropagationStopped(): boolean,
  isTrusted: boolean,
  nativeEvent: Event,
  preventDefault(): void,
  stopPropagation(): void,
  +target: EventTarget,
  timeStamp: number,
  type: string,
  persist(): void
}
declare class SyntheticInputEvent extends SyntheticEvent {
  +target: HTMLInputElement,
  data: any // eslint-disable-line flowtype/no-weak-types
}

// Redux
declare type Reducer<S, A> = (state: S, action: A) => S;
declare type Store<S, Action> = {
  dispatch: Dispatch,
  getState(): S,
  subscribe(listener: () => void): () => void,
  replaceReducer(nextReducer: Reducer<S, Action>): void
};

// https://github.com/flowtype/flow-typed/blob/master/definitions/npm/react-redux_v5.x.x/flow_v0.30.x-/react-redux_v5.x.x.js
// It's probably easier to use in-line type definitions for these:
// eslint-disable-next-line flowtype/no-weak-types
declare type MapStateToProps<S, OP: Object, SP: Object> = (state: S, ownProps: OP) => SP | MapStateToProps<S, OP, SP>;
// eslint-disable-next-line flowtype/no-weak-types
declare type MapDispatchToProps<DP: Object> = ((dispatch: Dispatch) => DP) | DP;  // Modified to use single type
