// @flow
import { combineReducers } from 'redux';
import { reducer as toastr } from 'react-redux-toastr';

/** Reducers */
import user from './user';
import events from './events';

/** Combine Reducers */
const interactiveBroadcastApp = combineReducers({ user, events, toastr });

export default interactiveBroadcastApp;
