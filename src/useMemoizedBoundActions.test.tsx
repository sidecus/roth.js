import { createActionCreator, useBoundActions, Action } from './index';
import { renderHook } from '@testing-library/react-hooks';
import { useDispatch } from 'react-redux';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn()
}));

const useDispatchMock = useDispatch as jest.Mock;

const NumberAction = createActionCreator<number>('numberaction');
const StringAction = createActionCreator<string>('stringaction');
const VoidAction = createActionCreator('voidaction');
const actionCreators = {
  numberAction: NumberAction,
  stringAction: StringAction,
  voidAction: VoidAction
};

describe('useMemoizedBoundActions behaviors', () => {
  const dispatchResultRecorder = {} as any;
  const fakeDispatch = (action: Action<string, unknown>) => {
    let payload = action.payload;
    if (payload === undefined) {
      payload = 'void';
    }
    dispatchResultRecorder[action.type] = payload;
  }
  useDispatchMock.mockImplementation(() => fakeDispatch);

  it('Glues dispatch and action creators', () => {
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
