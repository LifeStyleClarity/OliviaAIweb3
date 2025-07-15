Dropdown
Displays a list of actions or options that a user can choose.

Installation

CLI

npm

yarn

pnpm

bun
npx heroui-cli@latest add dropdown
The above command is for individual installation only. You may skip this step if @heroui/react is already installed globally.
Import
HeroUI exports 5 dropdown-related components:

Dropdown: The main component, which is a wrapper for the other components. This component is an extension of the Popover component, so it accepts all the props of the Popover component.
DropdownTrigger: The component that triggers the dropdown menu to open.
DropdownMenu: The component that contains the dropdown items.
DropdownSection: The component that contains a group of dropdown items.
DropdownItem: The component that represents a dropdown item.

Individual

Global
Usage

Preview

Code
Dynamic items
Dropdown follows the Collection Components API, accepting both static and dynamic collections.

Static: The usage example above shows the static implementation, which can be used when the full list of options is known ahead of time.
Dynamic: The example below can be used when the options come from an external data source such as an API call, or update over time.

Preview

Code
Disabled Keys
Dropdown items can be disabled using the disabledKeys prop to the DropdownMenu component.


Preview

Code
Note: It's important to have a unique key for each item, otherwise the disabled keys will not work.

Action event
You can use the onAction prop to get the key of the selected item.


Preview

Code
Variants
You can use the variant in the DropdownMenu component to change the hover style of the dropdown items.


Preview

Code
Single Selection
You can set the selectionMode property as single to allow the user to select only one item at a time.


Preview

Code


Multiple Selection
You can set the selectionMode property as multiple to allow the user to select multiple items at a time.


Preview

Code


Note: To allow empty selection, you can set the disallowEmptySelection property as false.

With Shortcut
You can use the shortcut prop to add a shortcut to the dropdown item.


Preview

Code
Note: Dropdown does not handle the shortcut event, you need to handle it yourself.

With Icons
It is possible to add icons to the dropdown items using the startContent / endContent props.


Preview

Code
Note: If you use currentColor as the icon color, the icon will have the same color as the item text.

With Description
You can use the description prop to add a description to the dropdown item.


Preview

Code
With Sections
You can use the DropdownSection component to group dropdown items.


Preview

Code
Note: Sections without a title must provide an aria-label for accessibility.

Custom Trigger
You can use any component as a trigger for the dropdown menu, just wrap it in the DropdownTrigger component.


Preview

Code
Changing the backdrop
As we mentioned earlier, the Dropdown component is an extension of the Popover component, so it accepts all the props of the Popover component, including the backdrop prop.


Preview

Code
Routing
The <DropdownItem> component works with frameworks and client side routers like Next.js and React Router. See the Routing guide to learn how to set this up.

Slots
Dropdown has 3 components with slots the DropdownMenu, DropdownItem and DropdownSection components.

DropdownMenu
base: The main wrapper for the menu component. This slot wraps the topContent, bottomContent and the list slot.
list: The slot for the menu list component. You can see this slot as the ul slot.
emptyContent: The slot content to display when the collection is empty.
DropdownItem
base: The main slot for the dropdown item. It wraps all the other slots.
wrapper: The title and description wrapper.
title: The title of the dropdown item.
description: The description of the dropdown item.
shortcut: The shortcut slot.
selectedIcon: The selected icon slot. This is only visible when the item is selected.
DropdownSection
base: The main slot for the dropdown section. It wraps all the other slots.
heading: The title that is render on top of the section group.
group: The group of dropdown items.
divider: The divider that is render between the groups. This is only visible when showDivider is true.
Customizing the dropdown popover
The Dropdown component is an extension of the Popover component, so you can use the same slots to customize the dropdown.


Preview

Code
Customizing the dropdown items style
You can customize the dropdown items either by using the DropdownMenu itemClasses prop or by using the DropdownItem slots, the itemClasses allows you to customize all the items at once, while the slots allow you to customize each item individually.


Preview

Code
Keyboard Interactions
Key	Description
Space
When focus is on DropdownTrigger, opens the dropdown menu and focuses the first item. When focus is on an item, activates the focused item.
Enter
When focus is on DropdownTrigger, opens the dropdown menu and focuses the first item. When focus is on an item, activates the focused item.
ArrowDown
When focus is on DropdownTrigger, opens the dropdown menu. When focus is on an item, moves focus to the next item.
ArrowUp
When focus is on an item, moves focus to the previous item.
Esc
Closes the dropdown menu and moves focus to DropdownTrigger.
A-Z
 or 
