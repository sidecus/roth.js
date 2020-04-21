# roth.js

> roth.js (Redux On The Hooks) is a TypeScript library to help simplify redux state and action management using React Hooks.
It helps avoid big switches in your reducers. It also provides custom hooks to help you easily dispatch your actions (whether they are plain actions or thunk actions) in your function components.

[![NPM](https://img.shields.io/npm/v/roth.js.svg)](https://www.npmjs.com/package/roth.js) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)![CI](https://github.com/sidecus/roth.js/workflows/CI/badge.svg?branch=master)

## Install

```bash
npm install --save roth.js
```

## Usage
This library exposes 3 core apis: ```createActionCreator```, ```createSlicedReducer```, ```useMemoizedBoundActionCreators```

Here is a full sample: [Code sample](https://github.com/sidecus/reactstudy/tree/master/src/ReduxHooks) and its corresponding [Demo site](https://sidecus.github.io/reactstudy/).
The example also leverages other popular libraries e.g. reselect.js/redux-thunk etc.

Below code fragments shows how the core apis can be used in your code.

### Define actions, reducers and store
```tsx
// Define action creators using *createActionCreator*
enum MyActions {
  UPDATE_STATE_1 = 'UPDATE_STATE_1',
  UPDATE_STATE_2 = 'UPDATE_STATE_2',
  RESET_BOTH_STATES = 'RESET_BOTH_STATES'
}
const updateState1 = createActionCreator<MyActions.UPDATE_STATE_1, number>(MyActions.UPDATE_STATE_1)
const updateState2 = createActionCreator<MyActions.UPDATE_STATE_2, number>(MyActions.UPDATE_STATE_2)
const resetStates = createActionCreator<MyActions.RESET_BOTH_STATES>(MyActions.RESET_BOTH_STATES)
type updateState1Action = ReturnType<typeof updateState1>
type updateState2Action = ReturnType<typeof updateState2>
type resetAction = ReturnType<typeof resetStates>

// Define reducers. one action can be handled by multiple reducers on different state slices.
// Use *createSlicedReducer* to glue reducers on the same state together without using switch statements
const updateState1Reducer: Reducer<State1Type, updateState1Action> = (state, action) => {...}
const resetState1Reducer: Reducer<State1Type, resetAction> = (state, action) => {...}
const state1Reducer = createSlicedReducer<State1Type, updateState1Action | resetAction>(DefaultState1, {
  [MyActions.UPDATE_STATE_1]: [updateState1Reducer],
  [MyActions.RESET_BOTH_STATES]: [resetState1Reducer]
})

const updateState2Reducer: Reducer<State2Type, updateState2Action> = (state, action) => {...}
const resetState2Reducer: Reducer<State2Type, resetAction> = (state, action) => {...}
const state2Reducer = createSlicedReducer<State2Type, updateState2Action | resetAction>(DefaultState2, {
  [MyActions.UPDATE_STATE_2]: [updateState2Reducer],
  [MyActions.RESET_BOTH_STATES]: [resetState2Reducer]
})

// Get root reducer and construct store as usual
const rootReducer = combineReducers({ state1: state1Reducer, state2: state2Reducer})
export const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)))

// Define a custom hook which calls *useMemoizedBoundActionCreators* to expose named bound action creators.
// You can also call useMemoizedBoundActionCreators direclty from your code.
const namedActionCreators = {
  dispatchUpdateState1: updateState1,
  dispatchUpdateState2: updateState2,
  dispatchResetStates: resetStates
}
export const useBoundActionCreators = () => useMemoizedBoundActionCreators(namedActionCreators)

```

### Now you can use the store and the custom hooks in your function components
```tsx
export const SomeComponent = () => {
  const { dispatchUpdateState1, dispatchResetStates } = useBoundActionCreators();
  ...

  return (
    <button onclick={() => dispatchUpdateState1(x + 1)}>Update State#1</button>
    <button onclick={() => dispatchResetStates()}>Reset States</button>
  )
}

```

## License

MIT © [sidecus](https://github.com/sidecus)
