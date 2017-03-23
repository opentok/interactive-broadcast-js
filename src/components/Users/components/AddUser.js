// @flow
import React from 'react';
import Icon from 'react-fontawesome';
import EditUser from './EditUser';
import './AddUser.css';

const emptyUser: UserFormData = {
  email: '',
  displayName: '',
  otApiKey: '',
  otSecret: '',
  broadcastEnabled: true,
  httpSupport: false,
};

const AddUser = (): ReactComponent =>
  <div className="AddUser admin-page-list-item">
    <div className="header-container">
      <Icon name="user" size="lg" style={{ color: '#607d8b' }} />
      <h4>Create New User</h4>
    </div>
    <EditUser user={emptyUser} newUser />
  </div>;

export default AddUser;
