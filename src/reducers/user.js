// @flow

const user = (state: UserState = null, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_USER':
      return action.user;
    default:
      return state;
  }
};

export default user;





