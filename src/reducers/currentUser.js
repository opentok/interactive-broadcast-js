// @flow

const user = (state: CurrentUserState = null, action: UserAction): CurrentUserState => {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return action.user;
    default:
      return state;
  }
};

export default user;





