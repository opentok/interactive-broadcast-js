// @flow

const user = (state: UserState = null, action: UserAction): UserState => {
  switch (action.type) {
    case 'LOG_IN':
      return action.user;
    case 'LOG_OUT':
      return null;
    default:
      return state;
  }
};

export default user;





