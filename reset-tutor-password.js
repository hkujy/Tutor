// Reset password for tutor_no1@example.com
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetPassword() {
    const email = 'tutor_no1@example.com'
    const newPassword = 'tutor123' // Simple password for testing

    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update the user's password
        const user = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        })

        console.log('✅ Password reset successfully!')
        console.log(`Email: ${email}`)
        console.log(`New Password: ${newPassword}`)
        console.log('\nYou can now login with these credentials.')
    } catch (error) {
        console.error('Error resetting password:', error)
    } finally {
        await prisma.$disconnect()
    }
}

resetPassword()
