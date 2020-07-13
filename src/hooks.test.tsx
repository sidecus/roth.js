import { createActionCreator, useBoundActions } from './index';
import { renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';
import { AnyAction } from 'redux';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn()
}));

const useDispatchMock = useDispatch as jest.Mock;

const actionCreators = {
  numberAction: createActionCreator<number>('numberaction'),
  stringAction: createActionCreator<string>('stringaction'),
  voidAction: createActionCreator('voidaction')
};

describe('useBoundActions behaviors', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dispatchResultRecorder = {} as any;
  const fakeDispatch = (action: AnyAction) => {
    let payload = action.payload;
    if (payload === undefined) {
      payload = 'void';
    }
    dispatchResultRecorder[action.type] = payload;
  };

  useDispatchMock.mockImplementation(() => fakeDispatch);

  it('Glues dispatch and action creators', () => {
    useDispatchMock.mockClear();
    const { result } = renderHook(() => useBoundActions(actionCreators));

    expect(result.error).toBeUndefined();
    expect(useDispatchMock).toHaveBeenCalledTimes(1);

    const { numberAction, stringAction, voidAction } = result.current;
    numberAction(3);
    expect(dispatchResultRecorder.numberaction).toBe(3);
    stringAction('blabla');
    expect(dispatchResultRecorder.stringaction).toBe('blabla');
    voidAction();
    expect(dispatchResultRecorder.voidaction).toBe('void');
  });
});
