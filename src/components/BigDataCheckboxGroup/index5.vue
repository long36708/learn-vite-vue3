<!--
 * @Author: longmo
 * @Date: 2025-01-10 21:32:48
 * @LastEditTime: 2025-01-12 18:19:29
 * @FilePath: src/components/BigDataCheckboxGroup/index5.vue
 * @Description:
 - 尽量避免使用watch,性能最优
 - 尽量在事件中处理逻辑
 - 以及使用组件默认的v-modal由组件自身更改v-modal绑定的值，而非外部开发者进行修改
 - 使用 set 作为选中项
 -->
<script>
import CustomLabel from './CustomLabel.vue'
import {
  calcCurrentPageMaxLength,
  calcIfCheckedAll,
  calcIfCheckLimitBySet,
  calcIfCurrentPageCheckedAllBySet,
  compare,
  EVENT_NAME_UP_MAX,
  filterNotInSet,
  getLimitKeys,
  isEqualArray,
  MAX_LENGTH,
  normalizeList,
} from './utils.js'
// eslint-disable-next-line import/no-default-export
export default {
  name: 'BigDataCheckboxGroup',
  components: {
    CustomLabel,
    // CustomLabel: {
    //   render(h) {
    //     // console.log("CustomLabel", this.$attrs);
    //     const { item, itemComponent } = this.$attrs
    //     if (itemComponent) {
    //       return h(
    //         itemComponent,
    //         {
    //           props: {
    //             item,
    //           },
    //           inheritAttrs: false,
    //         },
    //         this.$slots.default
    //       )
    //     }
    //     return h('span', item?.label, this.$slots.default)
    //   },
    // },
  },
  inheritAttrs: false,
  props: {
    dataSource: {
      type: Array,
      default: () => [],
    },
    itemKey: {
      type: String,
      default: 'id',
    },
    itemName: {
      type: String,
      default: 'label',
    },
    itemComponent: {
      type: Object,
      default: undefined, // 自定义组件
    },
    maxLength: {
      required: false,
      type: Number,
      default: Infinity,
    },
    pageSizes: {
      type: Array,
      default: () => [100, 200, 300, 500, 1000],
    },
    pageSize: {
      type: Number,
      default: 100,
    },
  },
  data() {
    return {
      labelList: [],
      checkedLabelKeys: new Set(), // 所有选中的keys
      filterText: '',
      totalCount: 0,
      filteredLabelList: [],
      visibleList: [], // 当前页显示的数据
      currentPage: 1,
      innerPageSize: 100,
      isCheckedAll: false, // 是否全选所有页面的checkbox
      isIndeterminate: false, // 是否半选checkbox
      isCurrentPageCheckedAll: false, // 是否全选当前页
      isCheckedLimit: false, // 是否全选前xxx条
      previousPageCheckedKeys: [], // 上一次当前页面选中的keys
      currentPageCheckedKeys: [], // 当前页选中的keys
      currentPageMaxLength: undefined, // 默认不设置这个属性
      disabledGroup: undefined,
    }
  },
  computed: {
    shouldLimitChecked() {
      return this.maxLength !== MAX_LENGTH && this.maxLength <= this.filteredLabelList.length
    },
    currentPageKeys() {
      return this.visibleList.map(item => item?.id)
    },
    hasVisibleData() {
      return this.visibleList.length > 0
    },
    /**
     * 是否全选按钮禁用
     * 当没有数据时，禁用全选按钮
     * 当数据量超过最大限制时，禁用全选按钮
     * @returns {boolean}
     */
    disableCheckAllBtn() {
      return (
        this.filteredLabelList.length === 0 ||
        (this.shouldLimitChecked && this.checkedLabelKeys.size >= this.maxLength)
      )
    },
    /**
     * 是否全选当前页按钮禁用
     * 当没有数据时，禁用全选当前页按钮
     * 当前页数量超过最大限制时，禁用全选当前页按钮
     * 当 pageSize + 当前选中数量大于最大限制时，禁用全选当前页按钮
     * 当开启了最大数量，并且当前页数量达到最大限制时，对超过指定数量的页码进行禁用全选当前页按钮
     * @returns {boolean}
     */
    disableCheckAllCurrentPageBtn() {
      if (this.visibleList.length === 0 || this.visibleList.length > this.maxLength) {
        return true
      }
      if (!this.shouldLimitChecked) {
        return false
      }
      // 若开启了限制，只判断前几页允许勾选，超过限制的禁止
      if (this.isCheckedLimit) {
        const pageNo = Math.floor(this.maxLength / this.innerPageSize)
        if (this.currentPage > pageNo) {
          return true
        }
      }
      // 若当前页选中了，则不禁用，否则无法取消全选
      if (this.isCurrentPageCheckedAll) {
        return false
      }
      // 否则，需判断假设当前页允许勾选，是否会超出允许的限制;若超出了，并且不是选中当前页
      const checkedLabelKeysWithoutCurrentPage = filterNotInSet(
        this.checkedLabelKeys,
        this.currentPageKeys
      )
      return this.visibleList.length + checkedLabelKeysWithoutCurrentPage.size > this.maxLength
    },
  },
  watch: {
    dataSource(newValue) {
      this.setData(newValue)
    },
    pageSize(newValue) {
      this.innerPageSize = newValue
      this.getVisibleList()
    },
  },
  methods: {
    // ----------- public method start -----------
    setData(labelList) {
      console.time('设置数据')
      this.labelList = Object.freeze(normalizeList(labelList, this.itemKey, this.itemName))
      console.timeEnd('设置数据')
      // todo 测试性能
      // this.labelList.length = 10_000;
      // this.labelList.length = 1_000;
      // console.log("标准化后的labelList", this.labelList);
      // 清空之前的选中项
      this.checkedLabelKeys.clear()
      this.handleSearch()
    },
    getAllCheckedKeys() {
      return this.checkedLabelKeys.slice()
    },
    // ----------- public method end -----------

    /**
     * 获取当前页数据 并判断当前页是否选中
     */
    getVisibleList() {
      console.time('计算visibleList')
      const start = (this.currentPage - 1) * this.innerPageSize
      const end = this.currentPage * this.innerPageSize
      const list = this.filteredLabelList.slice(start, end)
      console.timeEnd('计算visibleList')
      this.visibleList = list
      // todo
      const { isChecked, currentPageCheckedKeys } = calcIfCurrentPageCheckedAllBySet(
        list,
        this.checkedLabelKeys
      )
      this.isCurrentPageCheckedAll = isChecked
      console.time('监听 visibleList 变化,计算上一次当前页勾选项')
      // pref:性能优化
      this.previousPageCheckedKeys = currentPageCheckedKeys
      this.currentPageCheckedKeys = currentPageCheckedKeys
      console.timeEnd('监听 visibleList 变化,计算上一次当前页勾选项')
      const { isCheckedLimit, maxLength, checkedLabelKeys } = this
      if (!this.shouldLimitChecked) return
      this.currentPageMaxLength = calcCurrentPageMaxLength(
        isCheckedLimit,
        currentPageCheckedKeys,
        maxLength,
        checkedLabelKeys
      )
      this.disabledGroup = this.currentPageMaxLength === undefined
    },

    handleCheckedItemChange(value) {
      console.log('handleCheckedItemChange', value)
    },
    onSearch() {
      console.time('搜索数据')
      const _labelList = this.labelList
      const _filterText = this.filterText
      this.filteredLabelList = _labelList.filter(item => {
        return item.label.includes(_filterText)
      })
      this.getVisibleList()
      console.timeEnd('搜索数据')
      // console.log("filteredLabelList", this.filteredLabelList);
    },
    /**
     * 点击搜索按钮
     */
    handleSearch() {
      // todo 先进行搜索，若搜索出的结果和上一次的一样，则不重置之前的勾选
      const lastFilteredLabelList = this.filteredLabelList
      this.onSearch()
      const nextFilteredLabelList = this.filteredLabelList
      // console.log("lastFilteredLabelList", lastFilteredLabelList);
      // console.log("nextFilteredLabelList", nextFilteredLabelList);
      if (
        lastFilteredLabelList.length === nextFilteredLabelList.length &&
        isEqualArray(lastFilteredLabelList, nextFilteredLabelList)
      ) {
        return
      }
      this.isCheckedAll = false
      this.isCurrentPageCheckedAll = false
      this.checkedLabelKeys.clear()
      this.currentPage = 1 // 重置页码
    },
    handleReset() {
      this.filterText = ''
      this.setData([])
    },
    /**
     * 每页大小改变时
     * @param size
     */
    handleSizeChange(size) {
      this.innerPageSize = size
      this.currentPage = 1
      this.getVisibleList()
    },
    handleCurrentChange(curPage) {
      this.currentPage = curPage
      this.getVisibleList()
    },
    isCheckboxDisabled(id) {
      console.log(';;;;')
      // 性能优化，减少不必要的计算
      if (!this.shouldLimitChecked) return false
      if (this.checkedLabelKeys.size < this.maxLength || this.checkedLabelKeys?.has(id)) {
        return false
      }
      return true
    },
    handleCheckedAllChange(value) {
      this.isIndeterminate = false
      if (value) {
        console.log('开始全选')
        console.time('全选赋值')
        console.time('勾选全选-得到所有的ids')
        let nextCheckedKeys = this.filteredLabelList.map(item => item?.id)
        console.timeEnd('勾选全选-得到所有的ids')
        if (this.shouldLimitChecked && nextCheckedKeys.length > this.maxLength) {
          console.log(`可勾选数据量超过最大限制${this.maxLength}`)
          nextCheckedKeys = nextCheckedKeys.slice(0, this.maxLength)
          this.$emit(EVENT_NAME_UP_MAX)
          return
        }
        // todo 上方代码优化为set
        this.checkedLabelKeys = new Set(nextCheckedKeys)
        const currentPageKeys = this.currentPageKeys
        this.previousPageCheckedKeys = currentPageKeys
        this.isCurrentPageCheckedAll = true
        this.currentPageCheckedKeys = currentPageKeys
        console.timeEnd('全选赋值')
      } else {
        console.time('取消全选')
        this.checkedLabelKeys.clear()
        this.previousPageCheckedKeys = []
        this.isCurrentPageCheckedAll = false
        this.currentPageCheckedKeys = []
        console.timeEnd('取消全选')
      }
    },
    handleCheckedAllCurrentChange(value) {
      if (value) {
        // 勾选当前页
        console.log('勾选当前页', value)
        const curKeys = this.visibleList.map(item => item?.id)
        if (curKeys.length > this.maxLength) {
          console.log(`可勾选数据量超过最大限制${this.maxLength}`)
          this.isCurrentPageCheckedAll = false
          this.$emit(EVENT_NAME_UP_MAX)
          return false
        }
        const nextCheckedKeys = new Set([...curKeys, ...this.checkedLabelKeys])

        if (nextCheckedKeys.size > this.maxLength) {
          console.log(`可勾选数据量超过最大限制${this.maxLength}`)
          this.isCurrentPageCheckedAll = false
          this.$emit(EVENT_NAME_UP_MAX)
          return false
        }
        this.checkedLabelKeys = nextCheckedKeys
        this.previousPageCheckedKeys = [...curKeys]
        this.currentPageCheckedKeys = curKeys
        // 判断全选所有是否全选
        const { isCheckedAll, isIndeterminate } = calcIfCheckedAll(
          this.checkedLabelKeys.size,
          this.filteredLabelList.length
        )
        this.isCheckedAll = isCheckedAll
        this.isIndeterminate = isIndeterminate
        // todo 判断是否限制
        if (!this.shouldLimitChecked) return
        const maxLimitList = this.filteredLabelList.slice(0, this.maxLength)
        const { isCheckedLimit } = calcIfCheckLimitBySet(this.checkedLabelKeys, maxLimitList)
        this.isCheckedLimit = isCheckedLimit
      } else {
        console.log('取消勾选当前页')
        this.checkedLabelKeys = filterNotInSet(this.checkedLabelKeys, this.currentPageKeys)
        this.previousPageCheckedKeys = []
        this.currentPageCheckedKeys = []
        // 判断全选所有是否取消全选
        const { isCheckedAll, isIndeterminate } = calcIfCheckedAll(
          this.checkedLabelKeys.size,
          this.filteredLabelList.length
        )
        this.isCheckedAll = isCheckedAll
        this.isIndeterminate = isIndeterminate
        // todo 判断是否限制
        if (!this.shouldLimitChecked) return
        const maxLimitList = this.filteredLabelList.slice(0, this.maxLength)
        const { isCheckedLimit } = calcIfCheckLimitBySet(this.checkedLabelKeys, maxLimitList)
        this.isCheckedLimit = isCheckedLimit
      }
    },
    handleCheckedLabelChange(value) {
      console.time('比较当前是新增还是删除')
      const { type, data } = compare(value, this.previousPageCheckedKeys)
      console.timeEnd('比较当前是新增还是删除')

      if (type === 'add') {
        const nextCheckedKeys = new Set([...this.checkedLabelKeys, ...data])

        if (nextCheckedKeys.size > this.maxLength) {
          console.log(`可勾选数据量超过最大限制${this.maxLength}`)
          this.$emit(EVENT_NAME_UP_MAX)
          // 当前页选中项刷新
          this.currentPageCheckedKeys = this.currentPageCheckedKeys.filter(item => item !== data[0])
          return false
        } else {
          this.checkedLabelKeys = nextCheckedKeys
        }
      } else if (type === 'del') {
        console.log('取消选中')
        this.checkedLabelKeys = filterNotInSet(this.checkedLabelKeys, data)
      } else {
        // 当前页全部取消选中
        const currentPageKeys = this.visibleList.map(item => item?.id)
        this.checkedLabelKeys = filterNotInSet(this.checkedLabelKeys, currentPageKeys)
      }
      // 放到后边，因为前面判断如果超出限制，则不赋值
      this.previousPageCheckedKeys = [...value]
      // todo 判断是否取消全选本页和全选所有
      const { isCheckedAll, isIndeterminate } = calcIfCheckedAll(
        this.checkedLabelKeys.size,
        this.filteredLabelList.length
      )
      this.isCheckedAll = isCheckedAll
      this.isIndeterminate = isIndeterminate
      const { isChecked } = calcIfCurrentPageCheckedAllBySet(
        this.visibleList,
        this.checkedLabelKeys
      )
      this.isCurrentPageCheckedAll = isChecked
      // todo 判断是否达到最大限制数
      if (!this.shouldLimitChecked) return
      const maxLimitList = this.filteredLabelList.slice(0, this.maxLength)
      const { isCheckedLimit } = calcIfCheckLimitBySet(this.checkedLabelKeys, maxLimitList)
      this.isCheckedLimit = isCheckedLimit
    },
    handleCheckedLimitChange(value) {
      if (value) {
        const maxLength = this.maxLength
        const checkedLabelKeysArr = getLimitKeys(this.filteredLabelList, maxLength)

        const currentPageKeys = this.currentPageKeys
        this.previousPageCheckedKeys = checkedLabelKeysArr.filter(item =>
          currentPageKeys.includes(item)
        )
        this.checkedLabelKeys = new Set(checkedLabelKeysArr)
        // 点击选中前xxx条后是否跳到第一页待确认
        // this.currentPage = 1
        // this.isCheckedLimit = true;
        // todo 判断全选当前页是否勾选
        const { isChecked, currentPageCheckedKeys } = calcIfCurrentPageCheckedAllBySet(
          this.visibleList,
          this.checkedLabelKeys
        )
        this.isCurrentPageCheckedAll = isChecked
        this.currentPageCheckedKeys = currentPageCheckedKeys
      } else {
        this.checkedLabelKeys.clear()
        this.previousPageCheckedKeys = []
        this.isCurrentPageCheckedAll = false
        this.currentPageCheckedKeys = []
      }
      if (!this.shouldLimitChecked) return
      const { isCheckedLimit, maxLength, checkedLabelKeys, currentPageCheckedKeys } = this

      this.currentPageMaxLength = calcCurrentPageMaxLength(
        isCheckedLimit,
        currentPageCheckedKeys,
        maxLength,
        checkedLabelKeys
      )
      this.disabledGroup = this.currentPageMaxLength === undefined
    },
  },
}
</script>

