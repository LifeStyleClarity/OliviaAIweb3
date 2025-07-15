import { Dropdown as HeroDropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react'
import Button from './Button'
import PropTypes from 'prop-types'

const Dropdown = ({ 
  children, 
  triggerVariant = "ghost",
  triggerContent,
  isIconOnly = false,
  className = "",
  ...props 
}) => {
  return (
    <HeroDropdown className='bg-[#1B1B1B]'>
      <DropdownTrigger>
        <Button 
          variant={triggerVariant}
          isIconOnly={isIconOnly}
          className={className}
        >
          {triggerContent}
        </Button>
      </DropdownTrigger>
      <DropdownMenu 
        variant="flat"
        aria-label="Dropdown menu"
        disableAnimation
        classNames={{
          base: "bg-[#1B1B1B] border-none p-0",
          content: "border-none p-0 rounded-lg shadow-none",
          list: "bg-[#1B1B1B] p-0"
        }}
        {...props}
      >
        {children}
      </DropdownMenu>
    </HeroDropdown>
  )
}

// Re-export DropdownItem for convenience
export { DropdownItem }

Dropdown.propTypes = {
  children: PropTypes.node.isRequired,
  triggerVariant: PropTypes.oneOf(['solid', 'primary', 'bordered', 'light', 'flat', 'faded', 'shadow', 'ghost']),
  triggerContent: PropTypes.node.isRequired,
  isIconOnly: PropTypes.bool,
  className: PropTypes.string,
}

export default Dropdown
