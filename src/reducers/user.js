// @flow

const user = (state: UserState = null, action: UserAction): UserState => {
  switch (action.type) {
    case 'LOGIN':
      return action.user;
    case 'LOGOUT':
      return null;
    default:
      return state;
  }
};

export default user;





