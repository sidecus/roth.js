import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Action as ReduxAction, bindActionCreators, ActionCreatorsMapObject } from 'redux';

/**
 * Custom hooks to create an object containing named action creators with dispatch bound automatically using redux hooks.
 * Object is memoized so won't get created each time you use this custom hooks.
 * Version 3.0.0 - switch to bindActionCreators instead of our own implementation and remove memoization.
 * Version 3.0.1 - add back memoization. Most apps will use this in useEffect and memoization can help with avoid unwanted rerendering if this is in the dependency tree.
 * @template M  type of the object contains named action creators (plain action creator or thunk action creator)
 * @param map   the object contains named action creators.
 */
export const useBoundActions = <M extends ActionCreatorsMapObject>(map: M): M => {
  const dispatch = useDispatch();
  return useMemo(() => {
    return bindActionCreators(map, dispatch);
  }, [dispatch, map]);
};

/**
 * ============Action related type definitions============================
 */

/**
 * StringAction for all actions with string as the action type
 * @template P    payload type
 */
export interface Action<P = undefined> extends ReduxAction<string> {
  payload: P;
}

/**
 * Factory method to help create an action creator.
 * Method overloads to allow proper typing on actions with or without a payload
 * @template P        action payload type
 * @param actionType  action type value string
 */
function actionCreatorFactory(actionType: string): () => Action;
function actionCreatorFactory<P>(actionType: string): (payload: P) => Action<P>;
function actionCreatorFactory(actionType: string): (payload?: unknown) => Action<unknown> {
  return (payload?: unknown): Action<unknown> => {
    return { type: actionType, payload: payload };
  };
}

/**
 * createActionCreator export
 */
export const createActionCreator = actionCreatorFactory;

/**
 * ============Reducer related type definitions============================
 */

/**
 * Type for action to reducer(s) mapping.
 * Each action can have one or more reducers handling it.
 * @template S  state type
 * @template A  action type
 */
export type Reducer<S, A extends Action<unknown>> = (s: S, a: A) => S;

/**
 * Reducer array which contains reducers operating on the same type of action and state
 */
export type ReducerArray<S, A extends Action<unknown>> = Array<Reducer<S, A>>;

/**
 * Action reducer map type. Each entry is an action type mapped to a reducer array handling that action.
 * Reducers used in the map must be operating on the same state type (to be specific, it's a slice of the final state).
 * This type will strip properties which doesn't map to a reducer array on current state.
 * @template S State type
 * @template M Action reducer map
 */
export type ActionReducerMap<S, M> = {
  readonly [K in keyof M]: M[K] extends ReducerArray<S, Action<infer P>> ? ReducerArray<S, Action<P>> : never;
};

/**
 * Given a state and action to reducer map for it, return a new union type with all allowed actions.
 */
export type AllowedActions<S, M extends ActionReducerMap<S, M>> = {
  readonly [K in keyof ActionReducerMap<S, M>]: ActionReducerMap<S, M>[K] extends ReducerArray<S, infer A> ? A : never;
}[keyof M];

/**
 * Creates a sliced state reducer based on default state and a action to reducer(s) mapping.
 * This avoids the gigantic switch statement most people use.
 * @template S              state type
 * @template M              an action to reducer map (of type ActionReducerMap)
 * @param defaultState      default value used to initialize the state
 * @param actionReducerMap  action to reducer(s) map on the current slice of state. One action can map to multiple reducers.
 */
export const createSlicedReducer = <S, M extends ActionReducerMap<S, M>>(defaultState: S, actionReducerMap: M) => {
  return (state: S = defaultState, action: AllowedActions<S, M>): S => {
    let newState = state;
    const reducers = actionReducerMap[action.type];
    if (reducers) {
      reducers.forEach((reduce: Reducer<S, typeof action>) => (newState = reduce(newState, action)));
    }
    return newState;
  };
};
