<template>
  <DynamicScroller
    ref="scrollerRef"
    :items="children"
    :min-item-size="virtualScrollMinItemSize"
    :buffer="virtualScrollBuffer"
    :key="`scroller-${children.length}`"
    style="border: 1px solid red"
  >
    <template v-slot="{ item, index, active }">
      <DynamicScrollerItem
        :item="item"
        :active="active"
        :data-index="index"
        :size-dependencies="[
          virtualScrollSizeDependency.value && item
            ? item[virtualScrollSizeDependency.value]
            : JSON.stringify(item),
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

    // ULTRA-DIAGNOSTIC force recalculation with production insights
    const forceRecalculation = async () => {
      console.log('🔄 Starting DIAGNOSTIC virtual scroller recalculation...');

      // 🔍 ENVIRONMENT DETECTION
      const isEditor = computed(() => {
        /* wwEditor:start */
        return props.wwEditorState?.isEditing || false;
        /* wwEditor:end */
        return false;
      });

      console.log('🌍 ENVIRONMENT:', isEditor.value ? 'EDITOR' : 'PRODUCTION');
      console.log('📊 CHILDREN COUNT:', children.value?.length || 0);
      console.log('🔧 MIN ITEM SIZE:', virtualScrollMinItemSize.value);
      console.log('📏 BUFFER SIZE:', virtualScrollBuffer.value);
      console.log('🔑 SIZE DEPENDENCY KEY:', virtualScrollSizeDependency.value);

      // Log size dependencies for each item
      if (children.value?.length > 0) {
        console.log('📋 SIZE DEPENDENCIES PER ITEM:');
        children.value.slice(0, 3).forEach((item, index) => {
          const sizeDep =
            virtualScrollSizeDependency.value && item
              ? item[virtualScrollSizeDependency.value]
              : JSON.stringify(item);
          console.log(
            `  Item ${index}: ${
              typeof sizeDep === 'string' ? sizeDep.substring(0, 50) : sizeDep
            }`
          );
        });
      }

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

      // 🔍 DEEP DIAGNOSTIC LOGGING (with comprehensive error handling)
      try {
        const scrollerEl = scrollerRef.value?.$el;
        console.log('🎯 SCROLLER ELEMENT:', scrollerEl || 'NULL');

        if (scrollerEl && scrollerEl.nodeType === Node.ELEMENT_NODE) {
          const computedStyle = window.getComputedStyle(scrollerEl);
          const rect = scrollerEl.getBoundingClientRect();

          console.log('📐 SCROLLER COMPUTED STYLES:', {
            height: computedStyle.height,
            minHeight: computedStyle.minHeight,
            maxHeight: computedStyle.maxHeight,
            display: computedStyle.display,
            overflow: computedStyle.overflow,
            overflowY: computedStyle.overflowY,
            position: computedStyle.position,
            boxSizing: computedStyle.boxSizing,
          });

          console.log('📏 SCROLLER BOUNDS:', {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
          });

          // Find the item wrapper
          const itemWrapper = scrollerEl.querySelector(
            '.vue-recycle-scroller__item-wrapper'
          );
          if (itemWrapper && itemWrapper.nodeType === Node.ELEMENT_NODE) {
            const wrapperStyle = window.getComputedStyle(itemWrapper);
            console.log('📦 ITEM WRAPPER STYLES:', {
              minHeight: wrapperStyle.minHeight,
              height: wrapperStyle.height,
              position: wrapperStyle.position,
              boxSizing: wrapperStyle.boxSizing,
            });
          }

          // Test CSS variable resolution
          const testEl = document.createElement('div');
          testEl.style.fontFamily = 'var(--ww-default-font-family)';
          testEl.style.fontSize = '16px';
          testEl.innerHTML = 'Test';
          scrollerEl.appendChild(testEl);

          const testStyle = window.getComputedStyle(testEl);
          console.log('🔤 CSS VARIABLE TEST:', {
            fontFamily: testStyle.fontFamily,
            fontSize: testStyle.fontSize,
            lineHeight: testStyle.lineHeight,
            resolved: !testStyle.fontFamily.includes('var(--'),
          });

          scrollerEl.removeChild(testEl);
        }

        // Log virtual scroller internal properties
        console.log('⚙️ VIRTUAL SCROLLER INTERNAL:', {
          ready: scrollerRef.value.ready,
          items: scrollerRef.value.items?.length,
          visibleItems: scrollerRef.value.visibleItems?.length,
          itemSize: scrollerRef.value.itemSize,
          sizes: scrollerRef.value.sizes,
        });

        // 🔍 LOG INDIVIDUAL ITEM MEASUREMENTS
        const itemViews = scrollerEl.querySelectorAll(
          '.vue-recycle-scroller__item-view'
        );
        console.log('📋 VISIBLE ITEMS COUNT:', itemViews.length);

        itemViews.forEach((itemView, index) => {
          const itemRect = itemView.getBoundingClientRect();
          const itemStyle = window.getComputedStyle(itemView);
          const transform = itemStyle.transform;

          // Find the text content
          const textEl = itemView.querySelector('p');
          const textContent = textEl ? textEl.textContent : 'no text';

          console.log(`📄 ITEM ${index} (${textContent}):`, {
            height: itemRect.height,
            width: itemRect.width,
            transform: transform,
            position: itemStyle.position,
            top: itemRect.top,
            bottom: itemRect.bottom,
          });
        });

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

            // Log final state after recalculation
            setTimeout(() => {
              if (scrollerRef.value.$el) {
                const finalWrapper = scrollerRef.value.$el.querySelector(
                  '.vue-recycle-scroller__item-wrapper'
                );
                if (finalWrapper) {
                  const finalStyle = window.getComputedStyle(finalWrapper);
                  console.log('🏁 FINAL WRAPPER HEIGHT:', finalStyle.minHeight);
                }
              }
            }, 100);
          }
        }, 200);

        console.log('✅ Diagnostic recalculation methods called successfully');
      } catch (error) {
        console.error('❌ Error during diagnostic recalculation:', error);
        console.log('🔍 Fallback diagnostic info:', {
          scrollerRefExists: !!scrollerRef.value,
          scrollerElExists: !!scrollerRef.value?.$el,
          childrenCount: children.value?.length || 0
        });
        
        // Simplified diagnostic without getComputedStyle
        try {
          const scrollerEl = scrollerRef.value?.$el;
          if (scrollerEl) {
            const itemWrapper = scrollerEl.querySelector('.vue-recycle-scroller__item-wrapper');
            if (itemWrapper) {
              console.log('🔧 FALLBACK - Item wrapper found, checking inline styles...');
              console.log('📏 WRAPPER INLINE STYLE:', itemWrapper.style.cssText || 'no inline styles');
            }
            
            const itemViews = scrollerEl.querySelectorAll('.vue-recycle-scroller__item-view');
            console.log('📋 FALLBACK - Visible items:', itemViews.length);
          }
        } catch (fallbackError) {
          console.error('❌ Even fallback diagnostic failed:', fallbackError);
        }
      }

      console.log('✨ Diagnostic recalculation complete');
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
