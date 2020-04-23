# roth.js

> roth.js (Redux On The Hooks) is a TypeScript library to help simplify redux state and action management using React Hooks.
It helps avoid big switches in your reducers. It also provides custom hooks to help you easily dispatch your actions (whether they are plain actions or thunk actions) in your function components.

[![NPM](https://img.shields.io/npm/v/roth.js.svg)](https://www.npmjs.com/package/roth.js) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)![CI](https://github.com/sidecus/roth.js/workflows/CI/badge.svg?branch=master)

## Install

```bash
npm install --save roth.js
```

## Usage
This library exposes 3 core apis: ```createActionCreator```, ```createSlicedReducer```, ```useBoundActionCreators``` and ```useMemoizedBoundActionCreators```.

Here is a full sample project using this to implement a TODO app: [Code sample](https://github.com/sidecus/reactstudy/tree/master/src/ReduxHooks). Here is the corresponding [Demo site](https://sidecus.github.io/reactstudy/).
The sample project also leverages other popular libraries e.g. reselect.js/redux-thunk etc.

Below code fragments shows how the core apis can be used in your code.

### use createActionCreator and string enum to define actions
```tsx
// Define action creators using *createActionCreator* - string enum is required
enum MyActions {
  UPDATE_STATE_1 = 'UPDATE_STATE_1',
  UPDATE_STATE_2 = 'UPDATE_STATE_2',
  RESET_BOTH_STATES = 'RESET_BOTH_STATES'
}
const updateState1 = createActionCreator<MyActions.UPDATE_STATE_1, number>(MyActions.UPDATE_STATE_1)
const updateState2 = createActionCreator<MyActions.UPDATE_STATE_2, number>(MyActions.UPDATE_STATE_2)
const resetStates = createActionCreator<MyActions.RESET_BOTH_STATES>(MyActions.RESET_BOTH_STATES)
type UpdateState1Action = ReturnType<typeof updateState1>
type UpdateState2Action = ReturnType<typeof updateState2>
type ResetAction = ReturnType<typeof resetStates>
type State1Actions = UpdateState1Action | ResetAction
type State2Actions = UpdateState2Action | ResetAction
```

### Use useBoundActionCreators or useMemoizedBoundActionCreators hooks to expose "bound" action creators
```tsx
// Define the action creators object - don't put this in the function scope if you use useMemoizedBoundActionCreators
const namedActionCreators = {
  dispatchUpdateState1: updateState1,
  dispatchUpdateState2: updateState2,
  dispatchResetStates: resetStates
}

// Call *useMemoizedBoundActionCreators* or *useBoundActionCreators* to create named bound action creators,
// and use them in your component
export const State1Component = () => {
  const { dispatchUpdateState1, dispatchResetStates } = useMemoizedBoundActionCreators(namedActionCreators)()
  return (
    <button onclick={() => dispatchUpdateState1(Math.random())}>Update State#1</button>
    <button onclick={() => dispatchResetStates()}>Reset States</button>
  )
}
```

### Bonus - Use createSlicedReducer to help define reducers and avoid big switches
```tsx
// Define reducers.
type UpdateState1Reducer = Reducer<State1Type, UpdateState1Action>
type ResetState1Reducer = Reducer<State1Type, ResetAction>
type UpdateState2Reducer = Reducer<State2Type, UpdateState2Action>
type ResetState2Reducer = Reducer<State2Type, ResetAction>
const updateState1Reducer: UpdateState1Reducer = (state, action) => {...}
const resetState1Reducer: Reducer<State1Type, ResetAction> = (state, action) => {...}
const updateState2Reducer: UpdateState2Reducer = (state, action) => {...}
const resetState2Reducer: ResetState2Reducer = (state, action) => {...}

// Use *createSlicedReducer* to glue reducers on the same sliced state together
// without having to use switch statements.
// This can also be achieved with combineReducers but it'll likely result in states
// being sliced too much. It's your call to make.
const state1Reducer = createSlicedReducer<State1Type, State1Actions>(
  DefaultState1, {
    [MyActions.UPDATE_STATE_1]: [updateState1Reducer],
    [MyActions.RESET_BOTH_STATES]: [resetState1Reducer]
})
const state2Reducer = createSlicedReducer<State2Type, State2Actions>(
  DefaultState2, {
    [MyActions.UPDATE_STATE_2]: [updateState2Reducer],
    [MyActions.RESET_BOTH_STATES]: [resetState2Reducer]
})

// Get root reducer and construct store as what you normally do
const rootReducer = combineReducers({ state1: state1Reducer, state2: state2Reducer})
export const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)))
```

## License

MIT © [sidecus](https://github.com/sidecus)
