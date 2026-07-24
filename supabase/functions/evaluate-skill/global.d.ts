declare namespace Deno {
  export interface ServeOptions {
    port?: number;
    hostname?: string;
  }
  export function serve(
    handler: (request: Request, info: any) => Response | Promise<Response>,
    options?: ServeOptions
  ): void;
  export function serve(
    options: ServeOptions & { onListen?: (localAddr: { hostname: string; port: number }) => void },
    handler: (request: Request, info: any) => Response | Promise<Response>
  ): void;

  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  };
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}

declare module "https://esm.sh/@google/generative-ai" {
  export class GoogleGenerativeAI {
    constructor(apiKey: string);
    getGenerativeModel(config: { model: string }): {
      generateContent(prompt: string): Promise<{
        response: {
          text(): string;
        };
      }>;
    };
  }
}
