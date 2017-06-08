// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import R from 'ramda';
import shortid from 'shortid';
import classNames from 'classnames';
import moment from 'moment';
import Icon from 'react-fontawesome';
import CopyToClipboard from '../../Common/CopyToClipboard';
import DatePicker from '../../Common/DatePicker';
import firebase from '../../../services/firebase';
import createUrls from '../../../services/eventUrls';
import { uploadEventImage, uploadEventImageSuccess } from '../../../actions/events';
import './EventForm.css';

/* beautify preserve:start */
type BaseProps = {
  onSubmit: Unit,
  onUpdate: string => void,
  user: User,
  event: BroadcastEvent,
  errors: null | { fields: {[field: string]: boolean}, message: string }
};
type DispatchProps = {
  uploadImage: Unit,
  uploadImageSuccess: Unit
};
type Props = BaseProps & DispatchProps;
/* beautify preserve:end */

const eventNameFromProps: (Props => string) = R.pathOr('', ['event', 'name']);

type EventFormState = {
  fields: {
    name: string,
    startImage: string,
    endImage: string,
    fanUrl: string,
    fanAudioUrl: string,
    hostUrl: string,
    celebrityUrl: string,
    archiveEvent: boolean,
    redirectUrl: string,
    dateTimeStart: string,
    dateTimeEnd: string,
    uncomposed: boolean
  }
};

class EventForm extends Component {

  props: Props;
  state: EventFormState;
  handleSubmit: Unit;
  handleChange: Unit;
  uploadFile: Unit;
  updateURLs: Unit;
  onCopy: string => void;
  onUpdate: string => void;
  onUploadFinish: Unit;

