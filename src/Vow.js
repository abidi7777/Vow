import { STATES, noop } from './Vow.constants';
import { isFunction, isThenable, runSideEffect } from './Vow.utils';

class Vow {
  #thenChain = [];

  #state = STATES.PENDING;

  #reason;

  #value;

  constructor(executor) {
    setTimeout(() => {
      try {
        executor(this.onFulfill.bind(this), this.onReject.bind(this));
      } catch (e) { this.onReject(e); }
    }, 0);
  }

  then(onFulfill, onReject) {
    const controlledVow = new Vow(noop);

    this.#thenChain.push([controlledVow, onFulfill, onReject]);

    if (this.#state !== STATES.PENDING) {
      this.propagateStateChange();
    }

    return controlledVow;
  }

  catch(onReject) {
    return this.then(undefined, onReject);
  }

  finally(sideEffect) {
    const controlledVow = new Vow(noop);

    if (this.#state !== STATES.PENDING) {
      sideEffect();
    }

    this.#thenChain.push([controlledVow, undefined, undefined, sideEffect]);

    return controlledVow;
  }

  static resolve(value) {
    return new Vow((resolve) => resolve(value));
  }

  static reject(reason) {
    return new Vow((_, reject) => reject(reason));
  }

  get reason() {
    return this.#reason;
  }

  get value() {
    return this.#value;
  }

  get state() {
    return this.#state;
  }

  onFulfill(value) {
    if (this.#state === STATES.PENDING) {
      this.#state = STATES.FULFILLED;
      this.#value = value;

      this.propagateStateChange();
    }
  }

  onReject(reason) {
    if (this.#state === STATES.PENDING) {
      this.#state = STATES.REJECTED;
      this.#reason = reason;

      this.propagateStateChange();
    }
  }

  propagateStateChange() {
    if (this.#state === STATES.FULFILLED) {
      this.propagateFulfilledState();
    } else if (this.#state === STATES.REJECTED) { this.propagateRejectedState(); }

    this.#thenChain = [];
  }

  propagateFulfilledState() {
    this.#thenChain.forEach(([controlledVow, onFulfill,, sideEffect]) => {
      if (isFunction(sideEffect)) {
        runSideEffect({ controlledVow, sideEffect });
      } else if (isFunction(onFulfill)) {
        const vowOrValue = onFulfill(this.#value);

        if (isThenable(vowOrValue)) {
          vowOrValue.then(
            (value) => controlledVow.onFulfill(value),
            (reason) => controlledVow.onReject(reason),
          );
        } else { controlledVow.onFulfill(vowOrValue); }
      } else { controlledVow.onFulfill(this.#value); }
    });
  }

  propagateRejectedState() {
    this.#thenChain.forEach(([controlledVow,, onReject, sideEffect]) => {
      if (isFunction(sideEffect)) {
        runSideEffect({ controlledVow, sideEffect });
      } else if (isFunction(onReject)) {
        const vowOrValue = onReject(this.#reason);

        if (isThenable(vowOrValue)) {
          vowOrValue.then(
            (value) => controlledVow.onFulfill(value),
            (reason) => controlledVow.onReject(reason),
          );
        } else { controlledVow.onFulfill(); }
      } else { controlledVow.onReject(this.#reason); }
    });
  }
}

export default Vow;
