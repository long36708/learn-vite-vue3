<!--
 @Description: 文件作用描述
 @Date: 2025-01-08 14:31
 @Version: V1.0.0
-->
<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ItemDemo',
  inheritAttrs: false,
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  mounted() {
    // console.log("item", this.item);
  },
})
</script>

<template>
  <div class="custom-label">
    {{ item.label }}
  </div>
</template>

<style scoped></style>
