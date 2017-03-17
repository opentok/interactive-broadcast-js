// @flow
import React, { Component } from 'react';
import R from 'ramda';
import Icon from 'react-fontawesome';
import './LoginForm.css';
import TextInput from '../../Common/TextInput';

/* beautify preserve:start */
type Props = {
  onSubmit: Unit,
  onUpdate: Unit,
  error: boolean,
  forgotPassword: boolean
};
/* beautify preserve:end */

class LoginForm extends Component {

  props: Props;
  state: {
    fields: {
      email: string,
      password: string
    }
  }
  handleSubmit: Unit;
  handleChange: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      fields: {
        email: '',
        password: '',
      },
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleSubmit(e: SyntheticInputEvent) {
    e.preventDefault();
    const { onSubmit } = this.props;
    const { email, password } = this.state.fields;
    onSubmit({ email, password });
  }

  handleChange(field: string, e: SyntheticInputEvent) {
    const { onUpdate } = this.props;
    const { fields } = this.state;
    onUpdate();
    this.setState({ fields: R.assoc(field, e.target.value, fields) });
  }

  render(): ReactComponent {
    const { handleSubmit, handleChange } = this;
    const { error, forgotPassword } = this.props;
    const { email, password } = this.state.fields;
    const submitText = forgotPassword ? 'RESET PASSWORD' : 'SIGN IN';
    return (
      <form className="LoginForm" onSubmit={handleSubmit}>
        <div className="input-container">
          <Icon className="icon" name="envelope" style={{ color: 'darkgrey' }} />
          <TextInput type="email" value={email} handleChange={handleChange} error={error} />
        </div>
        { !forgotPassword &&
          <div className="input-container">
            <Icon className="icon" name="key" style={{ color: 'darkgrey' }} />
            <TextInput type="password" value={password} handleChange={handleChange} error={error} />
          </div>
        }
        <div className="input-container">
          <input className="btn" type="submit" value={submitText} />
        </div>
      </form>
    );
  }
}

export default LoginForm;
