// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import uuid from 'uuid';
import './EditUser.css';
import { createNewUser, updateUserRecord } from '../../../actions/users';

const emptyUser: UserFormData = {
  email: '',
  displayName: '',
  otApiKey: '',
  otSecret: '',
  hls: true,
  httpSupport: false,
};

const formFields = ['email', 'displayName', 'hls', 'httpSupport'];

type BaseProps = {
  user: null | User,
  toggleEditPanel: Unit,
  newUser: boolean,
  errors: FormErrors
};
type DispatchProps = {
  updateUser: UserFormData => void,
  createUser: UserFormData => Promise<void>
};
type Props = BaseProps & DispatchProps;
class EditUser extends Component {

  props: Props;
  state: {
    fields: UserFormData,
    errors: FormErrors,
    submissionAttemped: boolean,
    showCredentials: boolean
  };
  handleChange: (string, SyntheticInputEvent) => void;
  hasErrors: () => boolean;
  toggleCredentials: () => void;
  handleSubmit: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      fields: props.user ? R.pick(formFields, props.user) : emptyUser,
      errors: null,
      submissionAttemped: false,
      showCredentials: false,
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.hasErrors = this.hasErrors.bind(this);
    this.toggleCredentials = this.toggleCredentials.bind(this);
  }

  hasErrors(): boolean {
    const userData = this.state.fields;
    const isRequired = (field: string): boolean => field === 'displayName' || field === 'email';
    const isEmptyField = (acc: string[], field: string): string[] => R.isEmpty(userData[field]) && isRequired(field) ? R.append(field, acc) : acc;
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

  async handleSubmit(e: SyntheticInputEvent): AsyncVoid {
    e.preventDefault();
    this.setState({ submissionAttemped: true });
    if (this.hasErrors()) { return; }
    let userData = R.prop('fields', this.state);
    const { newUser, toggleEditPanel, createUser, updateUser } = this.props;
    const user = R.defaultTo({}, this.props.user);
    const initial = R.pick(formFields, user);

    if (!R.equals(initial, userData)) {
      if (newUser) {
        await createUser(R.assoc('password', uuid(), userData));
        this.setState({ fields: emptyUser });
      } else {
        userData = R.assoc('id', user.id, userData);
        userData = !userData.otApiKey && !userData.otSecret ? R.omit(['otApiKKey', 'otSecret'], userData) : userData;
        updateUser(userData);
        toggleEditPanel();
      }
    } else {
      !newUser && toggleEditPanel();
    }
  }

  toggleCredentials() {
    this.setState({ showCredentials: !this.state.showCredentials });
  }

  handleChange(e: SyntheticInputEvent) {
    const field = e.target.name;
    const value = e.target.type === 'checkbox' ? !this.state.fields[field] : e.target.value;
    this.setState({ fields: R.assoc(field, value, this.state.fields) });
    this.state.submissionAttemped && this.hasErrors();
  }

  render(): ReactComponent {
    const { errors, fields, showCredentials } = this.state;
    const { email, displayName, otApiKey, otSecret, hls, httpSupport } = fields;
    const { toggleEditPanel, newUser } = this.props;
    const { handleSubmit, handleChange } = this;
    const errorFields = R.propOr({}, 'fields', errors);
    const shouldShowCredentials = newUser || showCredentials;
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
            { !shouldShowCredentials && <button className="btn action orange" onClick={this.toggleCredentials}>Change OT credentials</button> }
            { shouldShowCredentials &&
              <div className="input-container">
                <Icon className="icon" name="key" style={{ color: 'darkgrey' }} />
                <input
                  className={classNames({ error: errorFields.otApiKey })}
                  type="text"
                  name="otApiKey"
                  value={otApiKey}
                  placeholder="OT API Key (optional)"
                  onChange={handleChange}
                />
              </div>
            }
            { shouldShowCredentials &&
              <div className="input-container">
                <Icon className="icon" name="user-secret" style={{ color: 'darkgrey' }} />
                <input
                  className={classNames({ error: errorFields.otSecret })}
                  type="password"
                  name="otSecret"
                  value={otSecret}
                  placeholder="OT API Secret (optional)"
                  onChange={handleChange}
                  autoComplete="new-password"
                  size={42}
                />
              </div>
            }
          </div>
          <div className="edit-user-bottom">
            <div className="input-container">
              <input type="checkbox" name="hls" checked={!!hls} onChange={handleChange} />
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
    createUser: async (userData: UserFormData): AsyncVoid => dispatch(createNewUser(userData)),
  });

export default connect(null, mapDispatchToProps)(EditUser);
