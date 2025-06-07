'use client'

import { Calendar, Upload, Inbox, FileText, Loader, AlertTriangle } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { useEffect } from "react";
import { usePdfStore } from "@/store/store";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  { title: "Upload PDF", icon: Upload },
  { title: "Uploaded PDF", icon: Inbox },
  { title: "Current Session", icon: Calendar },
];

export function AppSidebar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const { getToken } = useAuth();
  
  const setShowRecent = usePdfStore((state) => state.setShowRecent);
  const {setShowUploaded } = usePdfStore();

  const getHistory = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError("You need to be signed in to view history.");
        return;
      }

      const response = await fetch("http://localhost:8000/chat/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
   
      console.log("Fetched history:", data);

      const titles = data.map((group: any) => group.title || "Untitled Chat");
      setHistory(titles);
      localStorage.setItem("chatHistory", JSON.stringify(data));
      
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to fetch history. Please try again.");
    }
  };

   useEffect(() => {
      getHistory();
   }, []);

   


 

   // Fetch history on initial render
  const handleItemClick = async (title: string) => {
    if (title === "Upload PDF") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/pdf";

      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("pdf", file);
        setLoading(true);
        setError(null);
        setShowRecent(-1);
        setShowUploaded(false);

        try {
          const token = await getToken();
          const response = await fetch("http://localhost:8000/upload/pdf", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (!response.ok) throw new Error("Upload failed");
          console.log("File uploaded successfully:", file);
          await getHistory(); // Refresh history
        } catch (err) {
          console.error("Upload error:", err);
          setError("Failed to upload file. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      input.click();
    } else if (title === "Uploaded PDF") {
      await getHistory();
      setShowRecent(-1);
      setShowUploaded(true);
    }else if (title === "Current Session") {
      setShowRecent(-1);
      setShowUploaded(false);
    }
  };



  return (
    <>
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <div className="flex">
              <SidebarGroupLabel className="text-lg px-2">Chat With PDF <FileText /></SidebarGroupLabel>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>

                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <div
                        className="flex items-center gap-2 cursor-pointer px-2 py-1 hover:bg-gray-100 rounded"
                        onClick={() => handleItemClick(item.title)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        {item.title=== "Upload PDF"&&loading && (
                          <div className="flex pl-10 rounded ">
                          <Loader className="animate-spin text-white" />
                         </div>
                        )} 
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                

                <div className="pt-4">
                  <div className="text-lg pl-2">Recents</div>
                  <div className="flex flex-col items-start w-full overflow-y-auto max-h-96 gap-1 p-2">
                    {history.length > 0 ? (
                      history.map((title, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 cursor-pointer px-2 py-1 text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white rounded"
                          onClick={() => {
                            setShowRecent(index);
                          }}
                        >
                         <div>{title}.</div> 
                         

                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-400 px-2">No recent history</div>
                    )}
                  </div>
                </div>

                <div className="fixed bottom-1 flex pl-3 pb-2">
                  <UserButton />
                  <h3 className="pl-3 font-semibold pt-1">Sign Out</h3>
                </div>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
}
