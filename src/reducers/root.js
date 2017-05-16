// @flow
import { combineReducers } from 'redux';
import { reducer as toastr } from 'react-redux-toastr';

/** Reducers */
import auth from './auth';
import currentUser from './currentUser';
import users from './users';
import events from './events';
import broadcast from './broadcast';
import alert from './alert';
import fan from './fan';

/** Combine Reducers */
const interactiveBroadcastApp = combineReducers({ auth, currentUser, users, events, broadcast, alert, toastr, fan });

export default interactiveBroadcastApp;
