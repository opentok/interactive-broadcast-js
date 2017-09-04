// @flow
import React from 'react';
import R from 'ramda';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import truncate from 'lodash.truncate';
import Icon from 'react-fontawesome';
import CopyToClipboard from '../../../Common/CopyToClipboard';
import createUrls from '../../../../services/eventUrls';
import { changeStatus, goLive } from '../../../../actions/producer';
import './ProducerHeader.css';

type InitialProps = {
  showingSidePanel: boolean,
  toggleSidePanel: Unit
};

type BaseProps = {
  broadcast: BroadcastState,
  currentUser: User
};

type DispatchProps = {
  goLive: string => void,
  endShow: string => void
};

type Props = InitialProps & BaseProps & DispatchProps;

const ProducerHeader = ({ broadcast, showingSidePanel, toggleSidePanel, currentUser, goLive, endShow }: Props): ReactComponent => {
  const event = R.defaultTo({})(broadcast.event);
  const { status, archiveId } = event;
  const { connected, archiving, disconnected } = broadcast;
  const { fanAudioUrl } = createUrls(event);

  return (
    <div className="ProducerHeader">
      <div className="ProducerHeader-info">
        <Link to="/admin">Back to Events</Link>
        <h3>{ event.name }</h3>
        <div className="post-production-url">
          <span className="label">POST-PRODUCTION URL:</span>
          <Link to={fanAudioUrl}>{truncate(fanAudioUrl, { length: 85 })}</Link>
          <CopyToClipboard text={fanAudioUrl} onCopyText="Post-Production URL" >
            <button className="btn white">COPY</button>
          </CopyToClipboard>
        </div>
      </div>
      <div className="ProducerHeader-controls">
        { status === 'live' && (archiving || archiveId) &&
          <span className="event-status live">
            <i className="fa fa-circle" /><span> ARCHIVING</span>
          </span>
        }
        { status === 'preshow' && !disconnected &&
          <button className="btn white go-live" onClick={R.partial(goLive, [event.id])}>
            <Icon className="icon" name={connected ? 'circle' : 'spinner'} />
            { connected ? 'GO LIVE' : 'CONNECTING' }
          </button>
        }
        { status === 'live' && !disconnected &&
          <button className="btn red end-show" onClick={R.partial(endShow, [event.id])}>
            <Icon className="icon" name="times" />
            END SHOW
          </button>
        }
        <CopyToClipboard text={currentUser.id} onCopyText="Admin ID" >
          <button className="btn white copy-admin-id">COPY ADMIN ID</button>
        </CopyToClipboard>
        <button className="btn white" onClick={toggleSidePanel}>
          <Icon name={showingSidePanel ? 'caret-square-o-right' : 'caret-square-o-left'} />
        </button>
      </div>
    </div>);
};
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    goLive: (id: string) => {
      dispatch(goLive(id));
    },
    endShow: (id: string) => {
      dispatch(changeStatus(id, 'closed'));
    },
  });
const mapStateToProps = (state: State): BaseProps => R.pick(['currentUser', 'broadcast'], state);
export default connect(mapStateToProps, mapDispatchToProps)(ProducerHeader);
