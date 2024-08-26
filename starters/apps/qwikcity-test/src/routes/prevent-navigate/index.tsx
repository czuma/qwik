import { component$, useSignal } from "@builder.io/qwik";
import { Link, usePreventNavigate$ } from "@builder.io/qwik-city";

export default component$(() => {
  const isDirty = useSignal(false);
  const runCount = useSignal(0);
  usePreventNavigate$(() => {
    runCount.value++;
    return isDirty.value;
  });

  return (
    <div>
      <div id="pn-runcount">{runCount.value}</div>
      <button id="pn-button" onClick$={() => (isDirty.value = !isDirty.value)}>
        is {isDirty.value ? "dirty" : "clean"}
      </button>
      <Link id="pn-link" href="/qwikcity-test/">
        Go home
      </Link>
    </div>
  );
});
