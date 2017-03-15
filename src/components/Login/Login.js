// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import R from 'ramda';
import classNames from 'classnames';
import { authenticate } from '../../actions/auth';
import LoginForm from './components/LoginForm';
import logo from '../../images/logo.png';
import './Login.css';

/* beautify preserve:start */
type BaseProps = { auth: AuthState, user: User };
type DispatchProps = { authenticateUser: (credentials: AuthCredentials) => void };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

class Login extends Component {

  props: Props;

  state: {
    error: boolean
  };

  auth: Unit;
  onSubmit: Unit;
  resetError: Unit;
  validateAdmin: Unit;

  constructor(props: Props) {
    super(props);
    this.state = { error: false };
    this.resetError = this.resetError.bind(this);
  }

  componentDidMount() {
    const { user } = this.props;
    if (user) {
      browserHistory.push('/admin');
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const error = R.complement(R.isNil)(R.path(['auth', 'error'], nextProps));
    this.setState({ error });
  }

  resetError() {
    this.setState({ error: false });
  }

  render(): ReactComponent {
    const { resetError } = this;
    const { error } = this.state;
    const { authenticateUser } = this.props;
    return (
      <div className="Login">
        <div className="Login-header" >
          <img src={logo} alt="opentok" />
        </div>
        <LoginForm onSubmit={authenticateUser} onUpdate={resetError} error={error} />
        <div className={classNames('Login-error', { error })}>Please check your credentials and try again</div>
      </div>
    );
  }
}

const mapStateToProps = (state: State): BaseProps => R.pick(['auth', 'user'], state);
const mapDispatchToProps: MapDispatchToProps < DispatchProps > = (dispatch: Dispatch): DispatchProps =>
  ({
    authenticateUser: (credentials: AuthCredentials) => {
      dispatch(authenticate(credentials));
    },
  });
export default connect(mapStateToProps, mapDispatchToProps)(Login);
