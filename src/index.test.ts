import { Dispatch, combineReducers } from 'redux'
import { createActionCreator, Action, createSlicedReducer, namedDispatchersFactory, Reducer } from './index'

describe('roth.js basic test', () => {
  test('createActionCreator creates proper action creators', () => {
    // number as payload
    const numberActionType = 'number action'
    const numberActionCreator = createActionCreator<typeof numberActionType, number>(numberActionType)
    const numberAction = numberActionCreator(3)
    expect(numberAction.payload).toBe(3)
    expect(numberAction.type).toBe(numberActionType)

    // no payload
    const noPayloadActionType = 'nopayload action'
    const noPayloadActionCreator = createActionCreator<typeof noPayloadActionType>(noPayloadActionType)
    const noPayloadAction = noPayloadActionCreator()
    expect(noPayloadAction.type).toBe(noPayloadActionType)
  })

  interface State {
      numberField: number;
      numberField2: number;
      stringField: string;
  };

  test('createSlicedReducer creates correct sliced state reducer', () => {
    const numberReducer: Reducer<State, Action<string>> = (s: State) => {
      s.numberField = s.numberField + 1
      return { ...s }
    }

    const numberReducer2: Reducer<State, Action<string>> = (s: State) => {
      s.numberField2 = s.numberField2 + 1
      return { ...s }
    }

    const stringReducer: Reducer<State, Action<string, string>> = (s: State, action: Action<string, string>) => {
      s.stringField = action.payload
      return { ...s }
    }

    let state = { numberField: 0, numberField2: 0, stringField: '' }
    const slicedReducer = createSlicedReducer(state, {
      // one action triggers two number reducers
      addnumber: [numberReducer, numberReducer2],
      // single reducer for the string action
      setstring: [stringReducer]
    })

    // first reducer should update both numberField and numberField2
    state = slicedReducer(state, { type: 'addnumber' } as Action<string>)
    expect(state.numberField).toBe(1)
    expect(state.numberField2).toBe(1)
    expect(state.stringField).toBe('')

    // should update both numberField and numberField2 again, and no change to stringField
    state = slicedReducer(state, { type: 'addnumber' } as Action<string>)
    expect(state.numberField).toBe(2)
    expect(state.numberField2).toBe(2)
    expect(state.stringField).toBe('')

    // should only update stringField
    state = slicedReducer(state, { type: 'setstring', payload: 'newstring' } as Action<string, string>)
    expect(state.numberField).toBe(2)
    expect(state.numberField2).toBe(2)
    expect(state.stringField).toBe('newstring')
  })

  // TODO[sidecus] - switch to redux-mock-store
  const dispatchMock: Dispatch<Action<string, any>> = <T extends Action<string, any>>(action: T) => action

  test('dispatcherMapFactory constructs correct named dispatcher map', () => {
    const result = namedDispatchersFactory(dispatchMock, {
      setNumber: (p: number) => { return { type: 'setNumber', payload: p } },
      setString: (p: string) => { return { type: 'setString', payload: p } },
      noPayload: () => { return { type: 'noPayload' } as Action<string, any> }
    })

    expect(result.setNumber(3)).toEqual({ type: 'setNumber', payload: 3 })
    expect(result.setString('random')).toEqual({ type: 'setString', payload: 'random' })
    expect(result.noPayload()).toEqual({ type: 'noPayload', payload: undefined })
  })
})

