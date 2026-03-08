"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { ENDPOINTS } from "@/lib/api-config";
import { useApi } from "@/hooks/use-api";
import { ActiveChat } from "@/components/features/messages/ActiveChat";
import { toast } from "sonner";

export default function MessageDetailPage() {
    const params = useParams();
    const groupId = params.id as string;

    const [message, setMessage] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [isScriptureModalOpen, setIsScriptureModalOpen] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: recentMessagesData } = useApi<{ groups: any[] }>(
        ENDPOINTS.GROUPS_WITH_RECENT_MESSAGES
    );

    const selectedChat = recentMessagesData?.groups?.find((g: any) => g.id === groupId);

    const { data: messagesData, mutate: mutateMessages } = useApi<{ messages: any[] }>(
        groupId ? ENDPOINTS.GROUP_MESSAGES(groupId) : null,
        { refreshInterval: 2000 }
    );

    const messages = messagesData?.messages || [];

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (content: string, audio?: Blob, fileInfo?: { file: File; type: string }) => {
        if ((!content.trim() && !audio && !fileInfo) || !groupId) return;

        try {
            const token = localStorage.getItem("auth_token");
            const formData = new FormData();

            if (content.trim()) {
                formData.append("content", content);
            }
            if (audio) {
                formData.append("audio", audio, "voice-note.webm");
            }
            if (fileInfo) {
                const fieldName = fileInfo.type === 'image' ? 'image' : fileInfo.type === 'video' ? 'video' : 'audio';
                formData.append(fieldName, fileInfo.file);
            }

            const response = await fetch(ENDPOINTS.GROUP_MESSAGES(groupId), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                setMessage("");
                setAudioBlob(null);
                setSelectedMedia(null);
                setMediaPreview(null);
                setMediaType(null);
                mutateMessages();
            } else {
                toast.error("Failed to send message");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error("An error occurred");
        }
    };

    const handleSendScripture = (verse: any) => {
        const content = `📖 ${verse.ref}: "${verse.text}"`;
        handleSendMessage(content);
        setIsScriptureModalOpen(false);
    };

    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        } else {
            setAudioBlob(null);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;

                const chunks: BlobPart[] = [];
                mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
                mediaRecorder.onstop = () => {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    setAudioBlob(blob);
                    stream.getTracks().forEach(track => track.stop());
                    toast.success("Voice note captured!", {
                        action: {
                            label: "Send",
                            onClick: () => handleSendMessage("", blob)
                        },
                    });
                };

                mediaRecorder.start();
                setIsRecording(true);
                setRecordingDuration(0);
                timerRef.current = setInterval(() => {
                    setRecordingDuration(prev => prev + 1);
                }, 1000);
            } catch (err) {
                console.error("Recording error:", err);
                toast.error("Could not access microphone");
            }
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setMessage(prev => prev + emoji);
    };

    return (
        <ActiveChat
            selectedChat={selectedChat}
            messages={messages}
            message={message}
            setMessage={setMessage}
            onSendMessage={handleSendMessage}
            onSendScripture={handleSendScripture}
            onEmojiClick={handleEmojiClick}
            toggleRecording={toggleRecording}
            isRecording={isRecording}
            recordingDuration={recordingDuration}
            audioBlob={audioBlob}
            setAudioBlob={setAudioBlob}
            isScriptureModalOpen={isScriptureModalOpen}
            setIsScriptureModalOpen={setIsScriptureModalOpen}
            scrollRef={scrollRef}
            // Media props
            selectedMedia={selectedMedia}
            setSelectedMedia={setSelectedMedia}
            mediaPreview={mediaPreview}
            setMediaPreview={setMediaPreview}
            mediaType={mediaType}
            setMediaType={setMediaType}
        />
    );
}