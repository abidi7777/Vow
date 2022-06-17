export const isFunction = (x) => typeof x === 'function';

export const isThenable = (x) => x && typeof x.then === 'function';

export const runSideEffect = ({ controlledVow, sideEffect }) => {
  const vowOrValue = sideEffect();

  if (isThenable(vowOrValue)) {
    vowOrValue.then(
      (value) => controlledVow.onFulfill(value),
      (reason) => controlledVow.onReject(reason),
    );
  } else { controlledVow.onFulfill(); }
};