describe('roth.js complex scenario', () => {
  interface Head {
      hasHeadache: boolean;
  }

  interface Body {
      hasMusclePain: boolean;
      bodyMassIndex: number;
  }

  enum Activity
  {
      Workout = 'work_out',
      Sleep = 'sleep',
      SeeDoctor = 'see doctor',
  }

  // action creators
  const workOutActionCreator = createActionCreator<Activity.Workout, number>(Activity.Workout)
  const sleepActionCreator = createActionCreator<Activity.Sleep, number>(Activity.Sleep)
  const seeDoctorActionCreator = createActionCreator<Activity.SeeDoctor>(Activity.SeeDoctor)
  type HeadActions = ReturnType<typeof sleepActionCreator> | ReturnType<typeof seeDoctorActionCreator> | ReturnType<typeof workOutActionCreator>
  type MuscleActions = ReturnType<typeof workOutActionCreator> | ReturnType<typeof seeDoctorActionCreator>
  type WorkoutActions = ReturnType<typeof workOutActionCreator>;

  const headacheReducer: Reducer<Head, HeadActions> = (state, action) => {
    let hasHeadache = state.hasHeadache
    if (action.type === Activity.Sleep) {
      if (action.payload >= 8) {
        // Sleeping more than 8 hours cures headache
        hasHeadache = false
      }
    } else if (action.type === Activity.SeeDoctor) {
      // seeing doctor cures headache
      hasHeadache = false
    } else if (action.type === Activity.Workout) {
      if (action.payload >= 5) {
        // you worked out too much, now you have headache
        hasHeadache = true
      }
    }

    return { ...state, hasHeadache }
  }

  const musclePainReducer: Reducer<Body, MuscleActions> = (state, action) => {
    let hasMusclePain = state.hasMusclePain
    if (action.type === Activity.Workout) {
      const hours = action.payload as number
      if (hours >= 5) {
        // Working out too much develops muscle pain
        hasMusclePain = true
      }
    } else if (action.type === Activity.SeeDoctor) {
      // seeing doctor cures muscle pain
      hasMusclePain = false
    }

    return { ...state, hasMusclePain } as Body
  }

  const bodyMassIndexReducer: Reducer<Body, WorkoutActions> = (state, action) => {
    if (action.payload >= 1 && action.payload <= 2) {
      // right amount of exercise improves body mass index
      return { ...state, bodyMassIndex: state.bodyMassIndex - 0.1 }
    }

    return state
  }

  // setup overall reducer
  const DefaultHead = { hasHeadache: false }
  const DefaultBody = { hasMusclePain: false, bodyMassIndex: 25 }

  const slicedHeadReducer = createSlicedReducer<Head, HeadActions>(DefaultHead, {
    [Activity.SeeDoctor]: [headacheReducer],
    [Activity.Sleep]: [headacheReducer],
    [Activity.Workout]: [headacheReducer]
  })
  const slicedBodyReducer = createSlicedReducer<Body, MuscleActions>(DefaultBody, {
    [Activity.Workout]: [musclePainReducer, bodyMassIndexReducer],
    [Activity.SeeDoctor]: [musclePainReducer]
  })
  const rootReducer = combineReducers({ head: slicedHeadReducer, body: slicedBodyReducer })
  const defaultState = { head: DefaultHead, body: DefaultBody }

  test('work out properly reduces BMI', () => {
    let state = defaultState
    state = rootReducer(state, workOutActionCreator(1.5))
    expect(state.body.hasMusclePain).toBe(false)
    expect(state.body.bodyMassIndex).toBeCloseTo(defaultState.body.bodyMassIndex - 0.1, 5)
    expect(state.head.hasHeadache).toBe(false)
  })

  test('work out too much and you have to see a doctor', () => {
    let state = defaultState
    // work out way too much gives you muscle pain and headache
    state = rootReducer(state, workOutActionCreator(8))
    expect(state.body.hasMusclePain).toBe(true)
    expect(state.body.bodyMassIndex).toBeCloseTo(defaultState.body.bodyMassIndex, 5)
    expect(state.head.hasHeadache).toBe(true)

    // sleep/rest but it only cures the headache
    state = rootReducer(state, sleepActionCreator(8))
    expect(state.body.hasMusclePain).toBe(true)
    expect(state.body.bodyMassIndex).toBeCloseTo(defaultState.body.bodyMassIndex, 5)
    expect(state.head.hasHeadache).toBe(false)

    // you go see a doctor, now you are back to normal
    state = rootReducer(state, seeDoctorActionCreator())
    expect(state.body.hasMusclePain).toBe(false)
    expect(state.body.bodyMassIndex).toBeCloseTo(defaultState.body.bodyMassIndex, 5)
    expect(state.head.hasHeadache).toBe(false)
  })
})
