import { Toaster as Sonner, type ToasterProps } from 'sonner'

/**
 * App-wide toast host. Mounted once in the providers so any feature can call
 * `toast.success(...)` / `toast.error(...)`.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-lg border shadow-lg',
        },
      }}
      {...props}
    />
  )
}
