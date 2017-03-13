import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter, browserHistory } from 'react-router';
import Icon from 'react-fontawesome';
import { logOut } from '../../actions/user';
import './Logout.css';

/* beautify preserve:start */
type BaseProps = { user: User };
type DispatchProps = { logOutUser: Unit };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

const Logout = ({ user, logOutUser }: Props): ReactElement =>
  user && <button className="Logout btn" onClick={logOutUser}>Logout <Icon name="sign-out" size="lg" /></button>;

const mapStateToProps = (state: { user: User }): Props => R.pick(['user'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    logOutUser: () => {
      dispatch(logOut());
    },
  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Logout));
