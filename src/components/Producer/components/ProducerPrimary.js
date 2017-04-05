// @flow
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Icon from 'react-fontawesome';
import classNames from 'classnames';
import Particpant from './Participant';
import './ProducerPrimary.css';

/* beautify preserve:start */
type BaseProps = {
  user: User,
  broadcast: BroadcastState
};
type DispatchProps = {

};

type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

class ProducerPrimary extends Component {
  props: Props;
  state: { }
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  render(): ReactComponent {
    const event = R.defaultTo({})(R.path(['broadcast', 'event'], this.props));

    return (
      <div className="ProducerPrimary admin-page-content">
        <div className="ProducerPrimary-info">
          <div className="viewers"><Icon name="user" /> Viewers 0 / 10</div>
          <div className="time"><Icon name="clock-o" /> Elapsed time --:--:--</div>
        </div>
        <div className="ProducerPrimary-participants">
          <Particpant type="backstageFan" />
          <Particpant type="fan" />
          <Particpant type="host" />
          <Particpant type="celebrity" />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State): BaseProps => ({
  broadcast: R.prop('broadcast', state),
  user: R.prop('currentUser', state),
});

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({

  });

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ProducerPrimary));
