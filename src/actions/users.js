// @flow
import { resetAlert, setError, setWarning, setSuccess } from './alert';
import { getAllUsers, deleteUserRecord, updateUser as update, createUser } from '../services/api';

const setUsers: ActionCreator = (users: UserMap): ManageUsersAction => ({
  type: 'SET_USERS',
  users,
});

const updateUser: ActionCreator = (user: User): ManageUsersAction => ({
  type: 'UPDATE_USER',
  user,
});

const removeUser: ActionCreator = (userId: UserId): ManageUsersAction => ({
  type: 'REMOVE_USER',
  userId,
});

const getUsers: ThunkActionCreator = (): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      const users = await getAllUsers();
      dispatch(setUsers(users));
    } catch (error) {
      console.log(error);
    }
  };

const confirmDeleteUser: ThunkActionCreator = (userId: UserId): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      await deleteUserRecord(userId);
      dispatch(removeUser(userId));
    } catch (error) {
      console.log(error);
    }
  };

const deleteUser: ThunkActionCreator = (userId: UserId): Thunk =>
  (dispatch: Dispatch) => {
    const options: AlertPartialOptions = {
      title: 'Delete User',
      text: 'Are you sure you wish to delete this user?  All events associated with the user will also be deleted.',
      showCancelButton: true,
      onConfirm: (): void => dispatch(resetAlert()) && dispatch(confirmDeleteUser(userId)),
      onCancel: (): void => dispatch(resetAlert()),
    };
    dispatch(setWarning(options));
  };

const updateUserRecord: ThunkActionCreator = (userData: UserFormData): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      await update(userData);
      const options: AlertPartialOptions = {
        title: 'User Updated',
        text: `The user record for ${userData.displayName} has been updated.`,
        onConfirm: (): void => dispatch(resetAlert()) && dispatch(updateUser(userData)),
      };
      dispatch(setSuccess(options));
    } catch (error) {
      dispatch(setError('Failed to update user. Please check credentials and try again.'));
    }
  };

const createNewUser: ThunkActionCreator = (user: UserFormData): Thunk =>
  async (dispatch: Dispatch): AsyncVoid => {
    try {
      await createUser(user);
      const options: AlertPartialOptions = {
        title: 'User Created',
        text: `${user.displayName} has been created as a new user.`,
        onConfirm: (): void => dispatch(resetAlert()) && dispatch(updateUser(user)),
      };
      dispatch(setSuccess(options));
    } catch (error) {
      dispatch(setError('Failed to create user. Please check credentials and try again.'));
    }
  };

module.exports = {
  getUsers,
  deleteUser,
  createNewUser,
  updateUserRecord,
};
