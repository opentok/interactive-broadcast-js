// @flow
import React, { Component } from 'react';
import R from 'ramda';
import Icon from 'react-fontawesome';
import './Chat.css';


type Props = {
  with: Connection,
  core: Core
};

type Message = {
  text: string,
  me: boolean
};

class Chat extends Component {

  props: Props;

  state: {
    displayed: boolean,
    minimized: boolean,
    newMessage: string,
    messages: Array<Message>
  }

  toggleDisplayed: Unit;
  toggleMinimized: Unit;
  handleIncomingMessage: Signal => void;
  handleChange: SyntheticInputEvent => void;
  handleSubmit: SyntheticInputEvent => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      displayed: false,
      minimized: false,
      newMessage: '',
      messages: [],
    };
    this.toggleDisplayed = this.toggleDisplayed.bind(this);
    this.toggleMinimized = this.toggleMinimized.bind(this);
    this.handleIncomingMessage = this.handleIncomingMessage.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  componentDidMount() {
    const { core } = this.props;
    core.on('signal', this.handleIncomingMessage);
  }

  handleIncomingMessage(e: Signal) {
    console.log('incomingININININ', e);
  }

  toggleDisplayed() {
    this.setState({ displayed: !this.state.displayed });
  }

  toggleMinimized() {
    this.setState({ minimized: !this.state.minimized });
  }

  handleChange(e: SyntheticInputEvent) {
    const newMessage = e.target.value;
    this.setState({ newMessage });
  }

  handleSubmit(e: SyntheticInputEvent) {
    e.preventDefault();
    const { core, connection } = this.props;
    const { newMessage } = this.state;
    core.signal('chat', connection, { text: newMessage });
  }

  render(): ReactComponent {
    const { toggleMinimized, toggleDisplayed, handleChange, handleSubmit } = this;
    const { displayed, minimized, newMessage } = this.state;
    const chattingWith = JSON.parse(R.pathOr(null, ['connection', 'data'], this.props));
    return (
      <div className="Chat">
        <div className="ChatHeader">
          <button className="btn minimize" onClick={toggleMinimized}>Chat with such and such</button>
          <button className="btn" onClick={toggleDisplayed}><Icon className="icon" name="close" /></button>
        </div>
        { !minimized &&
          <div className="ChatMain">
            <div className="ChatContent">
              newMessages and other things go here
            </div>
            <form className="ChatForm" onSubmit={handleSubmit}>
              <input
                type="text"
                name="newMessage"
                placeholder="Write a message . . ."
                value={newMessage}
                onChange={handleChange}
              />
              <button type="submit" className="btn"><Icon className="icon" name="check" /></button>
            </form>
          </div>
        }
      </div>
    );
  }
}

export default Chat;
