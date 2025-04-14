import { Transport } from "../shared/transport.js";
import { JSONRPCMessage } from "../types.js";
import { OAuthClientProvider } from "./auth.js";
export declare class StreamableHTTPError extends Error {
    readonly code: number | undefined;
    constructor(code: number | undefined, message: string | undefined);
}
/**
 * Configuration options for the `StreamableHTTPClientTransport`.
 */
export type StreamableHTTPClientTransportOptions = {
    /**
     * An OAuth client provider to use for authentication.
     *
     * When an `authProvider` is specified and the connection is started:
     * 1. The connection is attempted with any existing access token from the `authProvider`.
     * 2. If the access token has expired, the `authProvider` is used to refresh the token.
     * 3. If token refresh fails or no access token exists, and auth is required, `OAuthClientProvider.redirectToAuthorization` is called, and an `UnauthorizedError` will be thrown from `connect`/`start`.
     *
     * After the user has finished authorizing via their user agent, and is redirected back to the MCP client application, call `StreamableHTTPClientTransport.finishAuth` with the authorization code before retrying the connection.
     *
     * If an `authProvider` is not provided, and auth is required, an `UnauthorizedError` will be thrown.
     *
     * `UnauthorizedError` might also be thrown when sending any message over the transport, indicating that the session has expired, and needs to be re-authed and reconnected.
     */
    authProvider?: OAuthClientProvider;
    /**
     * Customizes HTTP requests to the server.
     */
    requestInit?: RequestInit;
};
/**
 * Client transport for Streamable HTTP: this implements the MCP Streamable HTTP transport specification.
 * It will connect to a server using HTTP POST for sending messages and HTTP GET with Server-Sent Events
 * for receiving messages.
 */
export declare class StreamableHTTPClientTransport implements Transport {
    private _abortController?;
    private _url;
    private _requestInit?;
    private _authProvider?;
    private _sessionId?;
    private _lastEventId?;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage) => void;
    constructor(url: URL, opts?: StreamableHTTPClientTransportOptions);
    private _authThenStart;
    private _commonHeaders;
    private _startOrAuthStandaloneSSE;
    private _handleSseStream;
    start(): Promise<void>;
    /**
     * Call this method after the user has finished authorizing via their user agent and is redirected back to the MCP client application. This will exchange the authorization code for an access token, enabling the next connection attempt to successfully auth.
     */
    finishAuth(authorizationCode: string): Promise<void>;
    close(): Promise<void>;
    send(message: JSONRPCMessage | JSONRPCMessage[]): Promise<void>;
}
//# sourceMappingURL=streamableHttp.d.ts.map