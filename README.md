# roth.js

> roth.js (Redux On The Hooks) is a TypeScript library to help improve code readability when dispatching actions. It also provides an opioninated sliced reducer api to help avoid big switches in reducer definitions.

[![NPM](https://img.shields.io/npm/v/roth.js.svg)](https://www.npmjs.com/package/roth.js) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)![CI](https://github.com/sidecus/roth.js/workflows/CI/badge.svg?branch=master)

## Install

```bash
npm install --save roth.js
```

## Usage
### createActionCreator and useMemoizedBoundActions
First define your actions with ```createActionCreator```:
```typescript
// action.ts
enum MyActions {
  UPDATE_STATE = 'UPDATE_STATE',
  RESET_STATES = 'RESET_STATE'
}
export const updateState = createActionCreator<number>(MyActions.UPDATE_STATE);
export const resetState = createActionCreator(MyActions.RESET_STATE);

// Define a global object which contains the named action creators
const namedActionCreators = { updateState, resetState };

// Define a custom hook using useBoundActions and pass in namedActionCreators as the parameter
export const useMyBoundActions = () => useBoundActions(namedActionCreators);
```
Now in your own component, instead of:
```typescript
// SomeComponent.tsx
export const SomeComponent = () => {
  const dispatch = useDispatch();
  return (
    <button onclick={() => dispatch(updateState(Math.random()))}>Update State</button>
    <button onclick={() => dispatch(resetState())}>Reset State</button>
  );
```
You can do this - note there is **no dispatch** and code is a bit more natural to read:
```typescript
export const SomeComponent = () => {
  const { updateState, resetState } = useMyBoundActions();
  return (
    <button onclick={() => updateState(Math.random())}>Update State</button>
    <button onclick={resetState}>Reset State</button>
  );
};
```
Here is a full sample project using this to implement a TODO app: [Code sample](https://github.com/sidecus/reactstudy/tree/master/src/ReduxHooks). Here is the corresponding [Demo site](https://sidecus.github.io/reactstudy/).
The sample project also leverages other popular libraries e.g. reselect.js/redux-thunk etc.

### Opininated bonus api createSlicedReducer
Use *createSlicedReducer* to glue reducers on the same sliced state without having to use switch statements. This can also be achieved with combineReducers, but it might lead to small granular and verbose state definition.
```typescript
// Define reducers.
const myStateReducer: Reducer<MyState, MyStateActions> = (state, action) => {...};
const myReducer = createSlicedReducer(
  DefaultState1, {
    [MyActions.UPDATE_STATE_1]: [updateState1Reducer],
    [MyActions.RESET_BOTH_STATES]: [resetState1Reducer]
});

// Get root reducer and construct store as what you normally do
const rootReducer = combineReducers({ state1: myReducer, state2: someOtherReducer});
export const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)));
```

## License

MIT © [sidecus](https://github.com/sidecus)
