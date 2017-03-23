// @flow
import R from 'ramda';

const users = (state: UserMap = {}, action: ManageUsersAction): UserMap => {
  switch (action.type) {
    case 'SET_USERS':
      return action.users;
    case 'UPDATE_USER':
      return R.assoc(action.user.id, R.merge(state[action.user.id], action.user), state);
    case 'REMOVE_USER':
      return R.omit([action.userId], state);
    default:
      return state;
  }
};

export default users;





