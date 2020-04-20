import { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { Action, Dispatch } from 'redux'

/**
 * StringAction for all actions with string as the action type
 * @template TType: action type
 * @template TPayload: payload type
 */
export interface StringAction<
  TType extends string = string,
  TPayload = undefined
> extends Action<TType> {
  payload: TPayload;
}

/**
 * Factory method to help create an action creator.
 * We use method overloads to allow proper typing on actions with or without a payload
 * @template TActionType: action type
 * @template TActionPayload action payload type
 * @param actionType action type
 */
function actionCreatorFactory<TActionType extends string, TActionPayload>(
  actionType: TActionType
): (payload: TActionPayload) => StringAction<TActionType, TActionPayload>
function actionCreatorFactory<TActionType extends string>(
  actionType: TActionType
): () => StringAction<TActionType>
function actionCreatorFactory(
  actionType: string
): (payload?: unknown) => StringAction<string, unknown> {
  return (payload?: unknown): StringAction<string, unknown> => {
    return { type: actionType, payload: payload }
  }
}

/**
 * createActionCreator export
 */
export const createActionCreator = actionCreatorFactory

/**
 * Type for action to reducer(s) mapping.
 * Each action can have one or more reducers handling it.
 * @template TState: state type
 * @template TActionType: action type (string/string enum)
 */
export type TActionReducerMap<TState, TActionType extends string> = {
  readonly [actionType in TActionType]: ((
    state: TState,
    action: StringAction<actionType, unknown>
  ) => TState)[]
}

/**
 * Creates a sliced state reducer based on default state and a action to reducer(s) mapping.
 * This avoids the gigantic switch statement most people use.
 * @template TState: state type
 * @template TActionType: action type
 * @param defaultState: default value used to initialize the state
 * @param actionReducerMap: action to reducer(s) map on the current slice of state
 */
export const slicedReducerFactory = <TState, TActionType extends string>(
  defaultState: TState,
  actionReducerMap: TActionReducerMap<TState, TActionType>
) => {
  return (state: TState = defaultState, action: StringAction<TActionType, unknown>): TState => {
    let newState = state
    const reducers = actionReducerMap[action.type]
    if (reducers) {
      reducers.forEach((r) => (newState = r(newState, action)))
    }
    return newState
  }
}

/**
 * Type for a dispatchable action creator (action creator or thunk action creator)
 */
export type DispatchableActionCreator = (
  ...args: any
) => StringAction<string, any> | ((dispatch: Dispatch<any>) => any)

/**
 * A map type (dispatcher name to action creator mapping).
 * @template T: "dispatchers" object shape
 */
export type NamedDispatcherMapObject<T = any> = {
  readonly [K in keyof T]: DispatchableActionCreator
}

/**
 * named dispatcher type used by useCallbackDispatchers as the return type
 * @template M: DispatcherMapObject
 */
export type NamedDispatchers<M extends NamedDispatcherMapObject = any> = {
  [K in keyof M]: (...args: Parameters<M[K]>) => any
}

/**
 * Function to create an object with named dispatcher (bound action creator) based on a name to action creator map.
 * This function separates the logic from useDispatch for easy unit testing.
 * @template M: type of the dispatcher map (name to primitive action creator or thunk action creator)
 * @param map: dispatcher name to action creator map.
 */
export const namedDispatchersFactory = <M extends NamedDispatcherMapObject>(
  dispatch: Dispatch<any>,
  map: M
): NamedDispatchers<M> => {
  const result = {} as NamedDispatchers<M>
  for (const key in map) {
    // For each key in the map object, create a new object which has same set of keys but with action creators replaced with bound action creators
    result[key] = (...args: any) => {
      return dispatch(map[key](...args))
    }
  }
  return result
}

/**
 * Custom hooks to create a list of named dispatchers (bound action creators) in which dispatch is handled automatically.
 * All dispatcher is guarded with useMemo.
 * @template M: type of the dispatcher map (name to primitive action creator or thunk action creator)
 * @param map: dispatcher name to action creator map. IMPORTANT - define the map as a global const. Never pass a function
 * scoped map otherwise it'll defeat the memoization.
 */
export const useMemoNamedDispatchers = <M extends NamedDispatcherMapObject>(
  map: M
): NamedDispatchers<M> => {
  const dispatch = useDispatch()

  // I was using 'useCallback' to memoize each named dispatcher. However it doesn't work anymore after I moved the
  // parameters into a 'map' object - useCallback doesn't work on map properties of the map since those useCallbacks calls
  // are not deterministic in React's view. So I switched to useMemo to memoize the named dispatcher object instead.
  const memoizedDispatchers = useMemo(
    () => namedDispatchersFactory(dispatch, map),
    [dispatch, map]
  )

  return memoizedDispatchers
}
