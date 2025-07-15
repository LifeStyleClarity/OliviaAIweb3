Scroll Shadow
Applies top and bottom shadows when content overflows on scroll.

Installation

CLI

npm

yarn

pnpm

bun
npx heroui-cli@latest add scroll-shadow
The above command is for individual installation only. You may skip this step if @heroui/react is already installed globally.
Import

Individual

Global
import {ScrollShadow} from "@heroui/react";
Usage

Preview

Code
Hide Scrollbar
You can use the hideScrollBar property to hide vertical and horizontal scrollbars.


Preview

Code
Custom Shadow Size
By default, the shadow size is 40 in pixels, but you can change it using the size property.


Preview

Code
Horizontal Orientation
In case you need to apply the shadow on the horizontal scroll, you can set the orientation property to horizontal.


Preview

Code
Shadow Offset
By default the shadow offset is 0 in pixels, but you can change it using the offset property. This allows you to apply the shadow on a specific position.


Preview

Code
API
ScrollShadow Props
Prop	Type	Default
size
number
"40"
offset
number
"0"
hideScrollBar
boolean
false
orientation
horizontal | vertical
"vertical"
isEnabled
boolean
true
visibility
ScrollShadowVisibility
"auto"
ScrollShadow Events
Prop	Type	Default
onVisibilityChange
(visibility: ScrollShadowVisibility) => void
Types
Scroll Shadow Visibility
