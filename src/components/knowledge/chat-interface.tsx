// "use client";

// import { useChat } from "@ai-sdk/react";
// import { DefaultChatTransport } from "ai";
// import { useState, useRef, useEffect } from "react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import rehypeHighlight from "rehype-highlight";
// import rehypeRaw from "rehype-raw";
// import { Button } from "@/components/ui/button";
// import { Loader2, Send, User, Bot } from "lucide-react";
// import { toast } from "sonner";

// interface ChatInterfaceProps {
//   knowledgeBaseId: string;
//   knowledgeBaseName: string;
//   projectId: string;
// }

// export function ChatInterface({
//   knowledgeBaseId,
//   knowledgeBaseName,
//   projectId,
// }: ChatInterfaceProps) {
//   const [input, setInput] = useState("");
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const [hasShownWelcome, setHasShownWelcome] = useState(false);

//   const { messages, sendMessage, status, error } = useChat({
//     transport: new DefaultChatTransport({
//       api: "/api/chat",
//       prepareSendMessagesRequest: ({ id, messages }) => {
//         return {
//           body: {
//             id,
//             knowledgeBaseId,
//             projectId,
//             messages,
//           },
//         };
//       },
//     }),
//   });

//   // Show welcome message once
//   useEffect(() => {
//     console.log("Messages length:", JSON.stringify(messages));
//     if (!hasShownWelcome && messages.length === 0) {
//       setHasShownWelcome(true);
//     }
//   }, [messages.length, hasShownWelcome]);

//   // Scroll to bottom when messages change
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Show error toast
//   useEffect(() => {
//     if (error) {
//       toast.error(error.message || "An error occurred");
//     }
//   }, [error]);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (input.trim() && status === "ready") {
//       sendMessage({ text: input });
//       setInput("");
//     }
//   };

//   const isLoading = status !== "ready";

//   // Helper to extract text from message parts
//   const getMessageText = (message: any): string => {
//     if (message.parts && Array.isArray(message.parts)) {
//       return message.parts
//         .filter((part: any) => part.type === "text")
//         .map((part: any) => part.text || "")
//         .join("");
//     }
//     return "";
//   };

//   return (
//     <div className="flex h-full flex-col overflow-hidden">
//       {/* Messages - Scrollable Area */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        
       

//         {/* Chat Messages */}
//         {messages.map((message) => {
//           const messageText = getMessageText(message);
//           const isUser = message.role === "user";

//           return (
//             <div
//               key={message.id}
//               className={`flex gap-3 ${isUser ? "justify-end" : ""}`}
//             >
//               {!isUser && (
//                 <div className="flex-shrink-0">
//                   <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
//                     <Bot className="h-5 w-5 text-primary" />
//                   </div>
//                 </div>
//               )}

//               <div
//                 className={`rounded-lg px-4 py-3 max-w-[80%] ${
//                   isUser ? "bg-primary text-primary-foreground" : "bg-muted"
//                 }`}
//               >
//                 {isUser ? (
//                   <div className="text-sm whitespace-pre-wrap break-words">
//                     {messageText}
//                   </div>
//                 ) : (
//                   <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-gray-900 prose-pre:text-gray-100">
//                     <ReactMarkdown
//                       remarkPlugins={[remarkGfm]}
//                       rehypePlugins={[rehypeHighlight, rehypeRaw]}
//                       components={{
//                         code: ({
//                           node,
//                           inline,
//                           className,
//                           children,
//                           ...props
//                         }: any) => {
//                           return !inline ? (
//                             <code className={className} {...props}>
//                               {children}
//                             </code>
//                           ) : (
//                             <code
//                               className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-sm"
//                               {...props}
//                             >
//                               {children}
//                             </code>
//                           );
//                         },
//                       }}
//                     >
//                       {messageText}
//                     </ReactMarkdown>
//                   </div>
//                 )}
//               </div>

//               {isUser && (
//                 <div className="flex-shrink-0">
//                   <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
//                     <User className="h-5 w-5 text-primary-foreground" />
//                   </div>
//                 </div>
//               )}
//             </div>
//           );
//         })}

