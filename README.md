# roth.js

> roth.js (Redux On The Hooks) is a TypeScript library to help simplify redux state and action management using React Hooks.
> It helps avoid big switches in your reducers. It also provides custom hooks to help you easily dispatch your actions (normal or thunk) in your function components.

[![NPM](https://img.shields.io/npm/v/roth.js.svg)](https://www.npmjs.com/package/roth.js) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save roth.js
```

## Usage

Core apis: ```createActionCreator```, ```createSlicedReducer```, ```useMemoizedBoundActionCreators```

### Define store
```typescript

// Define action creators using *createActionCreator*
enum MyActions {
  UPDATE_STATE_1 = 'UPDATE_STATE_1',
  UPDATE_STATE_2 = 'UPDATE_STATE_2',
  RESET_BOTH_STATES = 'RESET_BOTH_STATES'
}
const updateState1 = createActionCreator<MyActions.UPDATE_STATE_1, number>(MyActions.UPDATE_STATE_1)
const updateState2 = createActionCreator<MyActions.UPDATE_STATE_2, number>(MyActions.UPDATE_STATE_2)
const resetStates = createActionCreator<MyActions.RESET_BOTH_STATES>(MyActions.RESET_BOTH_STATES)

// Define reducers. one action can be handled by multiple reducers on different state slices.
// Use *createSlicedReducer* to glue reducers on the same state together without using switch statements
const updateState1Reducer: Reducer<State1Type, ReturnType<typeof updateState1>> = (state, action) => {...}
const resetState1Reducer: Reducer<State1Type, ReturnType<typeof resetStates>> = (state, action) => {...}
const state1Reducer = createSlicedReducer<State1Type, ReturnType<typeof updateState1> | ReturnType<typeof resetStates>>(DefaultState1, {
  [MyActions.UPDATE_STATE_1]: [updateState1Reducer],
  [MyActions.RESET_BOTH_STATES]: [resetState1Reducer]
})

const updateState2Reducer: Reducer<State2Type, ReturnType<typeof updateState2>> = (state, action) => {...}
const resetState2Reducer: Reducer<State2Type, ReturnType<typeof resetStates>> = (state, action) => {...}
const state2Reducer = createSlicedReducer<State2Type, ReturnType<typeof updateState1> | ReturnType<typeof resetStates>>(DefaultState2, {
  [MyActions.UPDATE_STATE_2]: [updateState2Reducer],
  [MyActions.RESET_BOTH_STATES]: [resetState2Reducer]
})

// Define a custom hook which calls *useMemoizedBoundActionCreators* to expose named bound action creators.
// Since we are memoizing the bound action creators, the parameter of useMemoizedBoundActionCreators is defined as a global const.
const namedActionCreators = {
  dispatchUpdateState1: updateState1,
  dispatchUpdateState2: updateState2,
  dispatchResetStates: resetStates
}
export const useBoundActionCreators = () => useMemoizedBoundActionCreators(namedActionCreators)

// Get root reducer and construct store as usual
const rootReducer = combineReducers({ state1: state1Reducer, state2: state2Reducer})
export const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)))

```

### Use the custom hooks in function components
```tsx
export const State1App = () => {
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
