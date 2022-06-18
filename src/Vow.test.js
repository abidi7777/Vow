/* eslint-disable no-new */

import { STATES, noop } from './Vow.constants';
import Vow from './Vow';

describe('Vow', () => {
  it('should throw error is executor is not a function', async () => {
    await expect(async () => new Vow()).rejects.toThrow('executor is not a function');
  });

  it('should create a vow with <pending state>', () => {
    expect(new Vow(noop).state).toEqual(STATES.PENDING);
  });

  it('should fulfill a vow immediately (macro task) with the give value', () => {
    const randomValue = Math.random().toString(16).slice(2);

    return new Vow((resolve) => resolve(randomValue))
      .then((value) => {
        expect(value).toEqual(randomValue);
      });
  });

  it('should catch an error', async () => {
    const mockedCatchCallback = jest.fn();

    await new Vow((_, reject) => reject()).catch(mockedCatchCallback);

    expect(mockedCatchCallback).toHaveBeenCalled();
  });

  it('should fulfill a vow', async () => {
    const fulfilledVow = Vow.resolve('fulfilled');

    await new Vow(setTimeout);

    expect(fulfilledVow.state).toEqual(STATES.FULFILLED);
    expect(fulfilledVow.value).toEqual('fulfilled');
  });

  it('should reject a vow', async () => {
    const rejectedVow = Vow.reject('reject');

    await new Vow(setTimeout);

    expect(rejectedVow.state).toEqual(STATES.REJECTED);
    expect(rejectedVow.reason).toEqual('reject');
  });

  it('should call "propagateStateChange()" when a vow is not in pending state', async () => {
    const mockedThenCallback = jest.fn();
    const vow = new Vow((resolve) => resolve());
    const propagateStateChangeSpy = jest.spyOn(vow, 'propagateStateChange');

    vow.then(mockedThenCallback);

    await new Vow(setTimeout);

    expect(propagateStateChangeSpy).toHaveBeenCalled();
  });

  it('should call "propagateStateChange()" when "resolve" is called from the executor and vow state is still pending', async () => {
    const vow = new Vow((resolve) => resolve());
    const propagateStateChangeSpy = jest.spyOn(vow, 'propagateStateChange');

    await new Vow(setTimeout);

    expect(propagateStateChangeSpy).toHaveBeenCalled();
  });

  it('should call "propagateStateChange()" when "reject" is called from the executor and vow state is still pending', async () => {
    const vow = new Vow((_, reject) => reject());
    const propagateStateChangeSpy = jest.spyOn(vow, 'propagateStateChange');

    await new Vow(setTimeout);

    expect(propagateStateChangeSpy).toHaveBeenCalled();
  });

  it('should not call "propagateStateChange()" when "resolve" is called from the executor and vow state is not pending', async () => {
    const vow = new Vow((resolve) => resolve());
    const propagateStateChangeSpy = jest.spyOn(vow, 'propagateStateChange');

    await new Vow(setTimeout);

    vow.onFulfill(); // manually calling onFulfill method after the vow has been fulfilled

    // should be once cuz we resolve the vow on line 85
    expect(propagateStateChangeSpy).toHaveBeenCalledTimes(1);
  });

  it('should not call "propagateStateChange()" when "reject" is called from the executor and vow state is not pending', async () => {
    const vow = new Vow((_, reject) => reject());
    const propagateStateChangeSpy = jest.spyOn(vow, 'propagateStateChange');

    await new Vow(setTimeout);

    vow.onReject(); // manually calling onReject method after the vow has been rejected

    // should be once cuz we reject the vow on line 96
    expect(propagateStateChangeSpy).toHaveBeenCalledTimes(1);
  });

  it('should run sideEffect on a fulfilled vow', async () => {
    const mockedSideEffect = jest.fn();

    await new Vow((resolve) => resolve())
      .finally(mockedSideEffect);

    expect(mockedSideEffect).toHaveBeenCalled();
  });

  it('should run sideEffect on a rejected vow', async () => {
    const mockedSideEffect = jest.fn();

    await new Vow((_, reject) => reject())
      .finally(mockedSideEffect);

    expect(mockedSideEffect).toHaveBeenCalled();
  });

  it('should break the vow chain if rejected vow is returned from sideEffect', async () => {
    const mockedThenCallback1 = jest.fn();
    const mockedThenCallback2 = jest.fn();
    const mockedThenCallback3 = jest.fn();
    const mockedCatchCallback = jest.fn();

    await new Vow((resolve) => resolve())
      .then(mockedThenCallback1)
      .then(mockedThenCallback2)
      .finally(() => Vow.reject())
      .then(mockedThenCallback3)
      .catch(mockedCatchCallback);

    expect(mockedThenCallback1).toHaveBeenCalled();
    expect(mockedThenCallback2).toHaveBeenCalled();
    expect(mockedThenCallback3).not.toHaveBeenCalled();
    expect(mockedCatchCallback).toHaveBeenCalled();
  });

  it('should break the vow chain when one of the vows is rejected', async () => {
    const mockedThenCallback1 = jest.fn();
    const mockedThenCallback2 = jest.fn();
    const mockedThenCallback3 = jest.fn();
    const mockedCatchCallback = jest.fn();

    await new Vow((resolve) => resolve())
      .then(mockedThenCallback1)
      .then(mockedThenCallback2)
      .then(() => Vow.reject())
      .then(mockedThenCallback3)
      .catch(mockedCatchCallback);

    expect(mockedThenCallback1).toHaveBeenCalled();
    expect(mockedThenCallback2).toHaveBeenCalled();
    expect(mockedThenCallback3).not.toHaveBeenCalled();
    expect(mockedCatchCallback).toHaveBeenCalled();
  });

  it('should reject after catch block when the return value is a rejected vow', async () => {
    const mockedThenCallback1 = jest.fn();
    const mockedThenCallback2 = jest.fn();
    const mockedThenCallback3 = jest.fn();
    const mockedThenCallback4 = jest.fn();
    const mockedCatchCallback = jest.fn();

    await new Vow((resolve) => resolve())
      .then(mockedThenCallback1)
      .then(mockedThenCallback2)
      .then(() => Vow.reject())
      .then(mockedThenCallback3)
      .catch(mockedCatchCallback)
      .then(mockedThenCallback4);

    expect(mockedThenCallback1).toHaveBeenCalled();
    expect(mockedThenCallback2).toHaveBeenCalled();
    expect(mockedThenCallback3).not.toHaveBeenCalled();
    expect(mockedCatchCallback).toHaveBeenCalled();
    expect(mockedThenCallback4).toHaveBeenCalled();
  });

  it('should recover after catch block when the return value is either a fulfilled vow or a value', async () => {
    const mockedThenCallback1 = jest.fn();
    const mockedThenCallback2 = jest.fn();
    const mockedThenCallback3 = jest.fn();
    const mockedThenCallback4 = jest.fn();
    const mockedCatchCallback = jest.fn();

    await new Vow((resolve) => resolve())
      .then(mockedThenCallback1)
      .then(mockedThenCallback2)
      .then(() => Vow.reject())
      .then(mockedThenCallback3)
      .catch(() => Vow.reject())
      .then(mockedThenCallback4)
      .catch(mockedCatchCallback);

    expect(mockedThenCallback1).toHaveBeenCalled();
    expect(mockedThenCallback2).toHaveBeenCalled();
    expect(mockedThenCallback3).not.toHaveBeenCalled();
    expect(mockedThenCallback4).not.toHaveBeenCalled();
    expect(mockedCatchCallback).toHaveBeenCalled();
  });
});
