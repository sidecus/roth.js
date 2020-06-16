/* eslint-disable @typescript-eslint/no-unused-vars */
import { Dispatch, combineReducers } from 'redux';
import { createActionCreator, Action, createSlicedReducer, Reducer, createdBoundActionCreators } from './index';

/**
 * Test basic functionality for action creator, reducer and bound action creator
 */
describe('roth.js basic test', () => {
  test('createActionCreator creates proper action creators', () => {
    // number as payload
    const numberActionType = 'number action';
    const numberActionCreator = createActionCreator<number>(numberActionType);
    const numberAction = numberActionCreator(3);
    expect(numberAction.payload).toBe(3);
    expect(numberAction.type).toBe(numberActionType);

    // no payload
    const noPayloadActionType = 'nopayload action';
    const noPayloadActionCreator = createActionCreator(noPayloadActionType);
    const noPayloadAction = noPayloadActionCreator();
    expect(noPayloadAction.type).toBe(noPayloadActionType);
  });

  interface State {
    numberField: number;
    numberField2: number;
    stringField: string;
  }

  test('createSlicedReducer creates correct reducer for a slice of the state', () => {
    const numberReducer: Reducer<State, Action<string>> = (s: State) => {
      s.numberField = s.numberField + 1;
      return { ...s };
    };

    const numberReducer2: Reducer<State, Action<string>> = (s: State) => {
      s.numberField2 = s.numberField2 + 1;
      return { ...s };
    };

    const stringReducer: Reducer<State, Action<string, string>> = (s, action) => {
      s.stringField = action.payload;
      return { ...s };
    };

    let state = { numberField: 0, numberField2: 0, stringField: '' };
    const slicedReducer = createSlicedReducer(state, {
      // one action triggers two number reducers
      addnumber: [numberReducer, numberReducer2],
      // single reducer for the string action
      setstring: [stringReducer]
    });

    // first reducer should update both numberField and numberField2
    state = slicedReducer(state, { type: 'addnumber' } as Action<'addnumber'>);
    expect(state.numberField).toBe(1);
    expect(state.numberField2).toBe(1);
    expect(state.stringField).toBe('');

    // should update both numberField and numberField2 again, and no change to stringField
    state = slicedReducer(state, { type: 'addnumber' } as Action<'addnumber'>);
    expect(state.numberField).toBe(2);
    expect(state.numberField2).toBe(2);
    expect(state.stringField).toBe('');

    // should only update stringField
    state = slicedReducer(state, { type: 'setstring', payload: 'newstring' } as Action<'setstring', string>);
    expect(state.numberField).toBe(2);
    expect(state.numberField2).toBe(2);
    expect(state.stringField).toBe('newstring');
  });

  // Fake dispatch which just returns the action object for UT purpose.
  const dispatchMock: Dispatch<Action<string, unknown>> = <T extends Action<string, unknown>>(action: T) => action;

  test('createdNamedBoundedActionCreators constructs correct named bounded action creator map', () => {
    const result = createdBoundActionCreators(dispatchMock, {
      setNumber: (p: number) => {
        return { type: 'setNumber', payload: p };
      },
      setString: (p: string) => {
        return { type: 'setString', payload: p };
      },
      noPayload: () => {
        return { type: 'noPayload' } as Action<string>;
      }
    });

    expect(result.setNumber(3)).toEqual({ type: 'setNumber', payload: 3 });
    expect(result.setString('random')).toEqual({ type: 'setString', payload: 'random' });
    expect(result.noPayload()).toEqual({ type: 'noPayload', payload: undefined });
  });
});

/**
 * Complex UT mimicing real scenarios with one action handled by multiple sliced states as well as reducers for a the same sliced state
 */
