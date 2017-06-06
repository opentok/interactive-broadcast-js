// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import classNames from 'classnames';
import Icon from 'react-fontawesome';
import Particpant from './Participant';
import { properCase } from '../../../../services/util';
import './ProducerPrimary.css';

/* beautify preserve:start */
type Props = {
  broadcast: BroadcastState
};
/* beautify preserve:end */

class ProducerPrimary extends Component {
  props: Props;
  state: { }
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render(): ReactComponent {
    const { inPrivateCall, viewers, interactiveLimit } = this.props.broadcast;
    return (
      <div className="ProducerPrimary admin-page-content">
        <div className="ProducerPrimary-info">
          <div className="viewers">
            <Icon name="user" /> {interactiveLimit ? `Viewers ${viewers} / ${interactiveLimit}` : 'Retrieving viewers . . .'}
          </div>
          <div className="time"><Icon name="clock-o" /> Elapsed time --:--:--</div>
          <div className={classNames('private-call', { active: !!inPrivateCall })}>
            You are in a private call with { inPrivateCall ? `the ${properCase(R.defaultTo('')(inPrivateCall))}` : '...' }
          </div>
        </div>
        <div className="ProducerPrimary-participants">
          <Particpant type="backstageFan" />
          <Particpant type="fan" />
          <Particpant type="host" />
          <Particpant type="celebrity" />
          <div id="videoproducer" className="producerContainer" />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State): Props => ({
  broadcast: R.prop('broadcast', state),
  user: R.prop('currentUser', state),
});

// Need withRouter???
export default withRouter(connect(mapStateToProps)(ProducerPrimary));
