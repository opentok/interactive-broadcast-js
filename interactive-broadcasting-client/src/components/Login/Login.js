// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter, browserHistory } from 'react-router';
import R from 'ramda';
import classNames from 'classnames';
import firebase from '../../services/firebase';
import LoginForm from './components/LoginForm';
import { validate } from '../../actions/user';
import logo from '../../images/logo.png';
import './Login.css';

/* beautify preserve:start */
type BaseProps = { user: User };
type DispatchProps = { validateAdmin: (user: User) => void };
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

class Login extends Component {

  props: Props;

  state: {
    error: boolean
  };

  auth: Unit;
  onSubmit: Unit;
  onError: Unit;
  validateAdmin: Unit;

  constructor(props: Props) {
    super(props);
    this.state = { error: false };
    this.auth = this.auth.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onError = this.onError.bind(this);
  }

  componentDidMount() {
    const { user } = this.props;
    if (user) {
      browserHistory.push('/admin');
    }
  }

  auth(email: string, password: string) {
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((data: Response): void => this.props.validateAdmin(R.prop('uid', data)))
      .catch(R.partial(this.onError, [true]));
  }

  onError(error: boolean = true) {
    this.setState({ error });
  }

  onSubmit(email: string, password: string) {
    this.onError(false);
    this.auth(email, password);
  }

  render(): ReactComponent {
    const { onSubmit, onError } = this;
    const { error } = this.state;
    return (
      <div className="Login">
        <div className="Login-header" >
          <img src={logo} alt="opentok" />
        </div>
        <LoginForm onSubmit={onSubmit} onUpdate={R.partial(onError, [false])} error={error} />
        <div className={classNames('Login-error', { error })}>Please check your credentials and try again</div>
      </div>
    );
  }
}

const mapStateToProps = (state: State): BaseProps => R.pick(['user'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    validateAdmin: (user: User) => {
      dispatch(validate(user));
    },
  });


export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Login));
