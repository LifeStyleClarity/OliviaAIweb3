utton
Buttons allow users to perform actions and choose with a single tap.

Installation

CLI

npm

yarn

pnpm

bun
The above command is for individual installation only. You may skip this step if @heroui/react is already installed globally.
Import
HeroUI exports 2 button-related components:

Button: The main component to display a button.
ButtonGroup: A wrapper component to display a group of buttons.

Individual

Global
Usage

Preview

Code
Disabled

Preview

Code
Sizes

Preview

Code
Radius

Preview

Code
Colors

Preview

Code
Variants

Preview

Code
Loading
Pass the isLoading prop to display a Spinner component inside the button.


Preview

Code
You can also customize the loading spinner by passing the a custom component to the spinner prop.


Preview

Code
With Icons
You can add icons to the Button by passing the startContent or endContent props.


Preview

Code
Icon Only
You can also display a button without text by passing the isIconOnly prop and the desired icon as children.


Preview

Code
Custom Styles
You can customize the Button component by passing custom Tailwind CSS classes to the component slots.


Preview

Code
Custom class names will override the default ones thanks to Tailwind Merge library. It means that you don't need to worry about class conflicts.

Custom Implementation
You can also use the useButton hook to create your own button component.



Button Group

Preview

Code
Group Disabled
The ButtonGroup component also accepts the isDisabled prop to disable all buttons inside it.


Preview

Code
Group Use case
A common use case for the ButtonGroup component is to display a group of two buttons one for the selected value and another for the dropdown.


Preview

Code
See the Dropdown component for more details.

Data Attributes
Button has the following attributes on the base element:

data-hover: When the button is being hovered. Based on useHover
data-focus: When the button is being focused. Based on useFocusRing.
data-focus-visible: When the button is being focused with the keyboard. Based on useFocusRing.
data-disabled: When the button is disabled. Based on isDisabled prop.
data-pressed: When the button is pressed. Based on usePress
data-loading: When the button is loading. Based on isLoading prop.
Accessibility
Button has role of button.
Keyboard event support for 
Space
 and 
Enter
 keys.
Mouse and touch event handling, and press state management.
Keyboard focus management and cross browser normalization.
We recommend to read this blog post about the complexities of building buttons that work well across devices and interaction methods.

API
Button Props
Prop	Type	Default
children
ReactNode
variant
solid | bordered | light | flat | faded | shadow | ghost
"solid"
color
default | primary | secondary | success | warning | danger
"default"
size
sm | md | lg
"md"
radius
none | sm | md | lg | full
startContent
ReactNode
endContent
ReactNode
spinner
ReactNode
spinnerPlacement
start | end
"start"
fullWidth
boolean
false
isIconOnly
boolean
false
isDisabled
boolean
false
isLoading
boolean
false
disableRipple
boolean
false
disableAnimation
boolean
false
Button Events
Prop	Type	Default
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
Button Group Props
Prop	Type	Default
children
ReactNode | ReactNode[]
variant
solid | bordered | light | flat | faded | shadow | ghost
"solid"
color
default | primary | secondary | success | warning | danger
"default"
size
sm | md | lg
"md"
radius
none | sm | md | lg | full
"xl"
fullWidth
boolean
false
isDisabled
boolean
false