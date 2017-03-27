// @flow
/* eslint no-undef: "off" */
/* beautify preserve:start */
declare type AlertState = {
  show: boolean,
  type: AlertType,
  title: string,
  text: string,
  onConfirm: null | (*) => void,
  showCancelButton: boolean
}

declare type AlertOptions = {
  show: boolean,
  type: AlertType,
  title?: string,
  text?: string,
  onConfirm?: Unit,
  onCancel?: Unit,
  showConfirmButton?: boolean,
  showCancelButton?: boolean
};

declare type AlertType = 'warning' | 'error' | 'success' | 'info';

declare type AlertAction =
  { type: 'RESET_ALERT' } |
  { type: 'SET_ALERT', options: AlertState };
