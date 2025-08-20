const virtualScrollHelp =
  "Virtual scrolling optimizes performance by only rendering visible options and a small buffer around them. When enabled, this feature can significantly improve loading and scrolling performance for large lists.</br></br>Important notes:</br>- The layout will be forced to a vertical list format</br>-";
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
      en: "Virtualbox",
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
      type: "Array",
      options: {
        item: {
          type: "Object",
          defaultValue: {},
        },
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
    },
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
