Input
Input is a component that allows users to enter text. It can be used to get user inputs in forms, search fields, and more.

Installation

CLI

npm

yarn

pnpm

bun
npx heroui-cli@latest add input
The above command is for individual installation only. You may skip this step if @heroui/react is already installed globally.
Import

Individual

Global
import {Input} from "@heroui/input";
Usage

Preview

Code
Disabled

Preview

Code
Read Only

Preview

Code
Required
If you pass the isRequired property to the input, it will have a danger asterisk at the end of the label and the input will be required.


Preview

Code
Sizes

Preview

Code
Colors

Preview

Code
Variants

Preview

Code
Radius

Preview

Code
Label Placements
You can change the position of the label by setting the labelPlacement property to inside, outside or outside-left.


Preview

Code
Note: If the label is not passed, the labelPlacement property will be outside by default.

Password Input
You can use the type property to change the input type to password.


Preview

Code
Clear Button
If you pass the isClearable property to the input, it will have a clear button at the end of the input, it will be visible when the input has a value.


Preview

Code
Start & End Content
You can use the startContent and endContent properties to add content to the start and end of the input.


Preview

Code
With Description
You can add a description to the input by passing the description property.


Preview

Code
With Error Message
You can combine the isInvalid and errorMessage properties to show an invalid input. errorMessage is only shown when isInvalid is set to true.


Preview

Code
Example with regex email validation:


Preview

Code
Controlled
You can use the value and onValueChange properties to control the input value.


Preview

Code
Note: HeroUI Input also supports native events like onChange, useful for form libraries such as Formik and React Hook Form.

With Form
Input can be used with a Form component to leverage form state management. By default, Form components use validationBehavior="aria", which will not block form submission if any inputs are invalid. For more on form and validation behaviors, see the Forms guide.

Built-in Validation
Input supports the following native HTML constraints:

isRequired indicates that a field must have a value before the form can be submitted.
minLength and maxLength specify the minimum and length of text input.
pattern provides a custom regular expression that a text input must conform to.
type="email" and type="url" provide built-in validation for email addresses and URLs.
When using native validation, error messages can be customized by passing a function to errorMessage and checking the ValidityState of validationDetails.


Preview

Code
Custom Validation
In addition to built-in constraints, you can provide a function to the validate property for custom validation.


Preview

Code
Realtime Validation
If you want to display validation errors while the user is typing, you can control the field value and use the isInvalid prop along with the errorMessage prop.


Preview

Code
Server Validation
Client-side validation provides immediate feedback, but you should also validate data on the server to ensure accuracy and security. HeroUI allows you to display server-side validation errors by using the validationErrors prop in the Form component. This prop should be an object where each key is the field name and the value is the error message.


Preview

Code
Slots
base: Input wrapper, it handles alignment, placement, and general appearance.
label: Label of the input, it is the one that is displayed above, inside or left of the input.
mainWrapper: Wraps the inputWrapper when position is outside / outside-left.
inputWrapper: Wraps the label (when it is inside) and the innerWrapper.
innerWrapper: Wraps the input, the startContent and the endContent.
input: The input element.
clearButton: The clear button, it is at the end of the input.
helperWrapper: Wraps the description and the errorMessage.
description: The description of the input.
errorMessage: The error message of the input.
Custom Styles
You can customize the Input component by passing custom Tailwind CSS classes to the component slots.


Preview

Code
Custom Implementation
In case you need to customize the input even further, you can use the useInput hook to create your own implementation.

Data Attributes
Input has the following attributes on the base element:

data-invalid: When the input is invalid. Based on isInvalid prop.
data-required: When the input is required. Based on isRequired prop.
data-readonly: When the input is readonly. Based on isReadOnly prop.
data-hover: When the input is being hovered. Based on useHover
data-focus: When the input is being focused. Based on useFocusRing.
data-focus-within: When the input is being focused or any of its children. Based on useFocusWithin.
data-focus-visible: When the input is being focused with the keyboard. Based on useFocusRing.
data-disabled: When the input is disabled. Based on isDisabled prop.
Accessibility
Built with a native <input> element.
Visual and ARIA labeling support.
Change, clipboard, composition, selection, and input event support.
Required and invalid states exposed to assistive technology via ARIA.
Support for description and error message help text linked to the input via ARIA.
API
Input Props
Prop	Type	Default
children
ReactNode
variant
flat | bordered | faded | underlined
"flat"
color
default | primary | secondary | success | warning | danger
"default"
size
sm | md | lg
"md"
radius
none | sm | md | lg | full
label
ReactNode
value
string
defaultValue
string
placeholder
string
description
ReactNode
errorMessage
ReactNode | ((v: ValidationResult) => ReactNode)
validate
(value: string) => ValidationError | true | null | undefined
validationBehavior
native | aria
"native"
minLength
number
maxLength
number
pattern
string
type
text | email | url | password | tel | search | file
"text"
startContent
ReactNode
endContent
ReactNode
labelPlacement
inside | outside | outside-left
"inside"
fullWidth
boolean
true
isClearable
boolean
false
isRequired
boolean
false
isReadOnly
boolean
false
isDisabled
boolean
false
isInvalid
boolean
false
baseRef
RefObject<HTMLDivElement>
disableAnimation
boolean
false
classNames
Partial<Record<'base' | 'label' | 'inputWrapper' | 'innerWrapper' | 'mainWrapper' | 'input' | 'clearButton' | 'helperWrapper' | 'description' | 'errorMessage', string>>
Input Events
Prop	Type	Default
onChange
React.ChangeEvent<HTMLInputElement>
onValueChange
(value: string) => void
onClear
() => void