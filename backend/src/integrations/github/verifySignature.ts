import crypto from "crypto"

export function verifyGitHubSignature(
    secret: string,
    payload: string,
    signatureHeader: string | undefined
): boolean {
    if (!signatureHeader) return false

    const hmac = crypto.createHmac("sha256", secret)
    const digest = `sha256=${hmac.update(payload).digest("hex")}`

    try {
        return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader))
    } catch {
        return false
    }
}