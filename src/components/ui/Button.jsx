import { Button as HeroButton, Spinner } from '@heroui/react'
import PropTypes from 'prop-types'
import { forwardRef } from 'react'

const Button = forwardRef(({ 
  children, 
  onPress = () => {}, 
  variant = "solid", 
  className = "", 
  fullWidth = false,
  isIconOnly = false,
  isLoading = false,
  isDisabled = false,
  borderColor = "white",
  ...props 
}, ref) => {
  const baseStyles = {
    primary: "bg-gradient-to-r from-[#31F46E] to-[#0AFDE1] border-none text-gray-900 hover:opacity-90",
    ghost: "!bg-transparent !border-none active:!bg-transparent focus:!bg-transparent hover:!bg-transparent pressed:!bg-transparent data-[pressed]:!bg-transparent data-[hover=true]:!bg-transparent",
    bordered: `!bg-transparent border-1 border-solid border-[${borderColor}]/50 rounded-lg`,
    borderedV2: `!bg-transparent border-1 border-opacity-10 border-solid border-[${borderColor}]/10 rounded-lg`
  }

  return (
    <HeroButton
      ref={ref}
      onPress={onPress}
      variant={variant === "primary" ? "solid" : variant}
      size="sm"
      isIconOnly={isIconOnly}
      isDisabled={isDisabled}
      fullWidth={fullWidth}
      className={`${baseStyles[variant] || ""} ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Spinner size="sm" color={variant === "primary" ? "black" : "white"} />
          {typeof children === 'string' ? children : null}
        </div>
      ) : children}
    </HeroButton>
  )
})

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onPress: PropTypes.func,
  variant: PropTypes.oneOf(['solid', 'primary', 'bordered', 'light', 'flat', 'faded', 'shadow', 'ghost']),
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  isIconOnly: PropTypes.bool,
  isLoading: PropTypes.bool,
  isDisabled: PropTypes.bool,
  borderColor: PropTypes.string,
}

Button.displayName = 'Button'

export default Button
