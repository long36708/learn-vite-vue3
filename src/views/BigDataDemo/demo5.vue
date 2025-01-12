<!--
 * @Author: longmo
 * @Date: 2025-01-12 12:32:30
 * @LastEditTime: 2025-01-12 18:30:47
 * @FilePath: src/views/BigDataDemo/demo5.vue
 * @Description:
 -->
<script lang="ts">
import { defineComponent } from 'vue'
import BigDataCheckboxGroup5 from '@/components/BigDataCheckboxGroup/index5.vue'
import ItemDemo from '@/components/BigDataCheckboxGroup/ItemDemo.vue'
import { INIT_COUNT, mockBigData } from '@/components/BigDataCheckboxGroup/mockBigData'

export default defineComponent({
  name: 'Demo5',
  components: { BigDataCheckboxGroup5 },
  data() {
    return {
      demo1Ref: '',
      dataSource: [],
      ItemDemo,
      listLength: INIT_COUNT,
      // maxLength: 1,
      // maxLength: 50,
      maxLength: 100,
      // maxLength: 150,
      // maxLength: 1000,
      // maxLength: 100000,
    }
  },
  methods: {
    handleSetData() {
      const list = mockBigData(this.listLength)
      this.$refs.demo1Ref?.setData(list)
      // this.dataSource = list;
    },
    handleGetData() {
      const list = this.$refs.demo1Ref?.getAllCheckedKeys()
      console.log('全部勾选的数据', list)
      console.log('半选状态', this.$refs.demo1Ref?.isIndeterminate)
    },
    onUpMax() {
      alert(`勾选数量达到最大值${this.maxLength}，禁止继续添加`)
    },
  },
})
</script>

<template>
  <div>
    <h1>Demo5</h1>
    <div class="opt-area">
      <input v-model="listLength" type="number" />
      <button @click="handleSetData">设置值</button>
      <button @click="handleGetData">获取选中项</button>
    </div>
    <BigDataCheckboxGroup5
      ref="demo1Ref"
      :data-source="dataSource"
      item-key="key"
      :item-component="ItemDemo"
    >
      <template #empty>空数据</template>
    </BigDataCheckboxGroup5>
  </div>
</template>

<style scoped></style>
