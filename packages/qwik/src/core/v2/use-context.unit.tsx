import {
  Fragment as Component,
  Fragment,
  Fragment as Projection,
  Fragment as Signal,
  Fragment as Awaited,
} from '@builder.io/qwik';
import { describe, expect, it } from 'vitest';
import { trigger } from '../../testing/element-fixture';
import { component$ } from '../component/component.public';
import { createContextId, useContext, useContextProvider } from '../use/use-context';
import { useSignal } from '../use/use-signal';
import { domRender, ssrRenderToDom } from '../../testing/rendering.unit-util';
import '../../testing/vdom-diff.unit-util';
import { Slot } from '../render/jsx/slot.public';
import { $ } from '@builder.io/qwik';

const debug = false; //true;
Error.stackTraceLimit = 100;

/**
 * Below are helper functions that are constant. They have to be in the top level scope so that the
 * optimizer doesn't consider them as captured scope. It would be great if the optimizer could
 * detect that these are constant and don't require capturing.
 */
interface MyStore {
  value: number;
}
const myFooFnContext = createContextId<MyStore>('mytitle');
const useFooFn = () => {
  const state = useContext(myFooFnContext);

  return $((val: number) => {
    return (state.value + val).toString();
  });
};

describe.each([
  { render: ssrRenderToDom }, //
  { render: domRender }, //
])('$render.name: useContext', ({ render }) => {
  it('should provide and retrieve a context', async () => {
    const contextId = createContextId<{ value: string }>('myTest');
    const Consumer = component$(() => {
      const ctxValue = useContext(contextId);
      return <span>{ctxValue.value}</span>;
    });
    const Provider = component$(() => {
      useContextProvider(contextId, { value: 'CONTEXT_VALUE' });
      return <Consumer />;
    });

    const { vNode } = await render(<Provider />, { debug });
    expect(vNode).toMatchVDOM(
      <Component>
        <Component>
          <span>
            <Signal>CONTEXT_VALUE</Signal>
          </span>
        </Component>
      </Component>
    );
  });
  it('should provide and retrieve a context on client change', async () => {
    const contextId = createContextId<{ value: string }>('myTest');
    const Consumer = component$(() => {
      const ctxValue = useContext(contextId);
      return <span>{ctxValue.value}</span>;
    });
    const Provider = component$(() => {
      useContextProvider(contextId, { value: 'CONTEXT_VALUE' });
      const show = useSignal(false);
      return show.value ? <Consumer /> : <button onClick$={() => (show.value = true)} />;
    });

    const { vNode, document } = await render(<Provider />, { debug });
    await trigger(document.body, 'button', 'click');
    expect(vNode).toMatchVDOM(
      <Component>
        <Component>
          <span>
            <Signal>CONTEXT_VALUE</Signal>
          </span>
        </Component>
      </Component>
    );
  });

  describe('regression', () => {
    it('#4038', async () => {
      interface IMyComponent {
        val: string;
      }
      const MyComponent = component$((props: IMyComponent) => {
        const count = useSignal(0);
        const c = useFooFn();

        return (
          <>
            <p>{props.val}</p>
            <p>{c(count.value)}</p>
            <p>{count.value}</p>
            <button onClick$={() => count.value++}>Increment</button>
          </>
        );
      });

      const Parent = component$(() => {
        const c = useFooFn();

        return (
          <div>
            {c(1).then((val) => (
              <MyComponent val={val} />
            ))}
          </div>
        );
      });

      const Layout = component$(() => {
        useContextProvider(myFooFnContext, {
          value: 0,
        });
        return <Slot />;
      });
      const { vNode, document } = await render(
        <Layout>
          <Parent />
        </Layout>,
        { debug }
      );
      expect(vNode).toMatchVDOM(
        <Component>
          <Projection>
            <Component>
              <div>
                <Awaited>
                  <Component>
                    <Fragment>
                      <p>1</p>
                      <p>
                        <Awaited>0</Awaited>
                      </p>
                      <p>
                        <Signal>0</Signal>
                      </p>
                      <button>Increment</button>
                    </Fragment>
                  </Component>
                </Awaited>
              </div>
            </Component>
          </Projection>
        </Component>
      );
      await trigger(document.body, 'button', 'click');
      await trigger(document.body, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <Projection>
            <Component>
              <div>
                <Awaited>
                  <Component>
                    <Fragment>
                      <p>1</p>
                      <p>
                        <Awaited>2</Awaited>
                      </p>
                      <p>
                        <Signal>2</Signal>
                      </p>
                      <button>Increment</button>
                    </Fragment>
                  </Component>
                </Awaited>
              </div>
            </Component>
          </Projection>
        </Component>
      );
    });
    it('#5270 - retrieve context on un-projected component', async () => {
      const Issue5270Context = createContextId<{ hi: string }>('5270');
      const ProviderParent = component$(() => {
        useContextProvider(Issue5270Context, { hi: 'hello' });
        const projectSlot = useSignal(false);
        return (
          <div>
            <button
              id="issue-5270-button"
              onClick$={() => (projectSlot.value = !projectSlot.value)}
            >
              toggle
            </button>
            <br />
            {projectSlot.value && <Slot />}
          </div>
        );
      });
      const ContextChild = component$(() => {
        // return <debug />;
        const t = useContext(Issue5270Context);
        return <div id="issue-5270-div">Ctx: {t.hi}</div>;
      });
      const Issue5270 = component$(() => {
        useContextProvider(Issue5270Context, { hi: 'wrong' });
        return (
          <ProviderParent>
            <ContextChild />
          </ProviderParent>
        );
      });
      const { vNode, document } = await render(<Issue5270 />, { debug });
      expect(vNode).toMatchVDOM(
        <Component>
          <Component>
            <div>
              <button id="issue-5270-button">toggle</button>
              <br></br>
              {'' /** Slot not projected */}
            </div>
          </Component>
        </Component>
      );
      await trigger(document.body, 'button', 'click');
      expect(vNode).toMatchVDOM(
        <Component>
          <Component>
            <div>
              <button id="issue-5270-button">toggle</button>
              <br></br>
              <Projection>
                <Component>
                  <div id="issue-5270-div">
                    {'Ctx: '}
                    <Signal>{'hello'}</Signal>
                  </div>
                </Component>
              </Projection>
            </div>
          </Component>
        </Component>
      );
    });
  });
});
