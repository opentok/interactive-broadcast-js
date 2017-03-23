// @flow
import { setAlert, resetAlert, setError } from './alert';
import { getAllUsers, deleteUserRecord, updateUser as update, createUser } from '../services/api';

const setUsers: ActionCreator = (users: UserMap): ManageUsersAction => ({
  type: 'SET_USERS',
  users,
});

const updateUser: ActionCreator = (user: User): ManageUsersAction => ({
  type: 'UPDATE_USER',
  user,
});

const removeUser: ActionCreator = (userId: string): ManageUsersAction => ({
  type: 'REMOVE_USER',
  userId,
});

const getUsers: ThunkActionCreator = (): Thunk =>
  (dispatch: Dispatch) => {
    getAllUsers()
      .then((users: UserMap): void => dispatch(setUsers(users)))
      .catch((error: Error): void => console.log(error));
  };

const confirmDeleteUser: ThunkActionCreator = (userId: string): Thunk =>
  (dispatch: Dispatch) => {
    deleteUserRecord(userId)
      .then(dispatch(removeUser(userId)))
      .catch((error: Error): void => console.log(error));
  };

const deleteUser: ThunkActionCreator = (userId: string): Thunk =>
  (dispatch: Dispatch) => {
    const onConfirm: Unit = () => {
      dispatch(resetAlert());
      dispatch(confirmDeleteUser(userId));
    };
    const onCancel: Unit = (): void => dispatch(resetAlert());
    const options: AlertOptions = {
      show: true,
      type: 'warning',
      title: 'Delete User',
      text: 'Are you sure you wish to delete this user?  All events associated with the user will also be deleted.',
      showCancelButton: true,
      onConfirm,
      onCancel,
    };
    dispatch(setAlert(options));
  };

const updateUserRecord: ThunkActionCreator = (userData: UserFormData): Thunk =>
  (dispatch: Dispatch) => {

    const onSuccess = () => {
      const onConfirm: Unit = () => {
        dispatch(resetAlert());
        dispatch(updateUser(userData));
      };
      const options: AlertOptions = {
        show: true,
        type: 'success',
        title: 'User Updated',
        text: `The user record for ${userData.displayName} has been updated.`,
        onConfirm,
      };
      dispatch(setAlert(options));
    };
    const onError = (): void => dispatch(setError('Failed to update user. Please check credentials and try again.'));

    update(userData)
      .then(onSuccess)
      .catch(onError);
  };

const createNewUser: ThunkActionCreator = (user: UserFormData): Thunk =>
  (dispatch: Dispatch) => {

    const onSuccess = () => {
      const onConfirm: Unit = () => {
        dispatch(resetAlert());
        dispatch(updateUser(user));
      };
      const options: AlertOptions = {
        show: true,
        type: 'success',
        title: 'User Created',
        text: `${user.displayName} has been created as a new user.`,
        onConfirm,
      };
      dispatch(setAlert(options));
    };
    const onError = (): void => dispatch(setError('Failed to create user. Please check credentials and try again.'));

    createUser(user)
      .then(onSuccess)
      .catch(onError);
  };

module.exports = {
  getUsers,
  deleteUser,
  createNewUser,
  updateUserRecord,
};
