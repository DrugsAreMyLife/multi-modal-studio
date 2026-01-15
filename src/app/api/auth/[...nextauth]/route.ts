import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import DropboxProvider from "next-auth/providers/dropbox"

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "https://www.googleapis.com/auth/drive.file openid email profile",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        DropboxProvider({
            clientId: process.env.DROPBOX_CLIENT_ID!,
            clientSecret: process.env.DROPBOX_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            // Pass access token to the client if needed (be careful with security)
            // Usually better to keep tokens server-side and use proxy API routes
            if (session.user) {
                (session.user as any).accessToken = token.accessToken;
                (session.user as any).provider = token.provider;
            }
            return session;
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
                token.provider = account.provider;
            }
            return token;
        },
    },
})

export { handler as GET, handler as POST }
