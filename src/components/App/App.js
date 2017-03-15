// @flow
import React from 'react';
import Header from '../Header/Header';
import Alert from '../Alert/Alert';
import './App.css';

const App = ({ children }: { children: ReactComponent }): ReactComponent =>
  (<div className="App">
    <Alert />
    <Header />
    { children }
  </div>);

export default App;
