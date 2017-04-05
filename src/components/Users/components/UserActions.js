// @flow
import React from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import Icon from 'react-fontawesome';
import { deleteUser as removeUser } from '../../../actions/users';
import './UserActions.css';

/** Event Actions */
type BaseProps = { user: User, toggleEditPanel: Unit };
type DispatchProps = { deleteUser: UserId => void };
type Props = BaseProps & DispatchProps;
const UserActions = ({ user, deleteUser, toggleEditPanel }: Props): ReactComponent =>
  <div className="UserActions">
    <button className="btn action orange" onClick={toggleEditPanel}><Icon name="pencil" />Edit</button>
    <button className="btn action red" onClick={R.partial(deleteUser, [user.id])}><Icon name="remove" />Delete</button>
  </div>;

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    deleteUser: (userId: UserId) => {
      dispatch(removeUser(userId));
    },
  });
export default connect(null, mapDispatchToProps)(UserActions);
