import React from 'react';
import { connect } from 'react-redux';
import R from 'ramda';
import Icon from 'react-fontawesome';
import classNames from 'classnames';
import CopyToClipboard from '../../Common/CopyToClipboard';
import createUrls from '../../../services/eventUrls';
import './Participant.css';

const isBackstageFan = R.equals('backstageFan');
const getHeaderLabel = (type: ParticipantType): string =>
  R.toUpper(isBackstageFan(type) ? 'backstage fan' : type);

type Props = {
  type: ParticpantType,
  broadcast: BroadcastState
};

const Participant = ({ type, broadcast }: Props): ReactComponent => {
  const url = R.prop(`${type}Url`, createUrls(broadcast.event || {}));
  return (
    <div className="Participant">
      <div className="Participant-header">
        <span className="label" >{ getHeaderLabel(type) } </span>
        <span><Icon className="icon" name="circle" />Offline</span>
      </div>
      <div className="Participant-video" id={`${type}Video`} />
      { isBackstageFan(type) ?
        <div className="Participant-move-fan">
          <button className="move btn transparent">Move to fan feed</button>
        </div> :
        <div className="Participant-url">
          <span className="url">{ url }</span>
          <CopyToClipboard text={url} onCopyText="URL">
            <button className="btn white">COPY</button>
          </CopyToClipboard >
        </div>
      }
      <div className="Participant-feed-controls">
        <span className="label">Alter Feed</span>
        <div className="controls">
          <button className="btn white control"><Icon className="icon" name="volume-up" /></button>
          <button className="btn white control"><Icon className="icon" name="phone" /></button>
          <button className="btn white control"><Icon className="icon" name="microphone" /></button>
          <button className="btn white control"><Icon className="icon" name="video-camera" /></button>
          { R.contains('fan', R.toLower(type)) ?
            <button className="btn white control"><Icon className="icon" name="ban" /></button> :
            <button className="btn white control"><Icon className="icon" name="comment" /></button>
          }
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state: State): BaseProps => R.pick(['broadcast'], state);

export default connect(mapStateToProps)(Participant);
