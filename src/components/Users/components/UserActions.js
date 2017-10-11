// @flow
import React from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Icon from 'react-fontawesome';
import { deleteUser as removeUser } from '../../../actions/users';
import './UserActions.css';

/** Event Actions */
type BaseProps = { user: User, toggleEditPanel: Unit };
type DispatchProps = { deleteUser: UserId => void };
type InitialProps = { adminId: string };
type Props = BaseProps & DispatchProps & InitialProps;
const UserActions = ({ user, deleteUser, toggleEditPanel, adminId }: Props): ReactComponent =>
  <div className="UserActions">
    <button className="btn action orange" onClick={toggleEditPanel}><Icon name="pencil" />Edit</button>
    { !adminId && <button className="btn action red" onClick={R.partial(deleteUser, [user.id])}><Icon name="remove" />Delete</button> }
  </div>;

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  adminId: R.path(['params', 'adminId'], ownProps),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    deleteUser: (userId: UserId) => {
      dispatch(removeUser(userId));
    },
  });
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(UserActions));
