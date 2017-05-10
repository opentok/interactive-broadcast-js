// @flow
import React from 'react';
import R from 'ramda';
import { connect } from 'react-redux';
import SweetAlert from 'sweetalert-react';
import 'sweetalert/dist/sweetalert.css';
import { resetAlert } from '../../actions/alert';

type DispatchProps = { reset: Unit };
type Props = AlertOptions & DispatchProps;
const Alert = (props: Props): ReactComponent => {
  const { show, type, title, text, showConfirmButton = true, showCancelButton, onConfirm, onCancel, reset, html = false, inputPlaceholder = '' } = props;
  return (
    <div className="Alert">
      <SweetAlert
        show={show}
        type={type}
        title={title}
        text={text}
        showConfirmButton={showConfirmButton}
        showCancelButton={showCancelButton}
        onConfirm={onConfirm || reset}
        onCancel={onCancel || reset}
        onEscapeKey={reset}
        inputPlaceholder={inputPlaceholder}
        html={html}
      />
    </div>
  );
};

const mapStateToProps = (state: State): Props => R.prop(['alert'], state);
const mapDispatchToProps: MapDispatchToProps<DispatchProps> = (dispatch: Dispatch): DispatchProps =>
  ({
    reset: () => {
      dispatch(resetAlert());
    },
  });
export default connect(mapStateToProps, mapDispatchToProps)(Alert);
