// @flow
import React from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import ReduxToastr from 'react-redux-toastr';
import routes from './routes';
import configureStore from './configureStore';
import './index.css';

render((
  <Provider store={configureStore()}>
    <div>
      { routes }
      <ReduxToastr
        timeOut={3000}
        preventDuplicates={true} // eslint-disable-line react/jsx-boolean-value
      />
    </div>
  </Provider>
), document.getElementById('root'));