  constructor(props: Props) {
    super(props);
    this.state = {
      fields: {
        name: eventNameFromProps(this.props),
        startImage: '',
        endImage: '',
        dateTimeStart: moment().startOf('hour').format('MM/DD/YYYY hh:mm:ss a'),
        dateTimeEnd: moment().startOf('hour').add(1, 'h').format('MM/DD/YYYY hh:mm:ss a'),
        archiveEvent: true,
        fanUrl: '',
        fanAudioUrl: '',
        hostUrl: '',
        celebrityUrl: '',
        redirectUrl: '',
        uncomposed: true,
      },
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.updateURLs = this.updateURLs.bind(this);
  }

  componentDidMount() {
    this.updateURLs();
  }

  componentWillReceiveProps(nextProps: Props) {
    if (R.isNil(this.props.event) && R.isEmpty(this.state.fields.name)) {
      this.setState({ fields: R.assoc('name', eventNameFromProps(nextProps), this.state.fields) }, this.updateURLs);
    }
  }

  handleSubmit(e: SyntheticInputEvent) {
    e.preventDefault();
    const { onSubmit } = this.props;
    const { fields } = this.state;
    onSubmit(fields);
  }

  uploadFile(e: SyntheticInputEvent) {
    this.props.uploadImage();
    const field = e.target.name;
    const file = R.head(e.target.files);
    const ref = firebase.storage().ref().child(`eventImages/${shortid.generate()}`);
    ref.put(file).then((snapshot: *) => {
      const imageURL = snapshot.downloadURL;
      this.setState({ fields: R.assoc(field, imageURL, this.state.fields) });
      this.props.uploadImageSuccess();
    });
  }

  updateURLs() {
    const { fields } = this.state;
    const update = createUrls({ name: R.prop('name', fields), adminId: this.props.user.id });
    this.setState({ fields: R.merge(fields, update) });
  }

  handleChange(e: SyntheticInputEvent) {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const field = e.target.name;
    this.setState({ fields: R.assoc(field, value, this.state.fields) }, this.updateURLs);
    this.props.onUpdate(field);
  }

  render(): ReactComponent {
    const { handleSubmit, handleChange, uploadFile } = this;
    const { errors } = this.props;
    const errorMessage = R.propOr('', 'message', errors);
    const errorFields = R.propOr({}, 'fields', errors);
    const { fields } = this.state;

    return (
      <form className="EventForm" onSubmit={handleSubmit}>
        <div className="input-container">
          <div className="label">Name</div>
          <Icon className="icon" name="asterisk" style={{ color: 'darkgrey' }} />
          <input type="text" value={fields.name} name="name" onChange={handleChange} placeholder="Event Name" />
        </div>
        <div className="input-container date-time">
          <div className="label">Date and Time (optional)</div>
          <div className="date-time-container">
            <div className={classNames('time-selection', { error: errorFields.dateTimeStart })}>
              <Icon className="icon" name="calendar-o" style={{ color: 'darkgrey' }} />
              <DatePicker name="dateTimeStart" onChange={handleChange} value={fields.dateTimeStart} />
            </div>
            <div className="separation">to</div>
            <div className={classNames('time-selection', { error: errorFields.dateTimeEnd })} >
              <Icon className="icon" name="calendar-o" style={{ color: 'darkgrey' }} />
              <DatePicker name="dateTimeEnd" onChange={handleChange} value={fields.dateTimeEnd} />
            </div>
          </div>
        </div>
        <div className="input-container">
          <div className="label">Event Image</div>
          <Icon className="icon" name="image" style={{ color: 'darkgrey' }} />
          <input type="file" name="startImage" onChange={uploadFile} />
        </div>
        <div className="input-container">
          <div className="label">End Event Image (optional)</div>
          <Icon className="icon" name="image" style={{ color: 'darkgrey' }} />
          <input type="file" name="endImage" onChange={uploadFile} />
        </div>

        <div className="error-message-container">
          { errorMessage }
        </div>

        <div className="form-divider">
          <h4>Event URLs</h4>
        </div>

        <div className="input-container disabled">
          <div className="label">Fan URL</div>
          <Icon className="icon" name="link" style={{ color: 'darkgrey' }} />
          <input type="url" name="fanUrl" value={fields.fanUrl} onChange={handleChange} disabled />
          <CopyToClipboard text={fields.fanUrl} onCopyText="Fan URL" >
            <button className="btn white copy" type="button">
              <Icon className="icon" name="copy" style={{ color: '#607d8b' }} />
              Copy Fan URL
            </button>
          </CopyToClipboard>
        </div>
        <div className="input-container disabled">
          <div className="label">Fan Audio Only URL</div>
          <Icon className="icon" name="link" style={{ color: 'darkgrey' }} />
          <input type="url" name="fanAudioUrl" value={fields.fanAudioUrl} onChange={handleChange} disabled />
          <CopyToClipboard text={fields.fanAudioUrl} onCopyText="Fan Audio URL" >
            <button className="btn white copy" type="button">
              <Icon className="icon" name="copy" style={{ color: '#607d8b' }} />
              Copy Fan Audio URL
            </button>
          </CopyToClipboard>
        </div>
        <div className="input-container disabled">
          <div className="label">Host URL</div>
          <Icon className="icon" name="link" style={{ color: 'darkgrey' }} />
          <input type="url" name="hostURL" value={fields.hostUrl} onChange={handleChange} disabled />
          <CopyToClipboard text={fields.hostUrl} onCopyText="Host URL" >
            <button className="btn white copy" type="button" >
              <Icon className="icon" name="copy" style={{ color: '#607d8b' }} />
              Copy Host URL
            </button>
          </CopyToClipboard>
        </div>
        <div className="input-container disabled">
          <div className="label">Celebrity URL</div>
          <Icon className="icon" name="link" style={{ color: 'darkgrey' }} />
          <input type="url" name="celebrityUrl" value={fields.celebrityUrl} disabled />
          <CopyToClipboard text={fields.celebrityUrl} onCopyText="Celebrity URL" >
            <button className="btn white copy" type="button" >
              <Icon className="icon" name="copy" style={{ color: '#607d8b' }} />
              Copy Celebrity URL
            </button>
          </CopyToClipboard>
        </div>
        <div className="input-container">
          <div className="label">Redirect URL (optional)</div>
          <Icon className="icon" name="link" style={{ color: 'darkgrey' }} />
          <input type="url" className="enabled" name="redirectUrl" value={fields.redirectUrl} onChange={handleChange} />
        </div>

        <div className="input-container checkbox">
          <input type="checkbox" name="archiveEvent" checked={fields.archiveEvent} onChange={handleChange} />
          <span className="label">Archive Event</span>
        </div>
        <div className="input-container checkbox">
          <input type="checkbox" name="uncomposed" checked={fields.uncomposed} onChange={handleChange} />
          <span className="label">Archive Individual Streams (Uncheck for Composed Video)</span>
        </div>

        <div className="input-container submit">
          <button className="btn action green" disabled={R.isEmpty(fields.name)}>Save Event</button>
        </div>
      </form>
    );
  }
}

const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    uploadImage: () => {
      dispatch(uploadEventImage());
    },
    uploadImageSuccess: () => {
      dispatch(uploadEventImageSuccess());
    },
  });
export default withRouter(connect(null, mapDispatchToProps)(EventForm));
