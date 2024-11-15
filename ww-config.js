const virtualScrollHelp =
  "Virtual scrolling optimizes performance by only rendering visible options and a small buffer around them. When enabled, this feature can significantly improve loading and scrolling performance for large lists.</br></br>Important notes:</br>- The layout will be forced to a vertical list format</br>- Option items must be positioned at the root level of the Options List";

const bufferHelp =
  "The buffer is the amount of pixel to add to edges of the scrolling visible area to start rendering items further away.";

const minItemSizeHelp = "The minimum height of an item in the virtual scroll.";

const sizeDependenciesHelp =
  "The main property that can affect the size of the item. This prop will be watched and if it changes, the size will be recomputed.";

export default {
  options: {
    lazyHydrate: true,
    displayAllowedValues: [
      "flex",
      "block",
      "grid",
      "inline-flex",
      "inline-block",
      "inline-grid",
    ],
    linkable: true,
  },
  inherit: [{ type: "ww-layout" }, { type: "ww-background-video" }],
  editor: {
    label: {
      en: "Flexbox",
    },
    icon: "border",
    bubble: {
      icon: "border",
    },
    customStylePropertiesOrder: ["children"],
  },
  properties: {
    children: {
      label: {
        en: "Items",
        fr: "Items",
      },
      type: "Info",
      options: {
        text: { en: "Elements to repeat" },
      },
      hidden: (content, sidePanelContent, boundProps, wwProps) =>
        !!(wwProps && wwProps.isFixed),
      bindable: "repeatable",
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        validations: [
          {
            type: "array",
          },
          {
            type: "object",
          },
        ],
        tooltip:
          'A collection or an array of data: \n\n`myCollection` or `[{}, {}, ...] || ["string1", "string2", ...] || [1, 2, ...]`',
      },
      /* wwEditor:end */
    },
    flexboxItem: {
      hidden: true,
      defaultValue: {
        isWwObject: true,
        type: "b783dc65-d528-4f74-8c14-e27c934c39b1",
      },
    },
    virtualScroll: {
      label: { en: "Virtual scroll" },
      type: "OnOff",
      defaultValue: true,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        validations: [{ type: "boolean" }],
        tooltip: virtualScrollHelp,
      },
      propertyHelp: {
        tooltip: virtualScrollHelp,
      },
      /* wwEditor:end */
    },
    virtualScrollBuffer: {
      label: { en: "Buffer" },
      type: "Number",
      defaultValue: 600,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        validations: [{ type: "number" }],
        tooltip: bufferHelp,
      },
      propertyHelp: {
        tooltip: bufferHelp,
      },
      /* wwEditor:end */
      hidden: (content) => !content.virtualScroll,
    },
    virtualScrollMinItemSize: {
      label: { en: "Min item size" },
      type: "Number",
      defaultValue: 40,
      bindable: true,
      /* wwEditor:start */
      bindingValidation: {
        validations: [{ type: "number" }],
        tooltip: minItemSizeHelp,
      },
      propertyHelp: {
        tooltip: minItemSizeHelp,
      },
      /* wwEditor:end */
      hidden: (content) => !content.virtualScroll,
    },
    // virtualScrollSizeDependencies: {
    //   label: { en: "Size dependencies" },
    //   type: "TextSelect",
    //   options: (_, sidepanelContent) => {
    //     return {
    //       options: Object.keys(sidepanelContent.optionProperties).map(
    //         (property) => ({
    //           value: property,
    //           label: property,
    //         })
    //       ),
    //     };
    //   },

    //   hidden: (content) => !content.virtualScroll,
    //   /* wwEditor:start */
    //   bindingValidation: {
    //     validations: [{ type: "string" }],
    //     tooltip: sizeDependenciesHelp,
    //   },
    //   propertyHelp: {
    //     tooltip: sizeDependenciesHelp,
    //   },
    //   /* wwEditor:end */
    // },
    virtualScrollSizeDependency: {
      label: { en: "Size dependency key" },
      type: "Text",
      bindable: true,
      editorOnly: true,
      /* wwEditor:start */
      propertyHelp: {
        tooltip: sizeDependenciesHelp,
      },
      /* wwEditor:end */
      defaultValue: "",
    },
  },
};