//         {/* Loading Indicator */}
//         {isLoading && (
//           <div className="flex gap-3">
//             <div className="flex-shrink-0">
//               <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
//                 <Bot className="h-5 w-5 text-primary" />
//               </div>
//             </div>
//             <div className="rounded-lg px-4 py-3 bg-muted">
//               <div className="flex items-center gap-2">
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 <span className="text-sm text-muted-foreground">
//                   Thinking...
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}

//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input Form - Fixed at Bottom */}
//       <div className="border-t bg-background p-4 flex-shrink-0">
//         <form onSubmit={handleSubmit} className="flex gap-2 items-center">
//           <div className="flex-1 relative">
//             <textarea
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" && !e.shiftKey) {
//                   e.preventDefault();
//                   handleSubmit(e);
//                 }
//               }}
//               placeholder="Ask a question about your documents..."
//               disabled={status !== "ready"}
//               className="w-full min-h-[60px] max-h-[200px] resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
//               rows={2}
//             />
//             <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
//               {input.length > 0 && `${input.length} chars`}
//             </div>
//           </div>
//           <Button
//             type="submit"
//             disabled={status !== "ready" || !input.trim()}
//             size="icon"
//             className="h-[44px] w-[44px] rounded-lg"
//           >
//             {isLoading ? (
//               <Loader2 className="h-5 w-5 animate-spin" />
//             ) : (
//               <Send className="h-5 w-5" />
//             )}
//           </Button>
//         </form>
//         <p className="mt-2 text-xs text-muted-foreground text-center">
//           Press Enter to send, Shift+Enter for new line
//         </p>
//       </div>
//     </div>
//   );
// }


"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Button } from "@/components/ui/button";
import { Loader2, Send, User, Bot } from "lucide-react";
import { toast } from "sonner";

interface ChatInterfaceProps {
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  projectId: string;
}

export function ChatInterface({
  knowledgeBaseId,
  knowledgeBaseName,
  projectId,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ id, messages }) => {
        return {
          body: {
            id,
            knowledgeBaseId,
            projectId,
            messages,
          },
        };
      },
    }),
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error.message || "An error occurred");
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const isLoading = status !== "ready";

  // Helper to extract text from message parts
  // ChatInterface.tsx  (only getMessageText changed slightly)
  const getMessageText = (message: any): string => {
    if (Array.isArray(message.parts)) {
      return message.parts
        .filter(
          (part: any) =>
            part && part.type === "text" && typeof part.text === "string"
        )
        .map((part: any) => part.text as string)
        .join("");
    }
    return "";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages + empty state */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Empty state hero (when no messages yet) */}
          {messages.length === 0 && !isLoading && (
            <div className="pt-8 pb-4 text-center">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                What do you want to create?
              </h1>
              <p className="mt-3 text-sm md:text-base text-slate-500">
                Start building with a single prompt. No coding needed.
              </p>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((message) => {
            const messageText = getMessageText(message);
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? "justify-end" : ""}`}
              >
                {!isUser && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                )}

                <div
                  className={`rounded-lg px-4 py-3 max-w-[80%] ${
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {isUser ? (
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {messageText}
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-gray-900 prose-pre:text-gray-100">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight, rehypeRaw]}
                        components={{
                          code: ({
                            node,
                            inline,
                            className,
                            children,
                            ...props
                          }: any) => {
                            return !inline ? (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            ) : (
                              <code
                                className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-sm"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {messageText}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="rounded-lg px-4 py-3 bg-muted">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form - fixed at bottom, matching clean layout */}
      <div className=" border-gray-200 bg-[#f3f4f6] px-4 py-4 flex-shrink-0">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl gap-2 items-center"
        >
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={`Ask a question about your profile...`}
              disabled={status !== "ready"}
              className="w-full min-h-[60px] max-h-[200px] resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={2}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {input.length > 0 && `${input.length} chars`}
            </div>
          </div>
          <Button
            type="submit"
            disabled={status !== "ready" || !input.trim()}
            size="icon"
            className="h-[44px] w-[44px] rounded-lg"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
