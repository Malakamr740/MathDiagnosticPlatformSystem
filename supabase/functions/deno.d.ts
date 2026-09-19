// Global type declarations for Supabase Edge Functions (Deno runtime)
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

declare module 'https://*' {
  export const serve: (handler: (req: Request) => Promise<Response> | Response) => void
}
