// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import UserActions from './UserActions';
import EditUser from './EditUser';
import AddUser from './AddUser';
import { deleteUser } from '../../../actions/users';
import './UserList.css';



type ListItemProps = { user: User };
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
    const { user } = this.props;
    const { editingUser } = this.state;
    const { toggleEditPanel } = this;
    return (
      <div className="UserList-item admin-page-list-item" key={user.id}>
        { !editingUser &&
          <div className="user-info">
            <span className="name">{user.displayName}</span>
            <span className="email">[ {user.email} ]</span>
          </div>
        }
        { editingUser ? <EditUser user={user} toggleEditPanel={toggleEditPanel} /> : <UserActions user={user} toggleEditPanel={toggleEditPanel} /> }
      </div>
    );
  }
}

type BaseProps = { users: User[] };
type DispatchProps = { delete: UserId => void };
type Props = BaseProps & DispatchProps;
const renderUser = (user: User): ReactComponent => <UserListItem key={user.id} user={user} />;
const UserList = ({ users }: Props): ReactComponent =>
  <ul className="UserList admin-page-list">
    {
      R.ifElse(
        R.isEmpty,
        (): null => null,
        R.map(renderUser) // eslint-disable-line comma-dangle
      )(R.values(users))
    }
    <AddUser />
  </ul>;


const mapStateToProps = (state: State): BaseProps => R.pick(['users'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    delete: (userId: UserId) => {
      dispatch(deleteUser(userId));
    },
  });
export default connect(mapStateToProps, mapDispatchToProps)(UserList);
