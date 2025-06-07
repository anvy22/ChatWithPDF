'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import ReactMarkdown from "react-markdown";
import {useAuth}  from "@clerk/nextjs";
import { usePdfStore } from "@/store/store";
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash }  from "lucide-react";



interface IMessage {
  role: "user" | "assistant";
  content?: string;
  document?: string;
  source?: string;

}
interface Tag {
  _id: string;
  pdfName: string;
  pdfPath: string;
  uploadedDate: string;
}




const Texter: React.FC = () => {
  const { getToken } = useAuth();
  const [message, setMessage] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [messages, setMessages] = React.useState<IMessage[]>([]);
  const [history, setHistory] = React.useState<any[]>([]);
  const [centerInput, setCenterInput] =React.useState(true); 
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteInput, setDeleteInput] = React.useState('');
  const [selectedTag, setSelectedTag] = React.useState<Tag | null>(null);
  const [deleteError, setDeleteError] = React.useState('');


  const showRecent = usePdfStore((state) => state.showRecent);
  const { showUploaded } = usePdfStore();



 
  

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };


const formatDateFriendly = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const handleDelete = (tag:Tag) => {
   
  console.log("Deleting tag:", tag);

}

 React.useEffect(() => {

  const chatHistory = JSON.parse(localStorage.getItem("chatHistory") || "[]");
  setHistory(chatHistory);
   
  console.log("Chat history loaded:", chatHistory);
  
}, []);
  
  
React.useEffect(() => {
  if (showUploaded) {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const response = await fetch("http://localhost:8000/uploaded/pdfs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch tags");
        }

        const data = await response.json();
        console.log("Datas fetched:", data);
        setTags(data);
        console.log("Fetched tags:", data);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };

    fetchData(); // <-- Call it here
  }
}, [showUploaded]);



  const handleChatMessage = async () => {
    try {

      setLoading(true);
      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setCenterInput(false);
     
      
      const token = await getToken();

      const res = await fetch(`http://localhost:8000/chat?message=${encodeURIComponent(message)}
      `, {
        headers: {
          Authorization: `Bearer ${token}`, 
        },
        method: "GET",  
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data?.answer,
            document: data?.context[0]?.metadata?.loc.pageNumber,
            source: data?.context[0]?.metadata?.source
          }
        ]);
        console.log("Response from server:", data);
        setMessage('');
      } else {
        console.error("Error from server:", data);
      }
    } catch (error) {
      console.error("Network or server error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Choose message source based on showRecent
  const renderMessages =
    showRecent === -1
      ? messages
      : history[showRecent+1]?.chats?.flatMap((chat: any) => chat.messages) || [];

  

  console.log("tags:", tags);

  return (
  <>   
        
        {showDeleteModal && selectedTag && (
  <div className="fixed inset-0  flex items-center justify-center z-50 text-black">
    <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
      <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
      <p className="mb-2">
        Type <span className="font-bold">{selectedTag.pdfName}</span> to confirm deletion.
      </p>
      <Input
        className="border border-gray-300 rounded-md p-2 mb-2"
        placeholder="Retype PDF name"
        value={deleteInput}
        onChange={(e) => setDeleteInput(e.target.value)}
      />
      {deleteError && <p className="text-red-500 text-sm mt-1">{deleteError}</p>}

      <div className="flex justify-end mt-4 gap-2">
        <Button  onClick={() => setShowDeleteModal(false)} className="bg-white text-black shadow-2xl hover: px-4 py-2 rounded shadow-sm transition">Cancel</Button>
        <Button
          className="bg-red-600 text-white shadow-2xl hover:bg-red-700 px-4 py-2 rounded shadow-sm transition"
          onClick={async () => {
            if (deleteInput.trim() === selectedTag.pdfName) {
              try {
                const token = await getToken();
                const res = await fetch(`http://localhost:8000/delete/pdf?pdfPath=${encodeURIComponent(selectedTag.pdfPath)}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                  method: 'GET',
                });

                if (res.ok) {
                  setTags((prev) => prev.filter((t) => t._id !== selectedTag._id));
                  setShowDeleteModal(false);
                } else {
                  const data = await res.json();
                  setDeleteError(data?.message || "Failed to delete.");
                }
              } catch (err) {
                console.error("Deletion error:", err);
                setDeleteError("Something went wrong.");
              }
            } else {
              setDeleteError("PDF name doesn't match. Please retry.");
            }
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  </div>
)}



        {showUploaded && (
                <div className="flex pt-6 md:pt-10 px-4 md:pl-65  ">
                   <ScrollArea className="w-full md:w-[60vw] rounded-md border">
                      <div className="p-4 ">
                           <h1 className="mb-4 text-lg font-bold leading-none ">Uploads</h1>
                           {tags.length > 0 ? (
                            tags.map((tag) => (
                            <React.Fragment key={tag._id}>
                              <div className="text-md items-center flex justify-between">
                               <span> {tag.pdfName}</span>
                               <div className="flex items-center gap-8">
                                <span className="text-xs text-gray-500 ml-2 ">
                                    {formatDateFriendly(tag.uploadedDate)}
                                </span>
                                <Trash 
                                    onClick={() => {
                                    setSelectedTag(tag);
                                    setShowDeleteModal(true);
                                    setDeleteInput('');
                                    setDeleteError('');
                                                 }} 
                                    className="cursor-pointer"
                                    />
                                </div>
                              </div>
                                  <Separator className="my-2" />
                            </React.Fragment>
                           ))
                  ) : (
                            <div className="text-sm italic text-gray-500">No Uploads found</div>
                      
                      )}
                </div>
            </ScrollArea>
          </div>
         )}


      
      { !showUploaded && (
      <div className="flex flex-col h-screen w-[80vw] pl-90">
        <div className="h-[90vh] overflow-y-auto p-4 hide-scrollbar">
          {renderMessages.map((msg: any, index: number) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
              <div
                className={`p-3 rounded-lg max-w-xl whitespace-pre-wrap ${
                  msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
                }`}
              >
                <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
                {msg.document && (
                  <div className="text-xs text-gray-500 mt-1">Document Page: {msg.document}</div>
                )}
                {msg.source && (
                  <div className="text-xs text-gray-500 mt-1">
                    Source: {msg.source?.split("\\").pop()?.split("-").pop() || 'Unknown'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        
        <div
             className={`transition-all duration-700 ease-in-out transform ${
             centerInput && showRecent==-1 ? "h-screen " : "h-[5vh] items-end"
              } flex justify-center`}
    >
            <div className="flex w-[80vw] gap-2">
               <Input
               type="text"
               placeholder="Ask Questions..."
               className="flex-grow"
               value={message}
               onChange={handleInputChange}
               onKeyDown={(e) => {
               if (e.key === "Enter" && !e.shiftKey) {
               e.preventDefault();
               if (message.trim()) handleChatMessage();
              }
             }}
             />
                <Button variant="outline" disabled={!message.trim()} onClick={handleChatMessage}>
                    {loading ? "Loading..." : "Send"}
                </Button>
           </div>
       </div>
   </div> )}
</>
  );
};


export default Texter;
