// @flow
import React from 'react';
import './Loading.css';
import loadingImage from '../../images/loading.gif';

const Loading = (): ReactComponent =>
  <div className="Loading">
    <img src={loadingImage} alt="loading-img" />
  </div>;

export default Loading;