describe('roth.js complex scenario', () => {
  interface Head {
    hasHeadache: boolean;
  }

  interface Body {
    hasMusclePain: boolean;
    bodyMassIndex: number;
  }

  enum Activity {
    Workout = 'work_out',
    Sleep = 'sleep',
    SeeDoctor = 'see doctor'
  }

  // action creators and action types
  const workOutActionCreator = createActionCreator<number>(Activity.Workout);
  const sleepActionCreator = createActionCreator<number>(Activity.Sleep);
  const seeDoctorActionCreator = createActionCreator(Activity.SeeDoctor);

  const sleepHeadacheReducer: Reducer<Head, ReturnType<typeof sleepActionCreator>> = (state, action) => {
    let hasHeadache = state.hasHeadache;
    if (action.payload >= 8) {
      // Sleeping more than 8 hours cures headache
      hasHeadache = false;
    }

    return { ...state, hasHeadache };
  };

  const seeDoctorHeadacheReducer: Reducer<Head, ReturnType<typeof seeDoctorActionCreator>> = (state, _action) => {
    let hasHeadache = state.hasHeadache;
    // seeing doctor cures headache
    hasHeadache = false;

    return { ...state, hasHeadache };
  };

  const workOutHeadacheReducer: Reducer<Head, ReturnType<typeof workOutActionCreator>> = (state, action) => {
    let hasHeadache = state.hasHeadache;
    if (action.payload >= 5) {
      // you worked out too much, now you have headache
      hasHeadache = true;
    }

    return { ...state, hasHeadache };
  };

  const workOutMusclePainReducer: Reducer<Body, ReturnType<typeof workOutActionCreator>> = (state, action) => {
    let hasMusclePain = state.hasMusclePain;
    const hours = action.payload as number;
    if (hours >= 5) {
      // Working out too much develops muscle pain
      hasMusclePain = true;
    }

    return { ...state, hasMusclePain } as Body;
  };

  const seeDoctormusclePainReducer: Reducer<Body, ReturnType<typeof seeDoctorActionCreator>> = (state, _action) => {
    let hasMusclePain = state.hasMusclePain;
    // seeing doctor cures muscle pain
    hasMusclePain = false;

    return { ...state, hasMusclePain } as Body;
  };

  const bodyMassIndexReducer: Reducer<Body, ReturnType<typeof workOutActionCreator>> = (state, action) => {
    if (action.payload >= 1 && action.payload <= 2) {
      // right amount of exercise improves body mass index
      return { ...state, bodyMassIndex: state.bodyMassIndex - 0.1 };
    }

    return state;
  };

  const DefaultHead = { hasHeadache: false };
  const DefaultBody = { hasMusclePain: false, bodyMassIndex: 25 };

  // create sliced reducers
  const slicedHeadReducer = createSlicedReducer(DefaultHead, {
    [Activity.SeeDoctor]: [seeDoctorHeadacheReducer],
    [Activity.Sleep]: [sleepHeadacheReducer],
    [Activity.Workout]: [workOutHeadacheReducer]
  });
  const slicedBodyReducer = createSlicedReducer(DefaultBody, {
    [Activity.Workout]: [workOutMusclePainReducer, bodyMassIndexReducer],
    [Activity.SeeDoctor]: [seeDoctormusclePainReducer]
  });

  // combine into a root reducer
  const rootReducer = combineReducers({ head: slicedHeadReducer, body: slicedBodyReducer });
  const defaultState = { head: DefaultHead, body: DefaultBody };

  test('work out properly reduces BMI', () => {
    let state = defaultState;
    state = rootReducer(state, workOutActionCreator(1.5));
    expect(state.body.hasMusclePain).toBe(false);
    expect(state.body.bodyMassIndex).toBeCloseTo(defaultState.body.bodyMassIndex - 0.1, 5);
    expect(state.head.hasHeadache).toBe(false);
  });

  test('work out too much and you have to see a doctor', () => {
    let state = defaultState;
    // work out way too much gives you muscle pain and headache
    state = rootReducer(state, workOutActionCreator(8));
    expect(state.body.hasMusclePain).toBe(true);
    expect(state.body.bodyMassIndex).toBeCloseTo(defaultState.body.bodyMassIndex, 5);
    expect(state.head.hasHeadache).toBe(true);

    // sleep/rest but it only cures the headache
    state = rootReducer(state, sleepActionCreator(8));
    expect(state.body.hasMusclePain).toBe(true);
    expect(state.body.bodyMassIndex).toBeCloseTo(defaultState.body.bodyMassIndex, 5);
    expect(state.head.hasHeadache).toBe(false);

    // you go see a doctor, now you are back to normal
    state = rootReducer(state, seeDoctorActionCreator());
    expect(state.body.hasMusclePain).toBe(false);
    expect(state.body.bodyMassIndex).toBeCloseTo(defaultState.body.bodyMassIndex, 5);
    expect(state.head.hasHeadache).toBe(false);
  });
});
