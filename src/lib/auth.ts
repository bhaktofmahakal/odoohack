import { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { company: true }
          })

          if (!existingUser) {
            // First time signup - create company and admin user
            const userLocation = await getUserLocation()
            
            const company = await prisma.company.create({
              data: {
                name: `${user.name}'s Company`,
                currency: userLocation.currency || 'USD',
                country: userLocation.country || 'United States',
                countryCode: userLocation.countryCode || 'US'
              }
            })

            await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                image: user.image,
                role: 'ADMIN',
                companyId: company.id,
                googleId: profile?.sub
              }
            })
          }

          return true
        } catch (error) {
          console.error('Error during sign in:', error)
          return false
        }
      }
      return true
    },
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { 
          company: true,
          manager: true,
          employees: true
        }
      })

      if (dbUser) {
        session.user = {
          ...session.user,
          id: dbUser.id,
          role: dbUser.role,
          companyId: dbUser.companyId,
          company: dbUser.company ? {
            id: dbUser.company.id,
            name: dbUser.company.name
          } : undefined,
          managerId: dbUser.managerId || undefined,
          manager: dbUser.manager ? {
            id: dbUser.manager.id,
            name: dbUser.manager.name || ''
          } : undefined,
          employees: dbUser.employees?.map(emp => ({
            id: emp.id,
            name: emp.name || ''
          })) || undefined
        }
      }

      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
}

async function getUserLocation() {
  try {
    // Get user IP and location
    const ipResponse = await fetch('https://ipapi.co/json/')
    const ipData = await ipResponse.json()
    
    if (ipData.country) {
      // Get currency for country
      const countriesResponse = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies,cca2')
      const countries = await countriesResponse.json()
      
      const userCountry = countries.find((country: any) => 
        country.cca2 === ipData.country_code
      )
      
      if (userCountry && userCountry.currencies) {
        const currencyCode = Object.keys(userCountry.currencies)[0]
        return {
          country: ipData.country_name,
          countryCode: ipData.country_code,
          currency: currencyCode
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user location:', error)
  }
  
  return {
    country: 'United States',
    countryCode: 'US',
    currency: 'USD'
  }
}