// @flow
import { Component } from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';

type Props = {
  children: ReactComponent[],
  user: User
};

class AuthRoutes extends Component {
  props: Props;

  componentWillMount() {
    if (!this.props.user) {
      browserHistory.replace('/');
    }
  }

  render(): ReactComponent {
    return this.props.user ? this.props.children : null;
  }
}

const mapStateToProps = (state: State): Props => R.pick(['user'], state);
export default connect(mapStateToProps)(AuthRoutes);

