import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Action as ReduxAction, Dispatch } from 'redux'

/**
 * ============Utility type helpers============================
 */

/**
 * Utility type to select the list of properties with type as P from a type T
 * @template T
 * @template P
 */
export type PickPropertyNames<T, P> = { [K in keyof T]: T[K] extends P ? K : never }[keyof T]

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
  A extends ActionType,
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
function actionCreatorFactory(
  actionType: ActionType
): () => Action<ActionType>
function actionCreatorFactory<P>(
  actionType: ActionType
): (payload: P) => Action<ActionType, P>
function actionCreatorFactory(
  actionType: ActionType
): (payload?: unknown) => Action<ActionType, unknown> {
  return (payload?: unknown): Action<ActionType, unknown> => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionReducersMap<S, M> = Pick<M, PickPropertyNames<M, Array<Reducer<S, any>>>>
type AllowedActions<S, M extends ActionReducersMap<S, M>> = {
  readonly [K in keyof M]: M[K] extends Array<Reducer<S, Action<infer P, infer X>>> ? Action<P, X> : never
}[keyof M]

/**
 * Creates a sliced state reducer based on default state and a action to reducer(s) mapping.
 * This avoids the gigantic switch statement most people use.
 * @template S              state type
 * @template A              action type
 * @param defaultState      default value used to initialize the state
 * @param actionReducerMap  action to reducer(s) map on the current slice of state. One action can map to multiple reducers.
 */
export const createSlicedReducer = <S, M extends ActionReducersMap<S, M>>(
  defaultState: S,
  actionReducerMap: M
) => {
  return (state: S = defaultState, action: AllowedActions<S, M>): S => {
    let newState = state
    const reducers = actionReducerMap[action.type]
    if (reducers) {
      reducers.forEach((reduce: Reducer<S, AllowedActions<S, M>>) => (newState = reduce(newState, action)))
    }
    return newState
  }
}

/**
 * ============Hooks based bound action creator related type definitions=========================
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDispatch = Dispatch<any>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DispatchableAction = (...args: any) => (Action<ActionType, unknown> | ((dispatch: AnyDispatch) => unknown))

/**
 * A type with only name to action creator mapping (action creator can create normal action or thunk).
 * @template M  A type which contains name to action creator mapping
 */
type NamedActionCreators<M> = Pick<M, PickPropertyNames<M, DispatchableAction>>

/**
 * Type used by createdBoundActionCreators as the return type.
 * It's an object with named properties as bounded action creators. Only difference with NamedActionCreators is the return type (unknown after dispatch)
 * @template M  NamedActionCreators
 */
type BoundActionCreators<M extends NamedActionCreators<M>> = {
  [K in keyof M]: (...args: Parameters<M[K]>) => unknown
}

/**
 * Function to create an object with named dispatcher (bound action creator) based on a name to action creator map.
 * This function separates the logic from useDispatch for easy unit testing.
 * @template M      type of the dispatcher map (name to primitive action creator or thunk action creator)
 * @param dispatch  dispatch object
 * @param map       dispatcher name to action creator map.
 */
export const createdBoundActionCreators = <M extends NamedActionCreators<M>>(
  dispatch: AnyDispatch,
  map: M
): BoundActionCreators<M> => {
  const result = {} as BoundActionCreators<M>

  for (const key in map) {
    // For each key in the map object, create a new object which has same set of keys but with action creators replaced with bound action creators
    result[key] = (...args: unknown[]): unknown => {
      const actionCreator = map[key]
      return dispatch(actionCreator(...args))
    }
  }

  return result
}

/**
 * Custom hooks to create an object containing named action creators with dispatch bound automatically using redux hooks.
 * @template M  type of the object contains named action creators (name to primitive action creator or thunk action creator)
 * @param map   the object contains named action creators.
 */
export const useBoundActionCreators = <M extends NamedActionCreators<M>>(map: M): BoundActionCreators<M> => {
  const dispatch = useDispatch()
  return createdBoundActionCreators(dispatch, map)
}

/**
 * Custom hooks to create a memoized object containing named action creators with dispatch bound automatically using redux hooks.
 * Object is memoized so won't get created each time you use this custom hooks.
 * @template M  type of the object contains named action creators (name to primitive action creator or thunk action creator)
 * @param map   the object contains named action creators. !!IMPORTANT!! - Don't pass a function scoped object for this
 * otherwise it'll defeat the memoization.
 */
export const useMemoizedBoundActionCreators = <M extends NamedActionCreators<M>>(map: M): BoundActionCreators<M> => {
  const dispatch = useDispatch()
  // Use useMemo to memoize the returned BoundedNamedActionCreators object so that we don't recreate it each time createdNamedBoundedActionCreators is called.
  const memoizedDispatchers = useMemo(
    () => createdBoundActionCreators(dispatch, map),
    [dispatch, map]
  )

  return memoizedDispatchers
}
