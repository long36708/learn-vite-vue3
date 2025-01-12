<script lang="ts" setup>
import InjectDemo from "./InjectDemo.vue";

function mySetupApp({ story, variant }) {
  // App options
  return {
    provide: {
      demo: "meow",
    },
  };
}
</script>

<template>
  <Story title="Story setup">
    <Variant title="Global setup">
      <InjectDemo />
    </Variant>

    <Variant title="Local setup" :setup-app="mySetupApp">
      <InjectDemo />
    </Variant>
  </Story>
</template>
