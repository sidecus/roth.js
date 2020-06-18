# roth.js

> roth.js is a tiny Javascript library to help improve code readability when dispatching Redux actions. It also provides an opioninated sliced reducer api to help avoid big switches in reducer definitions.

[![NPM](https://img.shields.io/npm/v/roth.js.svg)](https://www.npmjs.com/package/roth.js) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)![CI](https://github.com/sidecus/roth.js/workflows/CI/badge.svg?branch=master)

## Install

```Shell
npm install --save roth.js
```

## Usage
### createActionCreator and useBoundActions
First define your actions with ```createActionCreator```:
```TS
export const updateState = createActionCreator<'UpdateState');
export const resetState = createActionCreator('ResetState');

// Define a global object which contains the action creators.
// Generate dispatch bound versions of the actions and expose it as one object with useMyBoundActions hook
const namedActionCreators = { updateState, resetState };
export const useMyBoundActions = () => useBoundActions(namedActionCreators);
```
Now in your own component, instead of:
```TSX
import { updateState, updateState /*and other actions*/ } from './actions';
export const SomeComponent = () => {
  const dispatch = useDispatch();
  return (
    <button onclick={() => dispatch(updateState(Math.random()))}>Update State</button>
    <button onclick={() => dispatch(resetState())}>Reset State</button>
  );
```
You can do this - note there is **no dispatch** and code is a bit more natural to read:
```TSX
import { useMyBoundActions } from './actions';
export const SomeComponent = () => {
  const { updateState, resetState } = useMyBoundActions();
  return (
    <button onclick={() => updateState(Math.random())}>Update State</button>
    <button onclick={resetState}>Reset State</button>
  );
};
```
Here is a full sample project using this to implement a TODO app: [Code sample](https://github.com/sidecus/reactstudy/tree/master/src/ReduxHooks). The sample project also leverages other popular libraries e.g. reselect.js/redux-thunk etc.

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

# Happy coding. Peace.
MIT © [sidecus](https://github.com/sidecus)
