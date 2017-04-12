// @flow
import React, { Component } from 'react';
import './CelebrityHostBody.css';

class CelebrityHostBody extends Component {
  props: Props;

  componentDidMount() {
    this.props.connect();
  }

  render(): ReactComponent {
    return (
      <div className="CelebrityHostBody">
        <div className="VideoWrap">
          <div className="VideoWindow" id="videohost" />
        </div>
      </div>
    );
  }
}

export default CelebrityHostBody;
