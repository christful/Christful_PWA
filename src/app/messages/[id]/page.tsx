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

        const uploadMediaToCloudinary = async (file: File | Blob, type: 'image' | 'video' | 'audio') => {
            const cloudForm = new FormData();
            cloudForm.append('file', file);
            cloudForm.append('upload_preset', 'medias');
            const folder = type === 'video' ? 'chat-videos' : type === 'image' ? 'chat-images' : 'chat-audio';
            cloudForm.append('folder', folder);
            if (type === 'video') {
                cloudForm.append('resource_type', 'video');
            }
            cloudForm.append('quality', 'auto');

            const uploadUrl =
                type === 'video'
                    ? 'https://api.cloudinary.com/v1_1/dskxvlrhq/video/upload'
                    : type === 'image'
                    ? 'https://api.cloudinary.com/v1_1/dskxvlrhq/image/upload'
                    : 'https://api.cloudinary.com/v1_1/dskxvlrhq/raw/upload';

            const uploadRes = await fetch(uploadUrl, {
                method: 'POST',
                body: cloudForm,
            });

            if (!uploadRes.ok) {
                throw new Error('Failed to upload media to Cloudinary');
            }

            const uploadData = await uploadRes.json();
            return uploadData.secure_url as string;
        };

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            let mediaUrl: string | null = null;
            let detectedMediaType: 'image' | 'video' | 'audio' | null = null;

            if (fileInfo) {
                detectedMediaType = fileInfo.type as 'image' | 'video' | 'audio';
                mediaUrl = await uploadMediaToCloudinary(fileInfo.file, detectedMediaType);
            }

            if (audio) {
                detectedMediaType = 'audio';
                mediaUrl = await uploadMediaToCloudinary(audio, 'audio');
            }

            const messageBody: any = {};
            if (content.trim()) {
                messageBody.content = content.trim();
            }
            if (mediaUrl && detectedMediaType) {
                if (detectedMediaType === 'image') messageBody.imageUrl = mediaUrl;
                else if (detectedMediaType === 'video') messageBody.videoUrl = mediaUrl;
                else if (detectedMediaType === 'audio') messageBody.audioUrl = mediaUrl;
            }

            const response = await fetch(ENDPOINTS.GROUP_MESSAGES_POST(groupId), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(messageBody),
            });

            if (response.ok) {
                setMessage('');
                setAudioBlob(null);
                setSelectedMedia(null);
                setMediaPreview(null);
                setMediaType(null);
                mutateMessages();
            } else {
                toast.error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('An error occurred');
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