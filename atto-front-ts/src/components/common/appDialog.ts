export type DialogKind = 'alert' | 'confirm';

export type DialogRequest = {
  kind: DialogKind;
  message: string;
  title?: string;
  resolve?: (ok: boolean) => void;
};

export type EnqueueFn = (request: DialogRequest) => void;

const hasWindow = typeof window !== 'undefined';
const nativeAlert = hasWindow ? window.alert.bind(window) : () => undefined;
const nativeConfirm = hasWindow ? window.confirm.bind(window) : () => false;

let enqueueDialogImpl: EnqueueFn = (request) => {
  if (request.kind === 'confirm') {
    request.resolve?.(nativeConfirm(request.message));
    return;
  }
  nativeAlert(request.message);
};

export const setDialogEnqueue = (enqueueFn: EnqueueFn) => {
  enqueueDialogImpl = enqueueFn;
};

export const resetDialogEnqueue = () => {
  enqueueDialogImpl = (request) => {
    if (request.kind === 'confirm') {
      request.resolve?.(nativeConfirm(request.message));
      return;
    }
    nativeAlert(request.message);
  };
};

export const showAlert = (message: string, title?: string) => {
  enqueueDialogImpl({
    kind: 'alert',
    message,
    title,
  });
};

export const showConfirm = (message: string, title?: string): Promise<boolean> =>
  new Promise((resolve) => {
    enqueueDialogImpl({
      kind: 'confirm',
      message,
      title,
      resolve,
    });
  });
