import {
  implicit$FirstArg,
  noSerialize,
  useContext,
  useServerData,
  useVisibleTask$,
  type QRL,
} from '@builder.io/qwik';
import {
  ContentContext,
  DocumentHeadContext,
  RouteActionContext,
  RouteLocationContext,
  RouteNavigateContext,
  RoutePreventNavigateContext,
} from './contexts';
import type {
  RouteLocation,
  ResolvedDocumentHead,
  RouteNavigate,
  QwikCityEnvData,
  RouteAction,
  PreventNavigateCallback,
} from './types';

/** @public */
export const useContent = () => useContext(ContentContext);

/**
 * Returns the document head for the current page. The generic type describes the front matter.
 *
 * @public
 */
export const useDocumentHead = <
  FrontMatter extends Record<string, unknown> = Record<string, any>,
>(): Required<ResolvedDocumentHead<FrontMatter>> => useContext<any>(DocumentHeadContext);

/** @public */
export const useLocation = (): RouteLocation => useContext(RouteLocationContext);

/** @public */
export const useNavigate = (): RouteNavigate => useContext(RouteNavigateContext);

/** @internal */
export const usePreventNavigateQrl = (fn: QRL<PreventNavigateCallback>): void => {
  const registerPreventNav = useContext(RoutePreventNavigateContext);
  // Note: we have to use a visible task because:
  // - the onbeforeunload event is synchronous, so we need to preload the callbacks
  // - to unregister the callback, we need to run code on unmount, which means a visible task
  // - it allows removing the onbeforeunload event listener when no callbacks are registered, which is better for older Firefox versions
  // - preventing navigation implies user interaction, so we'll need to load the framework anyway
  useVisibleTask$(() => registerPreventNav(fn));
};
/** @public Prevents navigation when the callback returns a truthy value. Use this to prevent data loss when the application has unsaved state */
export const usePreventNavigate$ = implicit$FirstArg(usePreventNavigateQrl);

export const useAction = (): RouteAction => useContext(RouteActionContext);

export const useQwikCityEnv = () => noSerialize(useServerData<QwikCityEnvData>('qwikcity'));
