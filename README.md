# roth.js

> Tiny react-redux extension library for easier action/dispatch/reducer management

[![NPM](https://img.shields.io/npm/v/roth.js.svg)](https://www.npmjs.com/package/roth.js) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)![CI](https://github.com/sidecus/roth.js/workflows/CI/badge.svg?branch=master)

## Install

```Shell
npm install --save roth.js
```

## Usage
### **useBoundActions**
Dispatch actions and thunk easily with useBoundActions convenience api:
```tsx
// **** action.ts ****
// Call useBoundActions hook to automatically bind action creators to dispatch.
// Here we are creating a custom hook named useAreaActions from it.
const areaActionCreators = { setNumber, setString };
export const useAreaActions = () => useBoundActions(areaActionCreators);

// **** SomeComponent.tsx ****
export const SomeComponent = () => {
  const { setNumber, setString } = useAreaActions();
  return (
    <>
      <button onclick={() => setNumber(someNumber)}>SetNumber</button>
      <button onclick={() => setString(someString))}>SetString</button>
    </>
  );
};
```
Compared to the tranditional way (```useDispatch``` and then ```dispatch(numberAction(someNumber))``` ), the code is shorter, easier to read, and also convenient to unit test as well since you can just mock the new custom hook without having to worry about mocking dispatch.
A full sample project using this to implement a TODO app can be found [here](https://github.com/sidecus/reactstudy/tree/master/src/ReduxHooks). The sample project also leverages other popular libraries e.g. reselect.js/redux-thunk etc.

### **createActionCreator**
If you are using actions with action type as string and with none or single payload, you can define your actions with the built in ```createActionCreator``` api easily:
```tsx
export const noPayloadAction = createActionCreator('NoPayloadAction');
export const stringPayloadAction = createActionCreator<string>('StringAction');
export const customPayloadAction = createActionCreator<MyPayload>('MyPayloadAction');
```

### **createSlicedReducer**
When creating reducers, it's common that we use if/else or switch statements to check action type and reduce based on that. ```createSlicedReducer``` api can help make that easier without branching statements. It handles action to reducer mapping for your automatically based on the passed in map. The return type of ```createSlicedReducer``` is a reducer by itself and you can pass that into combinedReducers.
```tsx
// Define reducers.
const numberReducer: Reducer<MyState, Action<number>> = ...;
const numberReducer2: Reducer<MyState, Action<number>> = ...;
const stringReducer: Reducer<MyState, Action<string>> = ...;

// Create a sliced reducer on current state slice
const mySlicedReducer = createSlicedReducer(DefaultMyState, {
    [MyActions.NumberAction]: [numberReducer, numberReducer2],
    [MyActions.StringAction]: [stringReducer]
});

// Get root reducer and construct store as usual
const rootReducer = combineReducers({ myState: mySlicedReducer, state2: otherReducer });
export const store = createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)));
```

## Changelog
v3.0.0: Switch to bindActionCreators to further reduce package size and improve typing for ActionReducerMap.

# Happy coding. Peace.
MIT © [sidecus](https://github.com/sidecus)