<template>
  <div class="bigdata-checkbox-group-container" :class="$attrs.class" :style="$attrs.style">
    <div class="filter-container">
      <el-input
        v-model.trim="filterText"
        class="search-input"
        placeholder="请输入搜索内容"
        suffix-icon="h-icon-search"
        type="text"
      />
      <el-button
        class="search-btn"
        type="primary"
        @click="handleSearch"
        @keyup.enter.native="handleSearch"
      >
        搜索
      </el-button>
      <!--      <el-button @click="handleReset">重置</el-button>-->
    </div>
    <div class="result-container">
      <span class="text">已选：{{ checkedLabelKeys.size ?? 0 }} 项</span>
      <span class="text">当前页已选：{{ currentPageCheckedKeys.length }} 项</span>
      <span class="text">共搜索出：{{ filteredLabelList.length }} 项</span>
      <span v-show="shouldLimitChecked" class="text">
        当前允许的最大勾选数量：{{ currentPageMaxLength }}
      </span>
      <span class="text">全选框的状态：{{ isCheckedAll }}</span>
      <span class="text">全选框的半选状态：{{ isIndeterminate }}</span>
      <span class="text">全选当前页的状态：{{ isCurrentPageCheckedAll }}</span>
      <span class="text">全选前{{ maxLength }}的状态：{{ isCheckedLimit }}</span>
    </div>
    <div v-show="hasVisibleData" class="operate-container">
      <el-checkbox
        v-show="!shouldLimitChecked"
        v-model="isCheckedAll"
        :disabled="disableCheckAllBtn"
        :indeterminate="isIndeterminate"
        @change="handleCheckedAllChange"
      >
        全选
      </el-checkbox>
      <el-checkbox
        v-model="isCurrentPageCheckedAll"
        :disabled="disableCheckAllCurrentPageBtn"
        @change="handleCheckedAllCurrentChange"
      >
        全选当前页
      </el-checkbox>
      <el-checkbox
        v-show="shouldLimitChecked"
        v-model="isCheckedLimit"
        @change="handleCheckedLimitChange"
      >
        全选前{{ maxLength }}项
      </el-checkbox>
      <el-checkbox-group
        v-model="currentPageCheckedKeys"
        :max="currentPageMaxLength"
        :disabled="disabledGroup"
        class="checkbox-group"
        @change="handleCheckedLabelChange"
      >
        <el-checkbox v-for="item in visibleList" :key="item.id" :label="item.id">
          <CustomLabel :item="item" :item-component="itemComponent" />
        </el-checkbox>
      </el-checkbox-group>
    </div>

    <div v-show="!hasVisibleData" class="operate-container empty-status">
      <slot name="empty">
        <div class="empty">暂无数据 方案5</div>
        <!--      <h-empty>暂无数据</h-empty>-->
      </slot>
    </div>
    <section class="pagination-wrap">
      <el-pagination
        :current-page="currentPage"
        :page-size="innerPageSize"
        :page-sizes="pageSizes"
        :total="filteredLabelList.length"
        layout="sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </section>
  </div>
</template>

<style scoped>
.search-input {
  width: 200px;
}

.search-btn {
  margin: 0 16px;
}

.result-container {
  margin: 16px 0;
}

.text {
  margin-right: 16px;
}

.checkbox-group {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  overflow: scroll;
  max-height: 300px;
  min-height: 100px;
}

.pagination-wrap {
  margin-top: 16px;
}

.operate-container {
  width: 100%;
  min-height: 100px;
}

.operate-container.empty-status {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
