<template>
  <DynamicScroller
    ref="scrollerRef"
    :items="children"
    :min-item-size="virtualScrollMinItemSize"
    :buffer="virtualScrollBuffer"
    :key="children.length"
    style="border: 1px solid red"
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

        // Recalculate virtual scroller when children change
        if (scrollerRef.value) {
          console.log('📱 Children changed, recalculating virtual scroller...');
          nextTick(() => {
            forceRecalculation();
          });
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

    // Safe force recalculation with proper error handling
    const forceRecalculation = async () => {
      console.log('🔄 Starting virtual scroller recalculation...');

      // Multiple frame delay to ensure DOM is stable
      await nextTick();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => requestAnimationFrame(resolve));

      if (!scrollerRef.value) {
        console.warn('⚠️ scrollerRef not available, scheduling retry...');
        setTimeout(() => {
          if (scrollerRef.value) {
            console.log(
              '🔄 Retrying recalculation after scrollerRef became available'
            );
            forceRecalculation();
          }
        }, 100);
        return;
      }

      try {
        // Force multiple recalculation methods for consistency
        if (typeof scrollerRef.value.forceUpdate === 'function') {
          console.log('✅ Calling forceUpdate() on virtual scroller');
          scrollerRef.value.forceUpdate();
        }

        if (typeof scrollerRef.value.updateVisibleItems === 'function') {
          console.log('🔄 Calling updateVisibleItems()');
          scrollerRef.value.updateVisibleItems(true);
        }

        // Force size refresh with delayed secondary call
        setTimeout(() => {
          if (scrollerRef.value?.forceUpdate) {
            console.log('🔄 Secondary forceUpdate() call');
            scrollerRef.value.forceUpdate();
          }
        }, 200);

        console.log('✅ Recalculation methods called successfully');
      } catch (error) {
        console.error('❌ Error during recalculation:', error);
      }

      console.log('✨ Recalculation complete');
    };

    onMounted(() => {
      console.log(
        '🚀 Component mounted, waiting for DynamicScroller to be ready'
      );

      // Wait for DynamicScroller to be properly mounted and accessible
      const waitForScroller = () => {
        if (scrollerRef.value) {
          console.log('✅ DynamicScroller found, initializing...');

          // Single controlled recalculation after scroller is ready
          setTimeout(() => {
            forceRecalculation();
          }, 100);

          // One more recalculation after CSS/fonts are settled
          setTimeout(() => {
            forceRecalculation();
          }, 1000);
        } else {
          console.log('⏳ Waiting for DynamicScroller...');
          setTimeout(waitForScroller, 50);
        }
      };

      // Start waiting for scroller after next tick
      nextTick(waitForScroller);
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

/* Force overflow behavior in production - fixes WeWeb build interference */
.vue-recycle-scroller.direction-vertical {
  overflow-y: auto !important;
}

/* Ensure consistent sizing across environments */
.vue-recycle-scroller__item-wrapper {
  box-sizing: border-box !important;
}

.vue-recycle-scroller__item-view {
  box-sizing: border-box !important;
}
</style>
