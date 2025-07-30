import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ChatMessage {
  'id' : string,
  'metadata' : { 'imageEnabled' : boolean, 'searchEnabled' : boolean },
  'userId' : Principal,
  'userMessage' : string,
  'conversationId' : string,
  'timestamp' : bigint,
  'aiResponse' : string,
}
export type Result = { 'ok' : Array<ChatMessage> } |
  { 'err' : string };
export type Result_1 = { 'ok' : ChatMessage } |
  { 'err' : string };
export type Result_2 = { 'ok' : User } |
  { 'err' : string };
export interface User {
  'id' : Principal,
  'isGuest' : boolean,
  'createdAt' : bigint,
  'walletAddress' : [] | [string],
  'email' : string,
  'lastName' : string,
  'telegramId' : [] | [string],
  'firstName' : string,
}
export interface _SERVICE {
  'createGuestUser' : ActorMethod<[], Result_2>,
  'createUser' : ActorMethod<
    [string, string, string, [] | [string], [] | [string]],
    Result_2
  >,
  'getAllMessages' : ActorMethod<[], Array<ChatMessage>>,
  'getConversationMessages' : ActorMethod<[string], Result>,
  'getMessageCount' : ActorMethod<[], bigint>,
  'getUser' : ActorMethod<[], Result_2>,
  'getUserCount' : ActorMethod<[], bigint>,
  'getUserMessages' : ActorMethod<[], Result>,
  'greet' : ActorMethod<[string], string>,
  'saveMessage' : ActorMethod<
    [string, string, string, string, boolean, boolean],
    Result_1
  >,
  'searchMessages' : ActorMethod<[string], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
