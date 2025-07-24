export const idlFactory = ({ IDL }) => {
  const User = IDL.Record({
    'id' : IDL.Principal,
    'isGuest' : IDL.Bool,
    'createdAt' : IDL.Int,
    'walletAddress' : IDL.Opt(IDL.Text),
    'email' : IDL.Text,
    'lastName' : IDL.Text,
    'telegramId' : IDL.Opt(IDL.Text),
    'firstName' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'ok' : User, 'err' : IDL.Text });
  const ChatMessage = IDL.Record({
    'id' : IDL.Text,
    'metadata' : IDL.Record({
      'imageEnabled' : IDL.Bool,
      'searchEnabled' : IDL.Bool,
    }),
    'userId' : IDL.Principal,
    'userMessage' : IDL.Text,
    'conversationId' : IDL.Text,
    'timestamp' : IDL.Int,
    'aiResponse' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Vec(ChatMessage), 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : ChatMessage, 'err' : IDL.Text });
  return IDL.Service({
    'createGuestUser' : IDL.Func([], [Result_2], []),
    'createUser' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [Result_2],
        [],
      ),
    'getAllMessages' : IDL.Func([], [IDL.Vec(ChatMessage)], ['query']),
    'getConversationMessages' : IDL.Func([IDL.Text], [Result], []),
    'getMessageCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getUser' : IDL.Func([], [Result_2], []),
    'getUserCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getUserMessages' : IDL.Func([], [Result], []),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'saveMessage' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Bool, IDL.Bool],
        [Result_1],
        [],
      ),
    'searchMessages' : IDL.Func([IDL.Text], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
