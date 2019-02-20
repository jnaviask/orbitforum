import * as toastr from 'toastr';

toastr.options.positionClass = 'toast-bottom-right';
toastr.options.hideDuration = 500;
toastr.options.timeOut = 4000;

export function notifyError(message) {
  toastr.error(message);
}

export function notifySuccess(message) {
  toastr.success(message);
}

export function notifyWarning(message) {
  toastr.warning(message);
}

export function notifyInfo(message) {
  toastr.info(message);
}
