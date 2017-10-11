// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import R from 'ramda';
import UserActions from './UserActions';
import EditUser from './EditUser';
import AddUser from './AddUser';
import { deleteUser } from '../../../actions/users';
import './UserList.css';

type ListItemProps = { user: User, adminId: string };
class UserListItem extends Component {
  props: ListItemProps;
  state: { editingUser: false };
  toggleEditPanel: Unit;

  constructor(props: ListItemProps) {
    super(props);
    this.state = { editingUser: false };
    this.toggleEditPanel = this.toggleEditPanel.bind(this);
  }

  toggleEditPanel() {
    this.setState({ editingUser: !this.state.editingUser });
  }

  render(): ReactComponent {
    const { user, adminId } = this.props;
    const { editingUser } = this.state;
    const { toggleEditPanel } = this;
    const hasAPIKey = (user && user.otApiKey);
    return (
      <div>
        { !hasAPIKey && adminId && <div className="EditUser-warning">
          <i className="fa fa-warning" />Please complete your APIKey and Secret
        </div>
        }
        <div className="UserList-item admin-page-list-item" key={user.id}>
          { !editingUser &&
            <div className="user-info">
              <span className="name">{user.displayName}</span>
              <span className="email">[ {user.email} ]</span>
            </div>
          }
          { editingUser ? <EditUser user={user} toggleEditPanel={toggleEditPanel} /> : <UserActions user={user} toggleEditPanel={toggleEditPanel} /> }
        </div>
      </div>
    );
  }
}

type BaseProps = { users: User[], currentUser: User };
type DispatchProps = { delete: UserId => void };
type InitialProps = { adminId: string };
type Props = BaseProps & DispatchProps & InitialProps;
const renderUser = (user: User, adminId: string): ReactComponent =>
  <UserListItem key={user.id} user={user} adminId={adminId} />;
const UserList = ({ users, adminId, currentUser }: Props): ReactComponent =>
  <ul className="UserList admin-page-list">
    {
      !adminId && R.ifElse(
        R.isEmpty,
        (): null => null,
        R.map(renderUser) // eslint-disable-line comma-dangle
      )(R.values(users))
    }
    { adminId && renderUser(currentUser, adminId) }
    { !adminId && <AddUser /> }
  </ul>;


const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  users: R.path(['users'], state),
  adminId: R.path(['params', 'adminId'], ownProps),
  currentUser: R.path(['currentUser'], state),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    delete: (userId: UserId) => {
      dispatch(deleteUser(userId));
    },
  });
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(UserList));
