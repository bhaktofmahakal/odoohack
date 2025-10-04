import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      companyId?: string
      managerId?: string
      company?: {
        id: string
        name: string
      }
      manager?: {
        id: string
        name: string
      }
      employees?: Array<{
        id: string
        name: string
      }>
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    companyId?: string
    managerId?: string
    company?: {
      id: string
      name: string
    }
    manager?: {
      id: string
      name: string
    }
    employees?: Array<{
      id: string
      name: string
    }>
  }
}