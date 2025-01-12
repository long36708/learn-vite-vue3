<!--
 * @Author: longmo
 * @Date: 2025-01-10 21:34:50
 * @LastEditTime: 2025-01-10 21:34:57
 * @FilePath: src/components/BigDataCheckboxGroup/index4-1.vue
 * @Description:
 -->
<!--
 @Description: 注释掉监听选中的keys 选中keys变化时，不触发全选框的状态改变
 @Author: zhangshilong12
 @Date: 2025-01-07 10:47
 @Version: V1.0.0
-->
<template>
  <div class="bigdata-checkbox-group-container">
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
        >搜索
      </el-button>
      <!--      <el-button @click="handleReset">重置</el-button>-->
    </div>
    <div class="result-container">
      <span class="text">已选：{{ checkedLabelKeys.length }} 项</span>
      <span class="text">共搜索出：{{ filteredLabelList.length }} 项</span>
      <span v-show="shouldLimitChecked" class="text">
        允许的最大勾选数量：{{ maxLength }}</span
      >
      <span class="text">全选框的状态：{{ isCheckedAll }}</span>
      <span class="text">全选框的半选状态：{{ isIndeterminate }}</span>
      <span class="text">全选当前页的状态：{{ isCurrentPageCheckedAll }} </span>
      <span class="text"
        >全选前{{ maxLength }}的状态：{{ isCheckedLimit }}
      </span>
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
        class="checkbox-group"
        @change="handleCheckedLabelChange"
        :max="maxLength"
      >
        <el-checkbox
          v-for="item in visibleList"
          :key="item.id"
          :disabled="isCheckboxDisabled(item.id)"
          :label="item.id"
          @change="handleCheckedItemChange"
        >
          <CustomLabel :item="item" :itemComponent="itemComponent" />
        </el-checkbox>
      </el-checkbox-group>
    </div>

    <div v-show="!hasVisibleData" class="operate-container empty-status">
      <slot name="empty">
        <div class="empty">暂无数据 方案4</div>
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

<script>
import {
  calcIfCheckedAll,
  calcIfCheckLimit,
  calcIfCurrentPageCheckedAllNew,
  compare,
  difference,
  EVENT_NAME_UP_MAX,
  getLimitKeys,
  isEqualArray,
  MAX_LENGTH,
  normalizeList,
} from "./utils.js";

