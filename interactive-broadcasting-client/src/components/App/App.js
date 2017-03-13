// @flow
import React from 'react';
import Header from '../Header/Header';
import './App.css';

const App = ({ children }: { children: ReactComponent }): ReactComponent =>
  (<div className="App">
    <Header />
    { children }
  </div>);

export default App;
