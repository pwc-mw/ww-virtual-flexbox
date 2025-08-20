<template>
  <DynamicScroller
    ref="scrollerRef"
    :items="children"
    :min-item-size="virtualScrollMinItemSize"
    :buffer="virtualScrollBuffer"
    :key="`scroller-${children.length}-${forceRenderKey}`"
    style="border: 1px solid black"
  >
    <template v-slot="{ item, index, active }">
      <DynamicScrollerItem
        :item="item"
        :active="active"
        :data-index="index"
        :size-dependencies="[
          virtualScrollSizeDependency?.value && item
            ? item[virtualScrollSizeDependency?.value]
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
    const forceRenderKey = ref(0);

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

      // Safety check - ensure all required props exist
      if (!props || !props.content) {
        console.error(
          '❌ Props or content not available, skipping recalculation'
        );
        return;
      }

      // 🔍 ENVIRONMENT DETECTION
      const isEditor = computed(() => {
        /* wwEditor:start */
        return props.wwEditorState?.isEditing || false;
        /* wwEditor:end */
        return false;
      });

      console.log('🌍 ENVIRONMENT:', isEditor?.value ? 'EDITOR' : 'PRODUCTION');
      console.log('📊 CHILDREN COUNT:', children?.value?.length || 0);
      console.log(
        '🔧 MIN ITEM SIZE:',
        virtualScrollMinItemSize?.value || 'undefined'
      );
      console.log('📏 BUFFER SIZE:', virtualScrollBuffer?.value || 'undefined');
      console.log(
        '🔑 SIZE DEPENDENCY KEY:',
        virtualScrollSizeDependency?.value || 'undefined'
      );

      // Log size dependencies for each item
      if (children?.value?.length > 0) {
        console.log('📋 SIZE DEPENDENCIES PER ITEM:');
        children.value.slice(0, 3).forEach((item, index) => {
          const sizeDep =
            virtualScrollSizeDependency?.value && item
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

        // 🔍 DEEP DOM ANALYSIS FOR CHILDREN RENDERING
        const itemViews = scrollerEl.querySelectorAll(
          '.vue-recycle-scroller__item-view'
        );
        console.log('📋 VISIBLE ITEMS COUNT:', itemViews.length);
        console.log(
          '📋 EXPECTED CHILDREN COUNT:',
          children?.value?.length || 0
        );

        // Check if items exist but are not visible (hidden, overflow, positioning issues)
        itemViews.forEach((itemView, index) => {
          const itemRect = itemView.getBoundingClientRect();
          const itemStyle = window.getComputedStyle(itemView);
          const transform = itemStyle.transform;

          // Find the text content
          const textEl = itemView.querySelector('p');
          const textContent = textEl ? textEl.textContent : 'no text';

          // Check visibility
          const isVisible =
            itemRect.height > 0 &&
            itemRect.width > 0 &&
            itemStyle.visibility !== 'hidden' &&
            itemStyle.display !== 'none';

          console.log(`📄 ITEM ${index} (${textContent}):`, {
            height: itemRect.height,
            width: itemRect.width,
            transform: transform,
            position: itemStyle.position,
            top: itemRect.top,
            bottom: itemRect.bottom,
            visibility: itemStyle.visibility,
            display: itemStyle.display,
            opacity: itemStyle.opacity,
            isVisible: isVisible,
            innerHTML: itemView.innerHTML
              ? itemView.innerHTML.substring(0, 100) + '...'
              : 'no content',
          });

          // Check if wwElement exists inside the item
          const wwElementEl = itemView.querySelector('.ww-flexbox');
          if (wwElementEl) {
            const wwElementRect = wwElementEl.getBoundingClientRect();
            const wwElementStyle = window.getComputedStyle(wwElementEl);
            console.log(`  🔗 ITEM ${index} wwElement:`, {
              height: wwElementRect.height,
              width: wwElementRect.width,
              display: wwElementStyle.display,
              visibility: wwElementStyle.visibility,
              opacity: wwElementStyle.opacity,
              hasContent: wwElementEl.children.length > 0,
            });
          } else {
            console.log(`  ❌ ITEM ${index} NO wwElement found!`);
          }
        });

        // Check if virtual scroller thinks items are rendered
        console.log('🔍 VIRTUAL SCROLLER STATE:', {
          totalItems: scrollerRef.value.items?.length || 0,
          visibleItems: scrollerRef.value.visibleItems?.length || 0,
          ready: scrollerRef.value.ready,
          scrollTop: scrollerRef.value.scrollTop || 0,
          viewStartIndex: scrollerRef.value.pool?.startIndex,
          viewEndIndex: scrollerRef.value.pool?.endIndex,
        });

        // Check if scroller has 'ready' class - critical for positioning
        const hasReadyClass = scrollerEl.classList.contains('ready');
        console.log('🎯 SCROLLER READY CLASS:', hasReadyClass);

        if (!hasReadyClass) {
          console.warn(
            '⚠️ Virtual scroller missing "ready" class - forcing ready state'
          );
          scrollerEl.classList.add('ready');

          // Force immediate recalculation after adding ready class
          setTimeout(() => {
            if (scrollerRef.value?.forceUpdate) {
              console.log('🔄 Re-recalculating after adding ready class');
              scrollerRef.value.forceUpdate();
            }
          }, 50);
        }

        // Force multiple recalculation methods for consistency
        if (typeof scrollerRef.value.forceUpdate === 'function') {
          console.log('✅ Calling forceUpdate() on virtual scroller');
          scrollerRef.value.forceUpdate();
        }

        if (typeof scrollerRef.value.updateVisibleItems === 'function') {
          console.log('🔄 Calling updateVisibleItems()');
          scrollerRef.value.updateVisibleItems(true);
        }

        // Force Vue reactivity re-render by incrementing render key
        console.log('🔄 Triggering reactivity update for DOM re-render...');
        forceRenderKey.value++;

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
          scrollerRefExists: !!scrollerRef?.value,
          scrollerElExists: !!scrollerRef?.value?.$el,
          childrenCount: children?.value?.length || 0,
          propsAvailable: !!props,
          contentAvailable: !!props?.content,
        });

        // Simplified diagnostic without getComputedStyle
        try {
          const scrollerEl = scrollerRef.value?.$el;
          if (scrollerEl) {
            const itemWrapper = scrollerEl.querySelector(
              '.vue-recycle-scroller__item-wrapper'
            );
            if (itemWrapper) {
              console.log(
                '🔧 FALLBACK - Item wrapper found, checking inline styles...'
              );
              console.log(
                '📏 WRAPPER INLINE STYLE:',
                itemWrapper.style.cssText || 'no inline styles'
              );
            }

            const itemViews = scrollerEl.querySelectorAll(
              '.vue-recycle-scroller__item-view'
            );
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
      forceRenderKey,
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

/* Ensure consistent sizing and positioning across environments */
.vue-recycle-scroller__item-wrapper {
  box-sizing: border-box !important;
  width: 100% !important;
  position: relative !important;
}

/* Critical: Force correct virtual scroller positioning */
.vue-recycle-scroller.ready .vue-recycle-scroller__item-view {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  will-change: transform !important;
}

/* Ensure proper vertical layout */
.vue-recycle-scroller.ready.direction-vertical
  .vue-recycle-scroller__item-view {
  width: 100% !important;
}
</style>
