<template>
  <DynamicScroller
    :items="children"
    :min-item-size="virtualScrollMinItemSize"
    :buffer="virtualScrollBuffer"
    :key="children.length"
  >
    <template v-slot="{ item, index, active }">
      <DynamicScrollerItem
        :item="item"
        :active="active"
        :data-index="index"
        :size-dependencies="[
          item ? item[virtualScrollSizeDependency] : JSON.stringify(item),
        ]"
      >
        <wwLayoutItemContext :key="index" is-repeat :index="index" :data="item">
          <wwElement
            :local-data="item"
            v-bind="content.flexboxItem"
            class="ww-flexbox"
          />
        </wwLayoutItemContext>
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
</template>

<script>
import { computed, watch } from "vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";

export default {
  components: {
    DynamicScroller,
    DynamicScrollerItem,
  },
  props: {
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
    wwElementState: { type: Object, required: true },
  },
  emits: [
    "update:sidepanel-content",
    "update:content:effect",
    "update:content",
    "element-event",
  ],
  setup(props, { emit }) {
    const { hasLink, tag, properties } = wwLib.wwElement.useLink();
    const backgroundVideo = wwLib.wwElement.useBackgroundVideo();

    const isEditing = computed(() => {
      /* wwEditor:start */
      return props.wwEditorState.isEditing;
      /* wwEditor:end */
      // eslint-disable-next-line no-unreachable
      return false;
    });

    const showEmptyStateInEditor = computed(() => {
      /* wwEditor:start */
      return props.wwEditorState.sidepanelContent.showEmptyStateInEditor;
      /* wwEditor:end */
      // eslint-disable-next-line no-unreachable
      return false;
    });

    const children = computed(() => {
      if (!props.content.children || !Array.isArray(props.content.children)) {
        return [];
      }
      return props.content.children.map((child, index) => {
        if (!child?.id) return { id: index, ...child };

        return child;
      });
    });

    const virtualScrollSizeDependency = computed(
      () => props.content.virtualScrollSizeDependency
    );

    const virtualScrollMinItemSize = computed(
      () => props.content.virtualScrollMinItemSize || 40
    );

    const virtualScrollBuffer = computed(
      () => props.content.virtualScrollBuffer || 400
    );

    const isFixed = computed(() => {
      return props.wwElementState.props.isFixed;
    });

    const optionProperties = computed(() => {
      if (!children.value || children.value.length === 0) return {};
      return children.value[0];
    });
    const registerOptionProperties = (object) => {
      if (object) optionProperties.value = object;
    };
    watch(
      optionProperties,
      (value) => {
        emit("update:sidepanel-content", { path: "optionProperties", value });
        if (registerOptionProperties) registerOptionProperties(value);
      },
      { immediate: true }
    );

    /* wwEditor:start */
    watch(
      isEditing,
      () => {
        emit("update:sidepanel-content", {
          path: "showEmptyStateInEditor",
          value: false,
        });
      },
      { immediate: true, deep: true }
    );
    /* wwEditor:end */

    const onElementClick = (event) => {
      const rawIndex = event.currentTarget.dataset.wwFlexboxIndex;
      const index = parseInt(rawIndex) || 0;
      emit("element-event", { type: "click", index });
    };

    return {
      hasLink,
      properties,
      backgroundVideo,
      tag,
      isFixed,
      children,
      onElementClick,
      virtualScrollSizeDependency,
      virtualScrollMinItemSize,
      virtualScrollBuffer,
      showEmptyStateInEditor,
    };
  },
};
</script>

<style>
.-link {
  cursor: pointer;
}
.custom {
  flex-direction: row;
}
@import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
</style>
