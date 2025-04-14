import { isJSONRPCNotification, JSONRPCMessageSchema } from "../types.js";
import { auth, UnauthorizedError } from "./auth.js";
import { EventSourceParserStream } from "eventsource-parser/stream";
export class StreamableHTTPError extends Error {
    constructor(code, message) {
        super(`Streamable HTTP error: ${message}`);
        this.code = code;
    }
}
/**
 * Client transport for Streamable HTTP: this implements the MCP Streamable HTTP transport specification.
 * It will connect to a server using HTTP POST for sending messages and HTTP GET with Server-Sent Events
 * for receiving messages.
 */
export class StreamableHTTPClientTransport {
    constructor(url, opts) {
        this._url = url;
        this._requestInit = opts === null || opts === void 0 ? void 0 : opts.requestInit;
        this._authProvider = opts === null || opts === void 0 ? void 0 : opts.authProvider;
    }
    async _authThenStart() {
        var _a;
        if (!this._authProvider) {
            throw new UnauthorizedError("No auth provider");
        }
        let result;
        try {
            result = await auth(this._authProvider, { serverUrl: this._url });
        }
        catch (error) {
            (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, error);
            throw error;
        }
        if (result !== "AUTHORIZED") {
            throw new UnauthorizedError();
        }
        return await this._startOrAuthStandaloneSSE();
    }
    async _commonHeaders() {
        var _a;
        const headers = {};
        if (this._authProvider) {
            const tokens = await this._authProvider.tokens();
            if (tokens) {
                headers["Authorization"] = `Bearer ${tokens.access_token}`;
            }
        }
        if (this._sessionId) {
            headers["mcp-session-id"] = this._sessionId;
        }
        return new Headers({ ...headers, ...(_a = this._requestInit) === null || _a === void 0 ? void 0 : _a.headers });
    }
    async _startOrAuthStandaloneSSE() {
        var _a, _b;
        try {
            // Try to open an initial SSE stream with GET to listen for server messages
            // This is optional according to the spec - server may not support it
            const headers = await this._commonHeaders();
            headers.set("Accept", "text/event-stream");
            // Include Last-Event-ID header for resumable streams
            if (this._lastEventId) {
                headers.set("last-event-id", this._lastEventId);
            }
            const response = await fetch(this._url, {
                method: "GET",
                headers,
                signal: (_a = this._abortController) === null || _a === void 0 ? void 0 : _a.signal,
            });
            if (!response.ok) {
                if (response.status === 401 && this._authProvider) {
                    // Need to authenticate
                    return await this._authThenStart();
                }
                // 405 indicates that the server does not offer an SSE stream at GET endpoint
                // This is an expected case that should not trigger an error
                if (response.status === 405) {
                    return;
                }
                throw new StreamableHTTPError(response.status, `Failed to open SSE stream: ${response.statusText}`);
            }
            // Successful connection, handle the SSE stream as a standalone listener
            this._handleSseStream(response.body);
        }
        catch (error) {
            (_b = this.onerror) === null || _b === void 0 ? void 0 : _b.call(this, error);
            throw error;
        }
    }
    _handleSseStream(stream) {
        if (!stream) {
            return;
        }
        const processStream = async () => {
            var _a, _b;
            // Create a pipeline: binary stream -> text decoder -> SSE parser
            const eventStream = stream
                .pipeThrough(new TextDecoderStream())
                .pipeThrough(new EventSourceParserStream());
            for await (const event of eventStream) {
                // Update last event ID if provided
                if (event.id) {
                    this._lastEventId = event.id;
                }
                // Handle message events (default event type is undefined per docs)
                // or explicit 'message' event type
                if (!event.event || event.event === "message") {
                    try {
                        const message = JSONRPCMessageSchema.parse(JSON.parse(event.data));
                        (_a = this.onmessage) === null || _a === void 0 ? void 0 : _a.call(this, message);
                    }
                    catch (error) {
                        (_b = this.onerror) === null || _b === void 0 ? void 0 : _b.call(this, error);
                    }
                }
            }
        };
        processStream().catch(err => { var _a; return (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, err); });
    }
    async start() {
        if (this._abortController) {
            throw new Error("StreamableHTTPClientTransport already started! If using Client class, note that connect() calls start() automatically.");
        }
        this._abortController = new AbortController();
    }
    /**
     * Call this method after the user has finished authorizing via their user agent and is redirected back to the MCP client application. This will exchange the authorization code for an access token, enabling the next connection attempt to successfully auth.
     */
    async finishAuth(authorizationCode) {
        if (!this._authProvider) {
            throw new UnauthorizedError("No auth provider");
        }
        const result = await auth(this._authProvider, { serverUrl: this._url, authorizationCode });
        if (result !== "AUTHORIZED") {
            throw new UnauthorizedError("Failed to authorize");
        }
    }
    async close() {
        var _a, _b;
        // Abort any pending requests
        (_a = this._abortController) === null || _a === void 0 ? void 0 : _a.abort();
        (_b = this.onclose) === null || _b === void 0 ? void 0 : _b.call(this);
    }
    async send(message) {
        var _a, _b, _c;
        try {
            const headers = await this._commonHeaders();
            headers.set("content-type", "application/json");
            headers.set("accept", "application/json, text/event-stream");
            const init = {
                ...this._requestInit,
                method: "POST",
                headers,
                body: JSON.stringify(message),
                signal: (_a = this._abortController) === null || _a === void 0 ? void 0 : _a.signal,
            };
            const response = await fetch(this._url, init);
            // Handle session ID received during initialization
            const sessionId = response.headers.get("mcp-session-id");
            if (sessionId) {
                this._sessionId = sessionId;
            }
            if (!response.ok) {
                if (response.status === 401 && this._authProvider) {
                    const result = await auth(this._authProvider, { serverUrl: this._url });
                    if (result !== "AUTHORIZED") {
                        throw new UnauthorizedError();
                    }
                    // Purposely _not_ awaited, so we don't call onerror twice
                    return this.send(message);
                }
                const text = await response.text().catch(() => null);
                throw new Error(`Error POSTing to endpoint (HTTP ${response.status}): ${text}`);
            }
            // If the response is 202 Accepted, there's no body to process
            if (response.status === 202) {
                // if the accepted notification is initialized, we start the SSE stream
                // if it's supported by the server
                if (isJSONRPCNotification(message) && message.method === "notifications/initialized") {
                    // We don't need to handle 405 here anymore as it's handled in _startOrAuthStandaloneSSE
                    this._startOrAuthStandaloneSSE().catch(err => { var _a; return (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, err); });
                }
                return;
            }
            // Get original message(s) for detecting request IDs
            const messages = Array.isArray(message) ? message : [message];
            const hasRequests = messages.filter(msg => "method" in msg && "id" in msg && msg.id !== undefined).length > 0;
            // Check the response type
            const contentType = response.headers.get("content-type");
            if (hasRequests) {
                if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("text/event-stream")) {
                    this._handleSseStream(response.body);
                }
                else if (contentType === null || contentType === void 0 ? void 0 : contentType.includes("application/json")) {
                    // For non-streaming servers, we might get direct JSON responses
                    const data = await response.json();
                    const responseMessages = Array.isArray(data)
                        ? data.map(msg => JSONRPCMessageSchema.parse(msg))
                        : [JSONRPCMessageSchema.parse(data)];
                    for (const msg of responseMessages) {
                        (_b = this.onmessage) === null || _b === void 0 ? void 0 : _b.call(this, msg);
                    }
                }
                else {
                    throw new StreamableHTTPError(-1, `Unexpected content type: ${contentType}`);
                }
            }
        }
        catch (error) {
            (_c = this.onerror) === null || _c === void 0 ? void 0 : _c.call(this, error);
            throw error;
        }
    }
}
//# sourceMappingURL=streamableHttp.js.map