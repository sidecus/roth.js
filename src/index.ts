import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Action as ReduxAction, Dispatch } from 'redux'

/**
 * ============Action related type definitions============================
 */

/**
 * action type
 */
type ActionType = string;

/**
 * StringAction for all actions with string as the action type
 * @template A    action type
 * @template P    payload type
 */
export interface Action<
  A extends ActionType = ActionType,
  P = never
> extends ReduxAction<A> {
  payload: P;
}

/**
 * Factory method to help create an action creator.
 * We use method overloads to allow proper typing on actions with or without a payload
 * @template A        action type
 * @template P        action payload type
 * @param actionType  action type value
 */
function actionCreatorFactory<A extends ActionType, P>(
  actionType: A
): (payload: P) => Action<A, P>
function actionCreatorFactory<A extends ActionType>(
  actionType: A
): () => Action<A>
function actionCreatorFactory<A extends ActionType>(
  actionType: A
): (payload?: unknown) => Action<string, unknown> {
  return (payload?: unknown): Action<string, unknown> => {
    return { type: actionType, payload: payload }
  }
}

/**
 * createActionCreator export
 */
export const createActionCreator = actionCreatorFactory

/**
 * ============Reducer related type definitions============================
 */

/**
 * Type for action to reducer(s) mapping.
 * Each action can have one or more reducers handling it.
 * @template S  state type
 * @template A  action type
 */
export type Reducer<S, A extends Action<ActionType, unknown>> = (state: S, action: A) => S

/**
 * Creates a sliced state reducer based on default state and a action to reducer(s) mapping.
 * This avoids the gigantic switch statement most people use.
 * @template S              state type
 * @template A              action type
 * @param defaultState      default value used to initialize the state
 * @param actionReducerMap  action to reducer(s) map on the current slice of state. One action can map to multiple reducers.
 */
export const createSlicedReducer = <S, A extends Action<ActionType, unknown>>(
  defaultState: S,
  actionReducerMap: {
    readonly [P in A['type']]: Reducer<S, A>[]
  }
) => {
  return (state: S = defaultState, action: A): S => {
    let newState = state
    const reducers = actionReducerMap[action.type]
    if (reducers) {
      reducers.forEach((reduce: Reducer<S, A>) => (newState = reduce(newState, action)))
    }
    return newState
  }
}

/**
 * ============Hooks based bound action creator related type definitions=========================
 */

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 type AnyDispatch = Dispatch<any>

/**
 * A type with named properties as action creators (normal action or thunk action).
 * @template T  "dispatchers" object shape
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NamedActionCreators<T = any> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly [K in keyof T]: (...args: any) => (Action<string, unknown> | ((dispatch: AnyDispatch) => unknown))
}

/**
 * Type used by createdBoundActionCreators as the return type.
 * It's an object with named properties as bounded action creators
 * @template M  NamedActionCreators
 */
type BoundActionCreators<M extends NamedActionCreators> = {
  [K in keyof M]: (...args: Parameters<M[K]>) => unknown
}

/**
 * Function to create an object with named dispatcher (bound action creator) based on a name to action creator map.
 * This function separates the logic from useDispatch for easy unit testing.
 * @template M      type of the dispatcher map (name to primitive action creator or thunk action creator)
 * @param dispatch  dispatch object
 * @param map       dispatcher name to action creator map.
 */
export const createdBoundActionCreators = <M extends NamedActionCreators>(
  dispatch: AnyDispatch,
  map: M
): BoundActionCreators<M> => {
  const result = {} as BoundActionCreators<M>

  for (const key in map) {
    // For each key in the map object, create a new object which has same set of keys but with action creators replaced with bound action creators
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result[key] = (...args: any): any => {
      const actionCreator = map[key]
      return dispatch(actionCreator(...args))
    }
  }

  return result
}

/**
 * Custom hooks to create an object containing named action creators with dispatch bound automatically using redux hooks.
 * Object is memoized so won't get created each time you use this custom hooks.
 * @template M  type of the object contains named action creators (name to primitive action creator or thunk action creator)
 * @param map   the object contains named action creators. !!IMPORTANT!! - Don't pass a function scoped object for this
 * otherwise it'll defeat the memoization.
 */
export const useMemoizedBoundActionCreators = <M extends NamedActionCreators>(
  map: M
): BoundActionCreators<M> => {
  const dispatch = useDispatch()

  // Use useMemo to memoize the returned BoundedNamedActionCreators object so that we don't recreate it each time createdNamedBoundedActionCreators is called.
  const memoizedDispatchers = useMemo(
    () => createdBoundActionCreators(dispatch, map),
    [dispatch, map]
  )

  return memoizedDispatchers
}
