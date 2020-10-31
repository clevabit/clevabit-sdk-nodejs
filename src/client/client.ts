import { cborDecode, cborEncode } from "../cbor/codec";
import { Authorization } from "./authorization";
import { ApiError } from "./error";
import { UUID } from "./uuid";
import fetch, { Response } from "node-fetch";
import { decode } from "jws";

export enum Environment {
  Sandbox = "https://sandbox.clevabit.com/api/v1",
  Galaxy = "https://galaxy.clevabit.com/api/v1",
  ProdEu = "https://prod-eu.clevabit.com/api/v1"
}

export async function newClient(environment: Environment, clientId: UUID,
                                clientKey: string, customerId: UUID): Promise<Client> {

  const client = new Client0(environment, clientId, clientKey, customerId);
  await client.login();
  return client;
}

export interface Client {
  execute<T extends any>(method: string, path: string, body?: { [key: string]: any }): Promise<T>
  withBearer<R>(cb: (bearer: string) => Promise<R>): Promise<R>
}

class Client0 implements Client {
  private readonly environment: Environment;
  private readonly clientId: UUID;
  private readonly clientKey: string;
  private readonly customerId: UUID;

  private bearer: string = "";
  private token: Token = {iat: 0, exp: 0};

  constructor(environment: Environment, clientId: UUID, clientKey: string, customerId: UUID) {
    this.environment = environment;
    this.clientId = clientId;
    this.clientKey = clientKey;
    this.customerId = customerId;
  }

  async execute<T extends any>(method: string, path: string, body?: { [key: string]: any }): Promise<T> {
    const response = await this.executeRaw(method, path, body);
    return await this.unwind(response) as T;
  }

  async executeRaw(method: string, path: string, body?: { [key: string]: any }): Promise<Response> {
    const url = `${this.environment}${replaceAll(path, "{customerId}", this.customerId.toString())}`;
    return this.withBearer(async (bearer) => {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: {
          "Authorization": `Bearer ${bearer}`
        },
        body: body !== undefined ? new Uint8Array(cborEncode(body)).buffer : undefined
      })

      if (response.status < 200 || response.status >= 300) {
        const body = await this.unwind(response);
        if (typeof body === "string") {
          throw new ApiError(body, undefined, response.status);
        }
        const err = body as InternalError;
        throw new ApiError(err.message, err.code, response.status);
      }

      return response;
    });
  }

  async login(): Promise<void> {
    this.bearer = await this.authenticate();
    this.token = this.decodeBearer(this.bearer);
  }

  async withBearer<R>(cb: (bearer: string) => Promise<R>): Promise<R> {
    if (this.aboutToExpire(this.token)) {
      // Renew login
      await this.login();
    }
    return cb(this.bearer);
  }

  private async unwind<T extends any>(response: Response): Promise<T | string> {
    const mime = response.headers.get("content-type");
    if (mime === "application/json") {
      return await response.json() as T;
    } else if (mime === "text/plain") {
      return await response.text();
    }
    const buffer = await response.buffer()
    return cborDecode(buffer) as T;
  }

  private async authenticate(): Promise<string> {
    const response = await fetch(`${this.environment}/auth`, {
      method: "POST",
      headers: {
        "x-app-id": this.clientId.toString(),
        "x-app-key": this.clientKey,
        "x-app-cid": this.customerId.toString()
      }
    });

    if (response.status != 200) {
      throw new Error(response.statusText);
    }

    const buffer = await response.buffer()
    const authorization = cborDecode<Authorization>(buffer);
    return authorization.token;
  }

  private decodeBearer(token: string): Token {
    const signature = decode(token);
    const payload = signature.payload;

    if (typeof payload === "string") {
      return JSON.parse(payload) as Token;
    }
    return payload as Token;
  }

  private aboutToExpire(token: Token): boolean {
    const exp = Math.floor(token.exp);
    const current = Math.floor(Date.now() / 1000);
    return exp - current < secondsBeforeRenew;
  }
}

const secondsBeforeRenew = 60;

interface Token {
  iat: number
  exp: number
}

interface InternalError {
  message: string
  code?: string
}

const nativeStringReplaceAll = (String.prototype as any).replaceAll;
const replaceAll = (str: string, search: string, replace: string): string => {
  return nativeStringReplaceAll ?
    nativeStringReplaceAll.call(str, search, replace) :
    str.split(search).join(replace);
};
