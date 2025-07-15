Modal
Displays a dialog with a custom content that requires attention or provides additional information.

Installation

CLI

npm

yarn

pnpm

bun
The above command is for individual installation only. You may skip this step if @heroui/react is already installed globally.
Import
HeroUI exports 5 modal-related components:

Modal: The main component to display a modal.
ModalContent: The wrapper of the other modal components.
ModalHeader: The header of the modal.
ModalBody: The body of the modal.
ModalFooter: The footer of the modal.

Individual

Global
Usage
When the modal opens:

Focus is bounded within the modal and set to the first tabbable element.
Content behind a modal dialog is inert, meaning that users cannot interact with it.

Preview

Code
Sizes

Preview

Code
Non-dismissible
By default, the modal can be closed by clicking on the overlay or pressing the 
Esc
 key. You can disable this behavior by setting the following properties:

Set the isDismissable property to false to prevent the modal from closing when clicking on the overlay.
Set the isKeyboardDismissDisabled property to true to prevent the modal from closing when pressing the Esc key.

Preview

Code
Modal placement
By default the modal is centered on screens higher than sm and is at the bottom of the screen on mobile. This placement is called auto, but you can change it by using the placement prop.


Preview

Code
Note: The top-center and bottom-center positions mean that the modal is positioned at the top / bottom of the screen on mobile and at the center of the screen on desktop.

Overflow scroll
You can use the scrollBehavior prop to set the scroll behavior of the modal.

inside: The modal content will be scrollable.
outside: The modal content will be scrollable and the modal will be fixed.

Preview

Code


With Form
The Modal handles the focus within the modal content. It means that you can use the modal with form elements without any problem. the focus returns to the trigger when the modal closes.


Preview

Code
Note: You can add the autoFocus prop to the first Input component to focus it when the modal opens.

Backdrop
The Modal component has a backdrop prop to show a backdrop behind the modal. The backdrop can be either transparent, opaque or blur. The default value is opaque.


Preview

Code
Custom Backdrop
You can customize the backdrop by using the backdrop slot.


Preview

Code
Custom Motion
Modal offers a motionProps property to customize the enter / exit animation.


Preview

Code
Learn more about Framer motion variants here.

Draggable
Try to drag the header part.


Preview

Code
Draggable Overflow
Set overflow to true can drag overflow the viewport.


Preview

Code
Slots
wrapper: The wrapper slot of the modal. It wraps the base and the backdrop slots.
base: The main slot of the modal content.
backdrop: The backdrop slot, it is displayed behind the modal.
header: The header of the modal, it is displayed at the top of the modal.
body: The body of the modal, it is displayed in the middle of the modal.
footer: The footer of the modal, it is displayed at the bottom of the modal.
closeButton: The close button of the modal.
Custom Styles
You can customize the Modal component by passing custom Tailwind CSS classes to the component slots.


Preview

Code
Data Attributes
Modal has the following attributes on the base element:

data-open: When the modal is open. Based on modal state.
data-dismissable: When the modal is dismissable. Based on isDismissable prop.
Accessibility
Content outside the modal is hidden from assistive technologies while it is open.
The modal optionally closes when interacting outside, or pressing the 
Esc
 key.
Focus is moved into the modal on mount, and restored to the trigger element on unmount.
While open, focus is contained within the modal, preventing the user from tabbing outside.
Scrolling the page behind the modal is prevented while it is open, including in mobile browsers.
API
Modal Props
Prop	Type	Default
children*
ReactNode
size
xs | sm | md | lg | xl | 2xl | 3xl | 4xl | 5xl | full
"md"
radius
none | sm | md | lg
"lg"
shadow
none | sm | md | lg
"lg"
backdrop
transparent | opaque | blur
"opaque"
scrollBehavior
normal | inside | outside
"normal"
placement
auto | top | center | bottom
"auto"
isOpen
boolean
defaultOpen
boolean
isDismissable
boolean
true
isKeyboardDismissDisabled
boolean
false
shouldBlockScroll
boolean
true
hideCloseButton
boolean
false
closeButton
ReactNode
motionProps
MotionProps
portalContainer
HTMLElement
"document.body"
disableAnimation
boolean
false
classNames
Partial<Record<'wrapper' | 'base' | 'backdrop' | 'header' | 'body' | 'footer' | 'closeButton', string>>
Modal Events
Prop	Type	Default
onOpenChange
(isOpen: boolean) => void
onClose
() => void
Modal types
Motion Props
Listbox
