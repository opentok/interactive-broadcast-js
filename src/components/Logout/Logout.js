import React from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router';
import Icon from 'react-fontawesome';
import { signOut } from '../../actions/auth';
import './Logout.css';

/* beautify preserve:start */
type BaseProps = { currentUser: User };
type DispatchProps = { logOutUser: Unit };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

const Logout = ({ currentUser, logOutUser }: Props): ReactElement =>
currentUser &&
  <span className="Logout">
    <Link to="/admin" className="link white">{currentUser.displayName}</Link>
    <span className="divider">|</span>
    <button className="Logout btn" onClick={logOutUser}>Logout <Icon name="sign-out" size="lg" /></button>
  </span>;

const mapStateToProps = (state: { currentUser: User }): Props => R.pick(['currentUser'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    logOutUser: () => {
      dispatch(signOut());
    },
  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Logout));
