// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { browserHistory, Link } from 'react-router';
import { getUsers } from '../../actions/users';
import UserList from './components/UserList';
import './Users.css';

/* beautify preserve:start */
type InitialProps = { params: { adminId: string } };
type BaseProps = {
  adminId: string,
  currentUser: User
};
type DispatchProps = { loadUsers: Unit };
type Props = InitialProps & BaseProps & DispatchProps;


/* beautify preserve:end */

class Users extends Component {
  props: Props;

  componentWillMount() {
    if (!this.props.currentUser.superAdmin && this.props.currentUser.id !== this.props.adminId) {
      browserHistory.replace('/');
    }
  }

  componentDidMount() {
    this.props.loadUsers();
  }

  render(): ReactComponent {
    const { adminId } = this.props;
    return (
      <div className="Users">
        <div className="UsersHeader admin-page-header">
          <Link to="admin">Back to Events</Link>
          <h3>{ !adminId ? 'Users' : 'My profile' }</h3>
        </div>
        <div className="admin-page-content">
          <UserList />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  adminId: R.path(['params', 'adminId'], ownProps),
  currentUser: R.path(['currentUser'], state),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    loadUsers: () => {
      dispatch(getUsers());
    },
  });
export default connect(mapStateToProps, mapDispatchToProps)(Users);
