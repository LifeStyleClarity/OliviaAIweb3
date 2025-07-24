import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Iter "mo:base/Iter";

actor {
  // Types
  public type User = {
    id: Principal;
    firstName: Text;
    lastName: Text;
    email: Text;
    telegramId: ?Text;
    walletAddress: ?Text;
    isGuest: Bool;
    createdAt: Int;
  };

  public type ChatMessage = {
    id: Text;
    userId: Principal;
    userMessage: Text;
    aiResponse: Text;
    timestamp: Int;
    conversationId: Text;
    metadata: {
      searchEnabled: Bool;
      imageEnabled: Bool;
    };
  };

  // Storage
  private stable var userEntries : [(Principal, User)] = [];
  private stable var messageEntries : [(Text, ChatMessage)] = [];

  private var users = HashMap.HashMap<Principal, User>(10, Principal.equal, Principal.hash);
  private var messages = HashMap.HashMap<Text, ChatMessage>(100, Text.equal, Text.hash);

  // System functions for upgrades
  system func preupgrade() {
    userEntries := Iter.toArray(users.entries());
    messageEntries := Iter.toArray(messages.entries());
  };

  system func postupgrade() {
    users := HashMap.fromIter<Principal, User>(userEntries.vals(), userEntries.size(), Principal.equal, Principal.hash);
    messages := HashMap.fromIter<Text, ChatMessage>(messageEntries.vals(), messageEntries.size(), Text.equal, Text.hash);
  };

  // Basic greeting function
  public query func greet(name : Text) : async Text {
    "Hello, " # name # "! Welcome to Olivia AI on the Internet Computer! 🚀"
  };

  // User management functions
  public shared(msg) func createUser(firstName: Text, lastName: Text, email: Text, telegramId: ?Text, walletAddress: ?Text) : async Result.Result<User, Text> {
    let caller = msg.caller;
    
    switch (users.get(caller)) {
      case (?existingUser) {
        #err("User already exists")
      };
      case null {
        let newUser: User = {
          id = caller;
          firstName = firstName;
          lastName = lastName;
          email = email;
          telegramId = telegramId;
          walletAddress = walletAddress;
          isGuest = false;
          createdAt = Time.now();
        };
        
        users.put(caller, newUser);
        #ok(newUser)
      };
    }
  };

  public shared(msg) func createGuestUser() : async Result.Result<User, Text> {
    let caller = msg.caller;
    
    switch (users.get(caller)) {
      case (?existingUser) {
        #ok(existingUser) // Return existing user
      };
      case null {
        let newUser: User = {
          id = caller;
          firstName = "Guest";
          lastName = "User";
          email = "guest@olivia.ai";
          telegramId = null;
          walletAddress = null;
          isGuest = true;
          createdAt = Time.now();
        };
        
        users.put(caller, newUser);
        #ok(newUser)
      };
    }
  };

  public shared(msg) func getUser() : async Result.Result<User, Text> {
    let caller = msg.caller;
    
    switch (users.get(caller)) {
      case (?user) { #ok(user) };
      case null { #err("User not found") };
    }
  };

  // Message storage functions
  public shared(msg) func saveMessage(messageId: Text, userMessage: Text, aiResponse: Text, conversationId: Text, searchEnabled: Bool, imageEnabled: Bool) : async Result.Result<ChatMessage, Text> {
    let caller = msg.caller;
    
    let newMessage: ChatMessage = {
      id = messageId;
      userId = caller;
      userMessage = userMessage;
      aiResponse = aiResponse;
      timestamp = Time.now();
      conversationId = conversationId;
      metadata = {
        searchEnabled = searchEnabled;
        imageEnabled = imageEnabled;
      };
    };
    
    messages.put(messageId, newMessage);
    #ok(newMessage)
  };

  public shared(msg) func getUserMessages() : async Result.Result<[ChatMessage], Text> {
    let caller = msg.caller;
    
    let userMessages = Array.filter<ChatMessage>(
      Iter.toArray(Iter.map<(Text, ChatMessage), ChatMessage>(messages.entries(), func((_, msg)) = msg)),
      func(message) = Principal.equal(message.userId, caller)
    );
    
    #ok(userMessages)
  };

  public shared(msg) func getConversationMessages(conversationId: Text) : async Result.Result<[ChatMessage], Text> {
    let caller = msg.caller;
    
    let conversationMessages = Array.filter<ChatMessage>(
      Iter.toArray(Iter.map<(Text, ChatMessage), ChatMessage>(messages.entries(), func((_, msg)) = msg)),
      func(message) = Principal.equal(message.userId, caller) and Text.equal(message.conversationId, conversationId)
    );
    
    #ok(conversationMessages)
  };

  public shared(msg) func searchMessages(searchQuery: Text) : async Result.Result<[ChatMessage], Text> {
    let caller = msg.caller;
    
    let searchResults = Array.filter<ChatMessage>(
      Iter.toArray(Iter.map<(Text, ChatMessage), ChatMessage>(messages.entries(), func((_, msg)) = msg)),
      func(message) = Principal.equal(message.userId, caller) and (
        Text.contains(message.userMessage, #text searchQuery) or Text.contains(message.aiResponse, #text searchQuery)
      )
    );
    
    #ok(searchResults)
  };

  // Statistics functions
  public query func getMessageCount() : async Nat {
    messages.size()
  };

  public query func getUserCount() : async Nat {
    users.size()
  };

  // Admin function to see all messages (for testing)
  public query func getAllMessages() : async [ChatMessage] {
    Iter.toArray(Iter.map<(Text, ChatMessage), ChatMessage>(messages.entries(), func((_, msg)) = msg))
  };
} 