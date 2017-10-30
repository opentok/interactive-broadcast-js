// @flow
import React, { Component } from 'react';
import scriptLoader from 'react-async-script-loader';
import './FanHLSPlayer.css';

type Props = {
  hlsUrl: string,
  isLive: EventStatus
};

class FanHLSPlayer extends Component {
  props: Props;
  start: Unit;

  componentDidMount() {
    const { isLive } = this.props;
    if (isLive) this.start();
  }

  componentWillReceiveProps() {
    const { isLive } = this.props;
    if (isLive && !window.flowplayer) this.start();
  }

  start() {
    const { hlsUrl } = this.props;
    setTimeout(() => {
      window.flowplayer('#hlsjslive', {
        splash: false,
        embed: false,
        ratio: 9 / 16,
        autoplay: true,
        clip: {
          autoplay: true,
          live: true,
          sources: [{
            type: 'application/x-mpegurl',
            src: hlsUrl,
          }],
        },
      });
    }, 1000);
  }

  render(): ReactComponent {
    return (
      <div className="FanHLSPlayer">
        <div id="hlsjslive" className="fp-minimal" />
      </div>);
  }
}

export default scriptLoader(
  [
    'https://releases.flowplayer.org/7.2.1/flowplayer.min.js',
    'https://releases.flowplayer.org/hlsjs/flowplayer.hlsjs.min.js',
  ],
  '/assets/bootstrap-markdown.js',
)(FanHLSPlayer);
