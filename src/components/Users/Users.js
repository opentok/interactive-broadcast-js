// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { browserHistory, Link } from 'react-router';
import { getUsers } from '../../actions/users';
import UserList from './components/UserList';
import './Users.css';

/* beautify preserve:start */
type BaseProps = { currentUser: User} ;
type DispatchProps = { loadUsers: Unit };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

class Users extends Component {
  props: Props;

  componentWillMount() {
    if (!this.props.currentUser.superAdmin) {
      browserHistory.replace('/');
    }
  }

  componentDidMount() {
    this.props.loadUsers(this.props.currentUser.id);
  }

  render(): ReactComponent {
    return (
      <div className="Users">
        <div className="UsersHeader admin-page-header">
          <Link to="admin">Back to Events</Link>
          <h3>Users</h3>
        </div>
        <div className="admin-page-content">
          <UserList />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State): BaseProps => R.pick(['currentUser'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    loadUsers: () => {
      dispatch(getUsers());
    },
  });
export default connect(mapStateToProps, mapDispatchToProps)(Users);