export default {
  name: "BigDataCheckboxGroup",
  props: {
    dataSource: {
      type: Array,
      default: () => [],
    },
    itemKey: {
      type: String,
      default: "id",
    },
    itemName: {
      type: String,
      default: "label",
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
  components: {
    CustomLabel: {
      render(h) {
        // console.log("CustomLabel", this.$attrs);
        const { item, itemComponent } = this.$attrs;
        if (itemComponent) {
          return h(
            itemComponent,
            {
              props: {
                item,
              },
            },
            this.$slots.default
          );
        }
        return h("span", item?.label, this.$slots.default);
      },
    },
  },
  data() {
    return {
      labelList: [],
      checkedLabelKeys: [], // 所有选中的keys
      filterText: "",
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
    };
  },
  methods: {
    // ----------- public method start -----------
    setData(labelList) {
      console.time("设置数据");
      this.labelList = Object.freeze(
        normalizeList(labelList, this.itemKey, this.itemName)
      );
      console.timeEnd("设置数据");
      // todo 测试性能
      // this.labelList.length = 10_000;
      // this.labelList.length = 1_000;
      // console.log("标准化后的labelList", this.labelList);
      // 清空之前的选中项
      this.checkedLabelKeys = [];
      this.handleSearch();
    },
    getAllCheckedKeys() {
      return this.checkedLabelKeys.slice();
    },
    // ----------- public method end -----------

    /**
     * 获取当前页数据 并判断当前页是否选中
     */
    getVisibleList() {
      console.time("计算visibleList");
      const start = (this.currentPage - 1) * this.innerPageSize;
      const end = this.currentPage * this.innerPageSize;
      const list = this.filteredLabelList.slice(start, end);
      console.timeEnd("计算visibleList");
      this.visibleList = list;
      // todo

      const { isChecked, currentPageCheckedKeys } =
        calcIfCurrentPageCheckedAllNew(list, this.checkedLabelKeys);
      this.isCurrentPageCheckedAll = isChecked;
      console.time("监听 visibleList 变化,计算上一次当前页勾选项");
      const _currentPageKeys = list.map((item) => item?.id);
      this.previousPageCheckedKeys = this.checkedLabelKeys.filter((item) =>
        _currentPageKeys.includes(item)
      );
      this.currentPageCheckedKeys = currentPageCheckedKeys;
      console.timeEnd("监听 visibleList 变化,计算上一次当前页勾选项");
    },
    handleCheckedLabelChange(value) {
      console.time("比较当前是新增还是删除");
      const { type, data } = compare(value, this.previousPageCheckedKeys);
      console.timeEnd("比较当前是新增还是删除");

      if (type === "add") {
        const nextCheckedKeys = [
          ...new Set([...this.checkedLabelKeys, ...data]),
        ];
        if (nextCheckedKeys.length > this.maxLength) {
          console.log(`可勾选数据量超过最大限制${this.maxLength}`);
          this.$emit(EVENT_NAME_UP_MAX);
          return;
        }
        this.checkedLabelKeys = nextCheckedKeys;
      } else if (type === "del") {
        console.log("取消选中");
        this.checkedLabelKeys = this.checkedLabelKeys.filter(
          (item) => !data.includes(item)
        );
      } else {
        // 当前页全部取消选中
        const currentPageKeys = this.visibleList.map((item) => item?.id);
        this.checkedLabelKeys = this.checkedLabelKeys.filter(
          (item) => !currentPageKeys.includes(item)
        );
      }
      this.previousPageCheckedKeys = [...value];
      // todo 判断是否取消全选本页和全选所有
      const { isCheckedAll, isIndeterminate } = calcIfCheckedAll(
        this.checkedLabelKeys.length,
        this.filteredLabelList.length
      );
      this.isCheckedAll = isCheckedAll;
      this.isIndeterminate = isIndeterminate;
      const { isChecked } = calcIfCurrentPageCheckedAllNew(
        this.visibleList,
        this.checkedLabelKeys
      );
      this.isCurrentPageCheckedAll = isChecked;
      // todo 判断是否限制
      if (!this.shouldLimitChecked) return;
      const maxLimitList = this.filteredLabelList.slice(0, this.maxLength);
      const { isCheckedLimit } = calcIfCheckLimit(
        this.checkedLabelKeys,
        maxLimitList
      );
      this.isCheckedLimit = isCheckedLimit;
    },
    handleCheckedItemChange(value) {
      console.log("handleCheckedItemChange", value);
    },
    onSearch() {
      console.time("搜索数据");
      const _labelList = this.labelList;
      const _filterText = this.filterText;
      this.filteredLabelList = _labelList.filter((item) => {
        return item.label.includes(_filterText);
      });
      this.getVisibleList();
      console.timeEnd("搜索数据");
      // console.log("filteredLabelList", this.filteredLabelList);
    },
    /**
     * 点击搜索按钮
     */
    handleSearch() {
      // todo 先进行搜索，若搜索出的结果和上一次的一样，则不重置之前的勾选
      const lastFilteredLabelList = this.filteredLabelList;
      this.onSearch();
      const nextFilteredLabelList = this.filteredLabelList;
      // console.log("lastFilteredLabelList", lastFilteredLabelList);
      // console.log("nextFilteredLabelList", nextFilteredLabelList);
      if (lastFilteredLabelList.length === nextFilteredLabelList.length) {
        if (isEqualArray(lastFilteredLabelList, nextFilteredLabelList)) {
          return;
        }
      }
      this.isCheckedAll = false;
      this.isCurrentPageCheckedAll = false;
      this.checkedLabelKeys = [];
      this.currentPage = 1; // 重置页码
    },
    handleReset() {
      this.filterText = "";
      this.setData([]);
    },
    /**
     * 每页大小改变时
     * @param size
     */
    handleSizeChange(size) {
      this.innerPageSize = size;
      this.currentPage = 1;
      this.getVisibleList();
    },
    handleCurrentChange(curPage) {
      this.currentPage = curPage;
      this.getVisibleList();
    },
    isCheckboxDisabled(id) {
      // 性能优化，减少不必要的计算
      if (!this.shouldLimitChecked) return false;
      if (this.checkedLabelKeys.length < this.maxLength) {
        return false;
      }
      if (!this.currentPageCheckedKeys.includes(id)) {
        return true;
      }
      return false;
    },
    handleCheckedAllChange(value) {
      this.isIndeterminate = false;
      if (value) {
        console.log("开始全选");
        console.time("全选赋值");
        console.time("勾选全选-得到所有的ids");
        let nextCheckedKeys = this.filteredLabelList.map((item) => item?.id);
        console.timeEnd("勾选全选-得到所有的ids");
        if (
          this.shouldLimitChecked &&
          nextCheckedKeys.length > this.maxLength
        ) {
          console.log(`可勾选数据量超过最大限制${this.maxLength}`);
          nextCheckedKeys = nextCheckedKeys.slice(0, this.maxLength);
          this.$emit(EVENT_NAME_UP_MAX);
          return;
        }
        this.checkedLabelKeys = nextCheckedKeys;
        const currentPageKeys = this.currentPageKeys;
        this.previousPageCheckedKeys = currentPageKeys;
        this.isCurrentPageCheckedAll = true;
        this.currentPageCheckedKeys = currentPageKeys;
        console.timeEnd("全选赋值");
      } else {
        console.time("取消全选");
        this.checkedLabelKeys = [];
        this.previousPageCheckedKeys = [];
        this.isCurrentPageCheckedAll = false;
        this.currentPageCheckedKeys = [];
        console.timeEnd("取消全选");
      }
    },
    handleCheckedAllCurrentChange(value) {
      if (value) {
        // 勾选当前页
        console.log("勾选当前页", value);
        const curKeys = this.visibleList.map((item) => item?.id);
        if (curKeys.length > this.maxLength) {
          console.log(`可勾选数据量超过最大限制${this.maxLength}`);
          this.isCurrentPageCheckedAll = false;
          this.$emit(EVENT_NAME_UP_MAX);
          return false;
        }
        const nextCheckedKeys = [
          ...new Set([...curKeys, ...this.checkedLabelKeys]),
        ];
        if (nextCheckedKeys.length > this.maxLength) {
          console.log(`可勾选数据量超过最大限制${this.maxLength}`);
          this.isCurrentPageCheckedAll = false;
          this.$emit(EVENT_NAME_UP_MAX);
          return false;
        }
        this.checkedLabelKeys = nextCheckedKeys;
        this.previousPageCheckedKeys = [...curKeys];
        this.currentPageCheckedKeys = curKeys;
        // 判断全选所有是否全选
        const { isCheckedAll, isIndeterminate } = calcIfCheckedAll(
          this.checkedLabelKeys.length,
          this.filteredLabelList.length
        );
        this.isCheckedAll = isCheckedAll;
        this.isIndeterminate = isIndeterminate;
        // todo 判断是否限制
        if (!this.shouldLimitChecked) return;
        const maxLimitList = this.filteredLabelList.slice(0, this.maxLength);
        const { isCheckedLimit } = calcIfCheckLimit(
          this.checkedLabelKeys,
          maxLimitList
        );
        this.isCheckedLimit = isCheckedLimit;
      } else {
        console.log("取消勾选当前页");
        const currentPageKeysSet = new Set(this.currentPageKeys);
        this.checkedLabelKeys = this.checkedLabelKeys.filter(
          (key) => !currentPageKeysSet.has(key)
        );
        this.previousPageCheckedKeys = [];
        this.currentPageCheckedKeys = [];
        // 判断全选所有是否取消全选
        const { isCheckedAll, isIndeterminate } = calcIfCheckedAll(
          this.checkedLabelKeys.length,
          this.filteredLabelList.length
        );
        this.isCheckedAll = isCheckedAll;
        this.isIndeterminate = isIndeterminate;
        // todo 判断是否限制
        if (!this.shouldLimitChecked) return;
        const maxLimitList = this.filteredLabelList.slice(0, this.maxLength);
        const { isCheckedLimit } = calcIfCheckLimit(
          this.checkedLabelKeys,
          maxLimitList
        );
        this.isCheckedLimit = isCheckedLimit;
      }
    },
    handleCheckedLimitChange(value) {
      if (value) {
        const maxLength = this.maxLength;
        this.checkedLabelKeys = getLimitKeys(this.filteredLabelList, maxLength);
        const currentPageKeys = this.currentPageKeys;
        this.previousPageCheckedKeys = this.checkedLabelKeys.filter((item) =>
          currentPageKeys.includes(item)
        );
        // 点击选中前xxx条后是否跳到第一页待确认
        // this.currentPage = 1
        this.isCheckedLimit = true;
        // todo 判断全选当前页是否勾选
        const { isChecked, currentPageCheckedKeys } =
          calcIfCurrentPageCheckedAllNew(
            this.visibleList,
            this.checkedLabelKeys
          );
        this.isCurrentPageCheckedAll = isChecked;
        this.currentPageCheckedKeys = currentPageCheckedKeys;
      } else {
        this.checkedLabelKeys = [];
        this.previousPageCheckedKeys = [];
        // todo 判断全选当前页是否取消勾选
        const { isChecked, currentPageCheckedKeys } =
          calcIfCurrentPageCheckedAllNew(
            this.visibleList,
            this.checkedLabelKeys
          );
        this.isCurrentPageCheckedAll = isChecked;
        this.currentPageCheckedKeys = currentPageCheckedKeys;
      }
    },
  },
  computed: {
    shouldLimitChecked() {
      return (
        this.maxLength !== MAX_LENGTH &&
        this.maxLength <= this.filteredLabelList.length
      );
    },
    currentPageKeys() {
      return this.visibleList.map((item) => item?.id);
    },
    hasVisibleData() {
      return this.visibleList.length > 0;
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
        (this.shouldLimitChecked &&
          this.checkedLabelKeys.length >= this.maxLength)
      );
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
      if (
        this.visibleList.length === 0 ||
        this.visibleList.length > this.maxLength
      ) {
        return true;
      }
      if (!this.shouldLimitChecked) {
        return false;
      }
      // 若开启了限制，只判断前几页允许勾选，超过限制的禁止
      if (this.isCheckedLimit) {
        const pageNo = Math.floor(this.maxLength / this.innerPageSize);
        if (this.currentPage > pageNo) {
          return true;
        }
      }
      // 若当前页选中了，则不禁用，否则无法取消全选
      if (this.isCurrentPageCheckedAll) {
        return false;
      }
      // 否则，需判断假设当前页允许勾选，是否会超出允许的限制;若超出了，并且不是选中当前页
      const checkedLabelKeysWithoutCurrentPage = difference(
        this.checkedLabelKeys,
        this.currentPageKeys
      );
      return (
        this.visibleList.length + checkedLabelKeysWithoutCurrentPage.length >
        this.maxLength
      );

      // 这样处理不合适，因为当前页选中后，会无法一次性取消选中
      // if (this.shouldLimitChecked) {
      //   const pageNo = Math.ceil(this.maxLength / this.innerPageSize);
      //   if (pageNo < this.currentPage) {
      //     return (
      //       this.visibleList.length + this.checkedLabelKeys.length >
      //       this.maxLength
      //     );
      //   }
      // }
      // return false
    },
  },
  watch: {
    dataSource(newValue) {
      this.setData(newValue);
    },
    pageSize(newValue) {
      this.innerPageSize = newValue;
      this.getVisibleList();
    },
  },
};
</script>

<style scoped>
.bigdata-checkbox-group-container {
}

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
