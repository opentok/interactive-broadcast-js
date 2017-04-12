// @flow
/* eslint no-unused-vars: "off" */
import React, { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { validateUser } from '../../actions/auth';
import { getEventData } from '../../actions/events';
import CelebrityHostHeader from './components/CelebrityHostHeader';
import CelebrityHostBody from './components/CelebrityHostBody';
import Loading from '../../components/Common/Loading';
import { connectCelebHost } from '../../services/opentok';
import './CelebrityHost.css';

/* beautify preserve:start */
type InitialProps = { params: { hostUrl: string, celebrityUrl: string, adminId: string } };
type Props = InitialProps & BaseProps;
/* beautify preserve:end */

class CelebrityHost extends Component {

  props: Props;
  connect: Unit;

  constructor(props: Props) {
    super(props);
    this.connect = this.connect.bind(this);
  }

  componentDidMount() {
    const { adminId, userType, userUrl, getEvent } = this.props;
    getEvent(adminId, userType, userUrl);
  }

  connect(): Unit {
    const { userType } = this.props;
    const { apiKey, stageToken } = this.props.eventData;
    const { stageSessionId } = this.props.eventData.event;
    const options = {
      apiKey,
      stageSessionId,
      stageToken,
      userType,
    };
    connectCelebHost(options);
  }

  render(): ReactComponent {
    const { eventData, userType } = this.props;
    if (!eventData) return <Loading />;
    return (
      <div className="CelebrityHost">
        <div className="Container">
          <CelebrityHostHeader name={eventData.event.name} userType={userType} />
          <CelebrityHostBody eventData={eventData} connect={this.connect} userType={userType} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: State, ownProps: InitialProps): BaseProps => {
  const { hostUrl, celebrityUrl } = ownProps.params;
  return {
    adminId: R.path(['params', 'adminId'], ownProps),
    userType: R.path(['route', 'userType'], ownProps),
    userUrl: hostUrl || celebrityUrl,
    eventData: R.path(['events', 'eventData'], state),
  };
};

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
({
  getEvent: async (adminId: string, userType: string, userUrl: string): void => {
    await dispatch(validateUser(adminId, userType, userUrl));
    dispatch(getEventData(adminId, userType, userUrl));
  },
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(CelebrityHost));
