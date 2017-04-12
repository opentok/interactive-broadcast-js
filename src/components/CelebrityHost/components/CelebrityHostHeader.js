// @flow
import React, { Component } from 'react';
import './CelebrityHostHeader.css';

class CelebrityHostHeader extends Component {
  props: Props;

  componentDidMount() {

  }

  render(): ReactComponent {
    const { userType, name } = this.props;
    return (
      <div className="CelebrityHostHeader">
        <div className="Title">
          <h4>{name}<sup>Preshow</sup></h4>
          <div>
            <button className="btn">PUBLISH ONLY OFF</button>
          </div>
          <ul>
            <li>
              <span>{userType}</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}

export default CelebrityHostHeader;
