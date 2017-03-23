// @flow
import { combineReducers } from 'redux';
import { reducer as toastr } from 'react-redux-toastr';

/** Reducers */
import auth from './auth';
import currentUser from './currentUser';
import users from './users';
import events from './events';
import alert from './alert';

/** Combine Reducers */
const interactiveBroadcastApp = combineReducers({ auth, currentUser, users, events, alert, toastr });

export default interactiveBroadcastApp;
