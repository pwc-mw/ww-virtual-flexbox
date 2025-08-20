<template>
  <DynamicScroller
    ref="scrollerRef"
    :items="children"
    :min-item-size="virtualScrollMinItemSize"
    :buffer="virtualScrollBuffer"
    :key="children.length"
    style="border: 1px solid black"
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
            @click="onElementClick"
            @click.capture="onClickCapture"
          />
        </wwLayoutItemContext>
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller';

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
    'update:sidepanel-content',
    'update:content:effect',
    'update:content',
    'element-event',
  ],
  setup(props, { emit }) {
    const { hasLink, tag, properties } = wwLib.wwElement.useLink();
    const backgroundVideo = wwLib.wwElement.useBackgroundVideo();

    const scrollerRef = ref(null);
    const fontLoadKey = ref(0);

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

    const optionProperties = ref({});

    // Update optionProperties when children change
    watch(
      children,
      (newChildren) => {
        if (newChildren && newChildren.length > 0) {
          optionProperties.value = newChildren[0];
        } else {
          optionProperties.value = {};
        }
      },
      { immediate: true }
    );

    const registerOptionProperties = (object) => {
      if (object) optionProperties.value = object;
    };
    watch(
      optionProperties,
      (value) => {
        emit('update:sidepanel-content', { path: 'optionProperties', value });
        if (registerOptionProperties) registerOptionProperties(value);
      },
      { immediate: true }
    );

    /* wwEditor:start */
    watch(
      isEditing,
      () => {
        emit('update:sidepanel-content', {
          path: 'showEmptyStateInEditor',
          value: false,
        });
      },
      { immediate: true, deep: true }
    );
    /* wwEditor:end */

    const onElementClick = (event) => {
      const rawIndex = event.currentTarget.dataset.wwFlexboxIndex;
      const index = parseInt(rawIndex) || 0;
      emit('element-event', { type: 'click', index });
    };

    const zindexCount = ref(1);
    const onClickCapture = (event) => {
      const targetEl = event.currentTarget.closest(
        '.vue-recycle-scroller__item-view'
      );
      // const index = event.currentTarget.dataset.wwRepeatIndex ?? 0;
      targetEl.style.zIndex = zindexCount.value.toString();
      zindexCount.value = zindexCount.value + 1;
    };

    // Force size recalculation after font/CSS loading
    const forceRecalculation = async () => {
      await nextTick();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      if (scrollerRef.value && scrollerRef.value.forceUpdate) {
        scrollerRef.value.forceUpdate();
      }
    };

    onMounted(() => {
      // Wait for fonts and CSS to be fully applied with fallbacks
      const handleFontLoading = () => {
        setTimeout(forceRecalculation, 10000);
      };

      // Check if document.fonts is available (might not be in editor environment)
      if (
        typeof document !== 'undefined' &&
        document.fonts &&
        document.fonts.ready
      ) {
        document.fonts.ready.then(handleFontLoading).catch(() => {
          // Fallback if fonts API fails
          handleFontLoading();
        });
      } else {
        // Fallback for environments without fonts API
        setTimeout(handleFontLoading, 10200);
      }
    });

    return {
      hasLink,
      properties,
      backgroundVideo,
      tag,
      isFixed,
      children,
      onClickCapture,
      onElementClick,
      virtualScrollSizeDependency,
      virtualScrollMinItemSize,
      virtualScrollBuffer,
      showEmptyStateInEditor,
      scrollerRef,
    };
  },
};
</script>

<style>
.-link {
  cursor: pointer;
}

@import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
/* "vue-virtual-scroller": "^2.0.0-beta.8" */
</style>
