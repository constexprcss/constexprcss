import { hash } from "./utils"
export const generateVarName = (key: string) => {
    const keyHash = hash(key)
    // remove all non-alphanumeric characters
    const keyNonAlphanumeric = key.replace(/[^a-zA-Z0-9]/g, '')
    
    return `--${keyHash}-${keyNonAlphanumeric}`
}