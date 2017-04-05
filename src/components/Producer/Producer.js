// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import classNames from 'classnames';
import ProducerHeader from './components/ProducerHeader';
import ProducerSidePanel from './components/ProducerSidePanel';
import ProducerPrimary from './components/ProducerPrimary';
import { setBroadcastEvent, resetBroadcastEvent } from '../../actions/broadcast';
import './Producer.css';

/* beautify preserve:start */
type InitialProps = { params: { id?: string } };
type BaseProps = {
  user: User,
  eventId: EventId,
  broadcast: BroadcastState
};
type DispatchProps = {
  setEvent: EventId => void,
  resetEvent: Unit
};

type Props = InitialProps & BaseProps & DispatchProps;
/* beautify preserve:end */

class Producer extends Component {
  props: Props;
  state: { preshowStarted: boolean, showingSidePanel: boolean };
  startPreshow: Unit;
  toggleSidePanel: Unit;
  constructor(props: Props) {
    super(props);
    this.state = {
      preshowStarted: false,
      showingSidePanel: true,
    };
    this.toggleSidePanel = this.toggleSidePanel.bind(this);
  }

  toggleSidePanel() {
    this.setState({ showingSidePanel: !this.state.showingSidePanel });
  }

  componentWillMount() {
    const { setEvent, eventId } = this.props;
    setEvent(eventId);
  }

  componentWillUnmount() {
    this.props.resetEvent();
  }

  render(): ReactComponent {
    const { toggleSidePanel } = this;
    const { showingSidePanel } = this.state;
    return (
      <div className="Producer">
        <div className={classNames('Producer-main', { full: !showingSidePanel })} >
          <ProducerHeader showingSidePanel={showingSidePanel} toggleSidePanel={toggleSidePanel} />
          <ProducerPrimary />
        </div>
        <ProducerSidePanel hidden={!showingSidePanel} />
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => ({
  eventId: R.pathOr('', ['params', 'id'], ownProps),
  broadcast: R.prop('broadcast', state),
  user: R.prop('currentUser', state),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    setEvent: (eventId: EventId) => {
      dispatch(setBroadcastEvent(eventId));
    },
    resetEvent: () => {
      dispatch(resetBroadcastEvent());
    },
  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Producer));
