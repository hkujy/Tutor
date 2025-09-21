import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: 'STUDENT' | 'TUTOR' | 'ADMIN'
      isVerified: boolean
      studentId?: string
      tutorId?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: 'STUDENT' | 'TUTOR' | 'ADMIN'
    isVerified: boolean
    studentId?: string
    tutorId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: 'STUDENT' | 'TUTOR' | 'ADMIN'
    isVerified: boolean
    studentId?: string
    tutorId?: string
  }
}