a-z
When the menu is open, moves focus to the next menu item with a label that starts with the typed character if such an menu item exists.
Data Attributes
DropdownItem has the following attributes on the base element:

data-disabled: When the dropdown item is disabled. Based on dropdown disabledKeys prop.
data-selected: When the dropdown item is selected. Based on dropdown selectedKeys prop.
data-hover: When the dropdown item is being hovered. Based on useHover
data-pressed: When the dropdown item is pressed. Based on usePress
data-focus: When the dropdown item is being focused. Based on useFocusRing.
data-focus-visible: When the dropdown item is being focused with the keyboard. Based on useFocusRing.
Accessibility
Exposed to assistive technology as a button with a menu using ARIA.
Support for single, multiple, or no selection.
Support for disabled items.
Support for sections.
Complex item labeling support for accessibility.
Keyboard navigation support including arrow keys, home/end, page up/down. See Keyboard Interactions for more details.
Automatic scrolling support during keyboard navigation.
Keyboard support for opening the menu using the arrow keys, including automatically focusing the first or last item accordingly.
Typeahead to allow focusing items by typing text.
Virtualized scrolling support for performance with long lists.
API
Dropdown Props
Prop	Type	Default
children*
ReactNode[]
type
menu | listbox
"menu"
trigger
press | longPress
"press"
isDisabled
boolean
false
closeOnSelect
boolean
true
shouldBlockScroll
boolean
true
PopoverProps
PopoverProps
Dropdown Events
Prop	Type	Default
onOpenChange
(isOpen: boolean) => void
shouldCloseOnInteractOutside
(e: HTMLElement) => void
onClose
() => void
DropdownTrigger Props
Prop	Type	Default
children
ReactNode
DropdownMenu Props
Prop	Type	Default
children*
ReactNode | ((item: T) => ReactElement)
items
Iterable<T>
variant
solid | bordered | light | flat | faded | shadow
"solid"
color
default | primary | secondary | success | warning | danger
"default"
selectionMode
none | single | multiple
selectedKeys
all | Iterable<React.Key>
disabledKeys
Iterable<React.Key>
defaultSelectedKeys
all | Iterable<React.Key>
disallowEmptySelection
boolean
false
autoFocus
boolean | first | last
false
topContent
ReactNode
bottomContent
ReactNode
emptyContent
ReactNode
"No items."
hideEmptyContent
boolean
false
hideSelectedIcon
boolean
false
shouldFocusWrap
boolean
false
closeOnSelect
boolean
true
disableAnimation
boolean
false
classNames
Partial<Record<'base'｜'list'｜'emptyContent', string>>
itemClasses
Partial<Record<'base'｜'wrapper'｜'title'｜'description'｜'shortcut'｜'selectedIcon', string>>
DropdownMenu Events
Prop	Type	Default
onAction
(key: React.Key) => void
onSelectionChange
(keys: "all" | Set<React.Key> & {anchorKey?: string; currentKey?: string}) => void
onClose
() => void
DropdownSection Props
Prop	Type	Default
children*
ReactNode
title
string
items
Iterable<T>
hideSelectedIcon
boolean
false
showDivider
boolean
false
dividerProps
DividerProps
classNames
Record<'base'｜'heading'｜'group'｜'divider', string>>
itemClasses
Record<'base'｜'wrapper'｜'title'｜'description'｜'shortcut'｜'selectedIcon', string>>
DropdownItem Props
Prop	Type	Default
children*
ReactNode
key
React.Key
title
string | ReactNode
textValue
string
description
string | ReactNode
shortcut
string | ReactNode
startContent
ReactNode
endContent
ReactNode
selectedIcon
SelectedIconProps
showDivider
boolean
false
href
string
target
HTMLAttributeAnchorTarget
rel
string
download
boolean | string
ping
string
referrerPolicy
HTMLAttributeReferrerPolicy
isDisabled
boolean
false
isSelected
boolean
false
isReadOnly
boolean
false
hideSelectedIcon
boolean
false
closeOnSelect
boolean
true
classNames
Record<'base'｜'wrapper'｜'title'｜'description'｜'shortcut'｜'selectedIcon', string>>
DropdownItem Events
Prop	Type	Default
onAction
() => void
onClose
() => void
onPress
(e: PressEvent) => void
onPressStart
(e: PressEvent) => void
onPressEnd
(e: PressEvent) => void
onPressChange
(isPressed: boolean) => void
onPressUp
(e: PressEvent) => void
onKeyDown
(e: KeyboardEvent) => void
onKeyUp
(e: KeyboardEvent) => void
onClick
MouseEventHandler
Types
Dropdown Item Selected Icon Props
