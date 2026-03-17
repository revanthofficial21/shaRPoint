import { useState, useEffect } from "react"

export function useUserRole() {
  const [role, setRole] = useState("user")

  useEffect(() => {
    setRole("user")
  }, [])

  return role
}