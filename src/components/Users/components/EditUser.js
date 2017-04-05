// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import uuid from 'uuid';
import './EditUser.css';
import { createNewUser, updateUserRecord } from '../../../actions/users';

const formFields = ['email', 'displayName', 'otApiKey', 'otSecret', 'broadcastEnabled', 'httpSupport'];

type BaseProps = { user: User, toggleEditPanel: Unit, newUser: boolean, errors: FormErrors };
type DispatchProps = { updateUser: UserFormData => void, createUser: UserFormData => void };
type Props = BaseProps & DispatchProps;
class EditUser extends Component {

  props: Props;
  state: {
    fields: UserFormData,
    errors: FormErrors,
    submissionAttemped: boolean
  };
  handleChange: (string, SyntheticInputEvent) => void;
  hasErrors: () => boolean;
  handleSubmit: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      fields: R.pick(formFields, props.user),
      errors: null,
      submissionAttemped: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.hasErrors = this.hasErrors.bind(this);
  }

  hasErrors(): boolean {
    const userData = this.state.fields;
    const isEmptyField = (acc: string[], field: string): string[] => R.isEmpty(userData[field]) ? R.append(field, acc) : acc;
    const emptyFields = R.reduce(isEmptyField, [], R.keys(userData));
    if (R.isEmpty(emptyFields)) {
      this.setState({ errors: null });
      return false;
    }
    const errors = {
      fields: R.zipObj(emptyFields, R.times((): true => true, R.length(emptyFields))),
      message: 'Fields cannot be empty',
    };
    this.setState({ errors });
    return true;
  }

  handleSubmit(e: SyntheticInputEvent) {
    e.preventDefault();
    this.setState({ submissionAttemped: true });
    if (this.hasErrors()) { return; }
    const userData = R.prop('fields', this.state);
    const { newUser, user, toggleEditPanel, createUser, updateUser } = this.props;
    const initial = R.pick(formFields, this.props.user);

    if (!R.equals(initial, userData)) {
      if (newUser) {
        createUser(R.assoc('password', uuid(), userData));
      } else {
        updateUser(R.assoc('id', user.id, userData));
        toggleEditPanel();
      }
    } else {
      !newUser && toggleEditPanel();
    }
  }

  handleChange(e: SyntheticInputEvent) {
    const value = e.target.type === 'checkbox' ? !e.target.checked : e.target.value;
    const field = e.target.name;
    this.setState({ fields: R.assoc(field, value, this.state.fields) });
    this.state.submissionAttemped && this.hasErrors();
  }

  render(): ReactComponent {
    const { errors, fields } = this.state;
    const { email, displayName, otApiKey, otSecret, broadcastEnabled, httpSupport } = fields;
    const { toggleEditPanel, newUser } = this.props;
    const { handleSubmit, handleChange } = this;
    const errorFields = R.propOr({}, 'fields', errors);
    return (
      <div className="EditUser">
        <form className="EditUser-form" onSubmit={handleSubmit}>
          <div className="edit-user-top">
            <div className="input-container">
              <Icon className="icon" name="envelope" style={{ color: 'darkgrey' }} />
              <input
                className={classNames({ error: errorFields.email })}
                type="email"
                value={email}
                name="email"
                onChange={handleChange}
                placeholder="Email"
                disabled={!newUser}
              />
            </div>
            <div className="input-container">
              <Icon className="icon" name="user" style={{ color: 'darkgrey' }} />
              <input
                className={classNames({ error: errorFields.displayName })}
                type="text"
                value={displayName}
                name="displayName"
                onChange={handleChange}
                placeholder="Name"
              />
            </div>
            <div className="input-container">
              <Icon className="icon" name="key" style={{ color: 'darkgrey' }} />
              <input
                className={classNames({ error: errorFields.otApiKey })}
                type="text"
                value={otApiKey}
                name="otApiKey"
                placeholder="OT API Key"
                onChange={handleChange}
              />
            </div>
            <div className="input-container">
              <Icon className="icon" name="user-secret" style={{ color: 'darkgrey' }} />
              <input
                className={classNames({ error: errorFields.otSecret })}
                type="password"
                value={otSecret}
                name="otSecret"
                placeholder="OT API Secret"
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="edit-user-bottom">
            <div className="input-container">
              <input type="checkbox" name="broadcastEnabled" checked={!!broadcastEnabled} onChange={handleChange} />
              <span className="label">Broadcast Support Enabled</span>
            </div>
            <div className="input-container">
              <input type="checkbox" name="httpSupport" checked={!!httpSupport} onChange={handleChange} />
              <span className="label">HTTP Support Enabled</span>
            </div>
            <input type="submit" className="btn action green" value={newUser ? 'Create User' : 'Save'} />
            { !newUser && <button className="btn action green" onClick={toggleEditPanel}>Cancel</button> }
          </div>
        </form>
      </div>
    );
  }
}

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    updateUser: (userData: UserFormData) => {
      dispatch(updateUserRecord(userData));
    },
    createUser: (userData: UserFormData) => {
      dispatch(createNewUser(userData));
    },
  });

export default connect(null, mapDispatchToProps)(EditUser);
