// @flow
import { combineReducers } from 'redux';
import { reducer as toastr } from 'react-redux-toastr';

/** Reducers */
import auth from './auth';
import user from './user';
import events from './events';
import alert from './alert';

/** Combine Reducers */
const interactiveBroadcastApp = combineReducers({ auth, user, events, alert, toastr });

export default interactiveBroadcastApp;
